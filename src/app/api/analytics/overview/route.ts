import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema for analytics queries
const analyticsQuerySchema = z.object({
  formId: z.string().optional(),
  dateRange: z.enum(['7d', '30d', '90d', '1y', 'all']).default('30d'),
  includeFields: z.boolean().default(false),
});

interface DateRange {
  start: Date;
  end: Date;
}

function getDateRange(range: string): DateRange {
  const now = new Date();
  const start = new Date(now);
  
  switch (range) {
    case '7d':
      start.setDate(now.getDate() - 7);
      break;
    case '30d':
      start.setDate(now.getDate() - 30);
      break;
    case '90d':
      start.setDate(now.getDate() - 90);
      break;
    case '1y':
      start.setFullYear(now.getFullYear() - 1);
      break;
    case 'all':
      start.setFullYear(2000); // Very old date for "all time"
      break;
  }
  
  return { start, end: now };
}

// GET /api/analytics/overview - Get overview statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryData = analyticsQuerySchema.parse({
      formId: searchParams.get('formId'),
      dateRange: searchParams.get('dateRange'),
      includeFields: searchParams.get('includeFields'),
    });

    const dateRange = getDateRange(queryData.dateRange);
    const where: any = {
      submittedAt: {
        gte: dateRange.start,
        lte: dateRange.end,
      },
    };

    if (queryData.formId) {
      where.formId = queryData.formId;
    }

    // Get basic statistics
    const [
      totalResponses,
      newResponses,
      readResponses,
      flaggedResponses,
      uniqueForms,
      uniqueRespondents
    ] = await Promise.all([
      db.formResponse.count({ where }),
      db.formResponse.count({ 
        where: { ...where, status: 'NEW' } 
      }),
      db.formResponse.count({ 
        where: { ...where, status: 'READ' } 
      }),
      db.formResponse.count({ 
        where: { ...where, status: 'FLAGGED' } 
      }),
      queryData.formId ? 1 : db.form.count({
        where: {
          responses: { some: where },
        },
      }),
      db.formResponse.groupBy({
        by: ['respondentEmail'],
        where: {
          ...where,
          respondentEmail: { not: null },
        },
      }).then(groups => groups.length),
    ]);

    // Get response trends (daily counts)
    const responseTrends = await db.formResponse.groupBy({
      by: ['submittedAt'],
      where,
      _count: { id: true },
      orderBy: { submittedAt: 'asc' },
    });

    // Group by day for trend data
    const dailyTrends = new Map<string, number>();
    responseTrends.forEach(trend => {
      const date = trend.submittedAt.toISOString().split('T')[0];
      dailyTrends.set(date, (dailyTrends.get(date) || 0) + trend._count.id);
    });

    // Generate trend data for the date range
    const trendData = [];
    const currentDate = new Date(dateRange.start);
    while (currentDate <= dateRange.end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      trendData.push({
        date: dateStr,
        count: dailyTrends.get(dateStr) || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Get form-specific statistics if formId is provided
    let fieldAnalytics: any[] = [];
    if (queryData.formId && queryData.includeFields) {
      const form = await db.form.findUnique({
        where: { id: queryData.formId },
        include: {
          fields: {
            orderBy: { order: 'asc' },
          },
        },
      });

      if (form) {
        fieldAnalytics = await Promise.all(
          form.fields.map(async (field) => {
            const fieldResponses = await db.responseField.findMany({
              where: {
                fieldId: field.id,
                response: {
                  ...where,
                  formId: queryData.formId,
                },
              },
            });

            const responseCount = fieldResponses.length;
            const uniqueValues = [...new Set(fieldResponses.map(fr => fr.value))];
            
            // Calculate field-specific statistics
            let stats: any = {
              fieldId: field.id,
              label: field.label,
              type: field.type,
              totalResponses: responseCount,
              completionRate: form.responses.length > 0 ? (responseCount / form.responses.length) * 100 : 0,
            };

            // For choice fields, get option distribution
            if (['DROPDOWN', 'RADIO', 'CHECKBOX'].includes(field.type) && field.options) {
              const optionCounts = field.options.reduce((acc, option) => {
                acc[option] = fieldResponses.filter(fr => 
                  fr.value.includes(option)
                ).length;
                return acc;
              }, {} as Record<string, number>);

              stats.optionDistribution = optionCounts;
            }

            // For numeric fields, get basic statistics
            if (field.type === 'NUMBER' || field.type === 'RATING') {
              const numericValues = fieldResponses
                .map(fr => parseFloat(fr.value))
                .filter(v => !isNaN(v));

              if (numericValues.length > 0) {
                stats.average = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
                stats.min = Math.min(...numericValues);
                stats.max = Math.max(...numericValues);
              }
            }

            return stats;
          })
        );
      }
    }

    return NextResponse.json({
      overview: {
        totalResponses,
        newResponses,
        readResponses,
        flaggedResponses,
        uniqueForms,
        uniqueRespondents,
        responseRate: totalResponses > 0 ? 
          ((readResponses / totalResponses) * 100).toFixed(1) : '0',
      },
      trends: trendData,
      fieldAnalytics: queryData.includeFields ? fieldAnalytics : undefined,
      dateRange: queryData.dateRange,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
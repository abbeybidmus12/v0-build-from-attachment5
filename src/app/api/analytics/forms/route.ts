import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema for form analytics
const formAnalyticsSchema = z.object({
  dateRange: z.enum(['7d', '30d', '90d', '1y', 'all']).default('30d'),
  sortBy: z.enum(['responses', 'title', 'created']).default('responses'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  limit: z.string().transform(Number).default('10'),
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
      start.setFullYear(2000);
      break;
  }
  
  return { start, end: now };
}

// GET /api/analytics/forms - Get form performance analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryData = formAnalyticsSchema.parse({
      dateRange: searchParams.get('dateRange'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
      limit: searchParams.get('limit'),
    });

    const dateRange = getDateRange(queryData.dateRange);

    // Get all forms with their response counts
    const forms = await db.form.findMany({
      include: {
        _count: {
          select: { 
            responses: true,
            fields: true,
          },
        },
        responses: {
          where: {
            submittedAt: {
              gte: dateRange.start,
              lte: dateRange.end,
            },
          },
          select: {
            submittedAt: true,
            status: true,
          },
        },
      },
    });

    // Calculate analytics for each form
    const formAnalytics = forms.map(form => {
      const recentResponses = form.responses;
      const totalResponses = form._count.responses;
      const recentResponseCount = recentResponses.length;
      
      // Calculate completion time (simplified - would need more data for accurate calculation)
      const completionRate = totalResponses > 0 ? 
        (recentResponseCount / Math.max(1, totalResponses)) * 100 : 0;

      // Get response status distribution
      const statusDistribution = {
        new: recentResponses.filter(r => r.status === 'NEW').length,
        read: recentResponses.filter(r => r.status === 'READ').length,
        flagged: recentResponses.filter(r => r.status === 'FLAGGED').length,
        archived: recentResponses.filter(r => r.status === 'ARCHIVED').length,
      };

      // Calculate daily average responses
      const daysDiff = Math.max(1, Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)));
      const dailyAverage = recentResponseCount / daysDiff;

      return {
        id: form.id,
        title: form.title,
        description: form.description,
        status: form.status,
        totalResponses,
        recentResponseCount,
        completionRate: Math.round(completionRate * 100) / 100,
        dailyAverage: Math.round(dailyAverage * 100) / 100,
        fieldCount: form._count.fields,
        statusDistribution,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
      };
    });

    // Sort forms based on query parameters
    const sortedForms = [...formAnalytics].sort((a, b) => {
      let comparison = 0;
      
      switch (queryData.sortBy) {
        case 'responses':
          comparison = a.recentResponseCount - b.recentResponseCount;
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      
      return queryData.sortOrder === 'desc' ? -comparison : comparison;
    });

    // Limit results
    const limitedForms = sortedForms.slice(0, queryData.limit);

    // Calculate overall statistics
    const totalForms = forms.length;
    const activeForms = forms.filter(f => f.status === 'PUBLISHED').length;
    const totalResponsesAll = forms.reduce((sum, form) => sum + form._count.responses, 0);
    const recentResponsesAll = forms.reduce((sum, form) => sum + form.responses.length, 0);

    // Get top performing forms
    const topPerforming = limitedForms.slice(0, 5);

    // Get forms needing attention (published but few responses)
    const needingAttention = formAnalytics
      .filter(form => form.status === 'PUBLISHED' && form.recentResponseCount < 5)
      .slice(0, 5);

    return NextResponse.json({
      forms: limitedForms,
      summary: {
        totalForms,
        activeForms,
        totalResponses: totalResponsesAll,
        recentResponses: recentResponsesAll,
        averageResponsesPerForm: totalForms > 0 ? Math.round((totalResponsesAll / totalForms) * 100) / 100 : 0,
      },
      topPerforming,
      needingAttention,
      dateRange: queryData.dateRange,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error fetching form analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch form analytics' },
      { status: 500 }
    );
  }
}
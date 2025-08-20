import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema for export parameters
const exportQuerySchema = z.object({
  format: z.enum(['csv', 'excel']).default('csv'),
  formId: z.string().optional(),
  status: z.enum(['NEW', 'READ', 'FLAGGED', 'ARCHIVED']).optional(),
  dateRange: z.enum(['7d', '30d', '90d', '1y', 'all']).default('30d'),
  search: z.string().optional(),
  includeMetadata: z.boolean().default(true),
  fieldDelimiter: z.string().default(','),
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

function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// GET /api/responses/export - Export all responses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryData = exportQuerySchema.parse({
      format: searchParams.get('format'),
      formId: searchParams.get('formId'),
      status: searchParams.get('status'),
      dateRange: searchParams.get('dateRange'),
      search: searchParams.get('search'),
      includeMetadata: searchParams.get('includeMetadata'),
      fieldDelimiter: searchParams.get('fieldDelimiter'),
    });

    const dateRange = getDateRange(queryData.dateRange);
    
    // Build where clause
    const where: any = {
      submittedAt: {
        gte: dateRange.start,
        lte: dateRange.end,
      },
    };

    if (queryData.formId) {
      where.formId = queryData.formId;
    }

    if (queryData.status) {
      where.status = queryData.status;
    }

    if (queryData.search) {
      where.OR = [
        { respondentEmail: { contains: queryData.search, mode: 'insensitive' } },
        { form: { title: { contains: queryData.search, mode: 'insensitive' } } },
        { fields: { some: { value: { contains: queryData.search, mode: 'insensitive' } } } },
      ];
    }

    // Get responses with related data
    const responses = await db.formResponse.findMany({
      where,
      include: {
        form: {
          select: { id: true, title: true },
        },
        fields: {
          include: {
            field: {
              select: { id: true, type: true, label: true },
            },
          },
          orderBy: {
            field: {
              order: 'asc',
            },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    if (responses.length === 0) {
      return NextResponse.json(
        { error: 'No responses found for the specified criteria' },
        { status: 404 }
      );
    }

    // Generate CSV content
    if (queryData.format === 'csv') {
      const csvContent = generateCsv(responses, queryData.includeMetadata, queryData.fieldDelimiter);
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="responses-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // For Excel format, return CSV that can be opened in Excel
    const excelContent = generateCsv(responses, queryData.includeMetadata, ',');
    
    return new NextResponse(excelContent, {
      headers: {
        'Content-Type': 'application/vnd.ms-excel',
        'Content-Disposition': `attachment; filename="responses-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid export parameters', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error exporting responses:', error);
    return NextResponse.json(
      { error: 'Failed to export responses' },
      { status: 500 }
    );
  }
}

function generateCsv(responses: any[], includeMetadata: boolean, delimiter: string): string {
  if (responses.length === 0) return '';

  // Get all unique field labels for headers
  const fieldLabels = new Set<string>();
  responses.forEach(response => {
    response.fields.forEach((field: any) => {
      fieldLabels.add(field.field.label);
    });
  });

  const sortedFieldLabels = Array.from(fieldLabels).sort();

  // Generate headers
  const headers = [];
  if (includeMetadata) {
    headers.push(
      'Response ID',
      'Form ID',
      'Form Title',
      'Respondent Email',
      'Status',
      'Submitted At',
      'IP Address'
    );
  }
  headers.push(...sortedFieldLabels);

  // Generate CSV rows
  const rows = responses.map(response => {
    const row: string[] = [];
    
    if (includeMetadata) {
      row.push(
        response.id,
        response.form.id,
        response.form.title,
        response.respondentEmail || '',
        response.status,
        response.submittedAt,
        response.ipAddress || ''
      );
    }

    // Create field value map
    const fieldValueMap = new Map<string, string>();
    response.fields.forEach((field: any) => {
      fieldValueMap.set(field.field.label, field.value);
    });

    // Add field values in the same order as headers
    sortedFieldLabels.forEach(label => {
      row.push(escapeCsvValue(fieldValueMap.get(label) || ''));
    });

    return row.map(value => escapeCsvValue(value)).join(delimiter);
  });

  // Combine headers and rows
  return [
    headers.map(h => escapeCsvValue(h)).join(delimiter),
    ...rows
  ].join('\n');
}
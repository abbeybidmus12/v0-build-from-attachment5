import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema for form-specific export parameters
const formExportQuerySchema = z.object({
  format: z.enum(['csv', 'excel']).default('csv'),
  status: z.enum(['NEW', 'READ', 'FLAGGED', 'ARCHIVED']).optional(),
  dateRange: z.enum(['7d', '30d', '90d', '1y', 'all']).default('30d'),
  search: z.string().optional(),
  includeMetadata: z.boolean().default(true),
  fieldDelimiter: z.string().default(','),
  includeFieldTypes: z.boolean().default(false),
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

interface RouteParams {
  params: { id: string };
}

// GET /api/forms/[id]/responses/export - Export specific form responses
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { searchParams } = new URL(request.url);
    const queryData = formExportQuerySchema.parse({
      format: searchParams.get('format'),
      status: searchParams.get('status'),
      dateRange: searchParams.get('dateRange'),
      search: searchParams.get('search'),
      includeMetadata: searchParams.get('includeMetadata'),
      fieldDelimiter: searchParams.get('fieldDelimiter'),
      includeFieldTypes: searchParams.get('includeFieldTypes'),
    });

    // Check if form exists
    const form = await db.form.findUnique({
      where: { id: params.id },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      );
    }

    const dateRange = getDateRange(queryData.dateRange);
    
    // Build where clause
    const where: any = {
      formId: params.id,
      submittedAt: {
        gte: dateRange.start,
        lte: dateRange.end,
      },
    };

    if (queryData.status) {
      where.status = queryData.status;
    }

    if (queryData.search) {
      where.OR = [
        { respondentEmail: { contains: queryData.search, mode: 'insensitive' } },
        { fields: { some: { value: { contains: queryData.search, mode: 'insensitive' } } } },
      ];
    }

    // Get responses with related data
    const responses = await db.formResponse.findMany({
      where,
      include: {
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
        { error: 'No responses found for this form' },
        { status: 404 }
      );
    }

    // Generate export content
    const formTitle = form.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    const timestamp = new Date().toISOString().split('T')[0];

    if (queryData.format === 'csv') {
      const csvContent = generateFormCsv(responses, form.fields, queryData, form.title);
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${formTitle}_responses_${timestamp}.csv"`,
        },
      });
    }

    // For Excel format
    const excelContent = generateFormCsv(responses, form.fields, { ...queryData, fieldDelimiter: ',' }, form.title);
    
    return new NextResponse(excelContent, {
      headers: {
        'Content-Type': 'application/vnd.ms-excel',
        'Content-Disposition': `attachment; filename="${formTitle}_responses_${timestamp}.xlsx"`,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid export parameters', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error exporting form responses:', error);
    return NextResponse.json(
      { error: 'Failed to export form responses' },
      { status: 500 }
    );
  }
}

function generateFormCsv(responses: any[], formFields: any[], options: any, formTitle: string): string {
  if (responses.length === 0) return '';

  // Generate headers
  const headers = [];
  if (options.includeMetadata) {
    headers.push(
      'Response ID',
      'Respondent Email',
      'Status',
      'Submitted At',
      'IP Address'
    );
  }

  // Add field headers
  formFields.forEach(field => {
    let header = field.label;
    if (options.includeFieldTypes) {
      header += ` (${field.type})`;
    }
    headers.push(header);
  });

  // Generate CSV rows
  const rows = responses.map(response => {
    const row: string[] = [];
    
    if (options.includeMetadata) {
      row.push(
        response.id,
        response.respondentEmail || '',
        response.status,
        response.submittedAt,
        response.ipAddress || ''
      );
    }

    // Create field value map for quick lookup
    const fieldValueMap = new Map<string, string>();
    response.fields.forEach((field: any) => {
      fieldValueMap.set(field.fieldId, field.value);
    });

    // Add field values in the same order as form fields
    formFields.forEach(field => {
      const value = fieldValueMap.get(field.id) || '';
      row.push(escapeCsvValue(value));
    });

    return row.map(value => escapeCsvValue(value)).join(options.fieldDelimiter);
  });

  // Add summary section at the top
  const summaryRows = [
    `Form: ${formTitle}`,
    `Export Date: ${new Date().toISOString()}`,
    `Total Responses: ${responses.length}`,
    `Date Range: ${options.dateRange}`,
    '', // Empty row
  ];

  // Combine summary, headers, and rows
  return [
    ...summaryRows.map(row => `# ${row}`), // Comment lines for summary
    headers.map(h => escapeCsvValue(h)).join(options.fieldDelimiter),
    ...rows
  ].join('\n');
}
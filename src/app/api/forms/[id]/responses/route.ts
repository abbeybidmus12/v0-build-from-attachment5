import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema for form submission
const submitFormSchema = z.object({
  respondentEmail: z.string().email().optional(),
  fields: z.array(z.object({
    fieldId: z.string(),
    value: z.string(),
  })),
});

// Validation schema for querying responses
const queryResponsesSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['NEW', 'READ', 'FLAGGED', 'ARCHIVED']).optional(),
  search: z.string().optional(),
});

interface RouteParams {
  params: { id: string };
}

// GET /api/forms/[id]/responses - Get all responses for a form
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { searchParams } = new URL(request.url);
    const queryData = queryResponsesSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
      search: searchParams.get('search'),
    });

    const page = parseInt(queryData.page || '1');
    const limit = parseInt(queryData.limit || '10');
    const skip = (page - 1) * limit;

    // Check if form exists
    const form = await db.form.findUnique({
      where: { id: params.id },
    });

    if (!form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      );
    }

    // Build where clause
    const where: any = { formId: params.id };
    
    if (queryData.status) {
      where.status = queryData.status;
    }

    if (queryData.search) {
      where.OR = [
        { respondentEmail: { contains: queryData.search, mode: 'insensitive' } },
        { fields: { some: { value: { contains: queryData.search, mode: 'insensitive' } } } },
      ];
    }

    // Get responses with pagination
    const [responses, total] = await Promise.all([
      db.formResponse.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          fields: {
            include: {
              field: {
                select: { id: true, type: true, label: true },
              },
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: limit,
      }),
      db.formResponse.count({ where }),
    ]);

    return NextResponse.json({
      responses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error fetching form responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch form responses' },
      { status: 500 }
    );
  }
}

// POST /api/forms/[id]/responses - Submit a form response
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    const validatedData = submitFormSchema.parse(body);

    // Check if form exists and is published
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

    if (form.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Form is not published' },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = form.fields.filter(field => field.required);
    const missingFields = requiredFields.filter(field => 
      !validatedData.fields.some(submittedField => submittedField.fieldId === field.id && submittedField.value.trim() !== '')
    );

    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: 'Required fields are missing',
          missingFields: missingFields.map(field => ({ id: field.id, label: field.label }))
        },
        { status: 400 }
      );
    }

    // Get client IP and user agent
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create form response
    const response = await db.formResponse.create({
      data: {
        formId: params.id,
        respondentEmail: validatedData.respondentEmail,
        ipAddress: clientIP,
        userAgent,
        status: 'NEW',
      },
    });

    // Create response fields
    const responseFieldsData = validatedData.fields.map(field => ({
      responseId: response.id,
      fieldId: field.fieldId,
      value: field.value,
    }));

    await db.responseField.createMany({
      data: responseFieldsData,
    });

    // Return the created response with all details
    const createdResponse = await db.formResponse.findUnique({
      where: { id: response.id },
      include: {
        fields: {
          include: {
            field: {
              select: { id: true, type: true, label: true },
            },
          },
        },
      },
    });

    return NextResponse.json(createdResponse, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error submitting form response:', error);
    return NextResponse.json(
      { error: 'Failed to submit form response' },
      { status: 500 }
    );
  }
}
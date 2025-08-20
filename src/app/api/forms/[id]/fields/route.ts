import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema for creating a form field
const createFieldSchema = z.object({
  type: z.enum([
    'SHORT_TEXT', 'LONG_TEXT', 'EMAIL', 'PHONE', 'NUMBER', 
    'URL', 'DATE', 'DROPDOWN', 'RADIO', 'CHECKBOX', 
    'RATING', 'FILE_UPLOAD', 'SECTION'
  ]),
  label: z.string().min(1, 'Label is required').max(200),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  settings: z.object({}).optional(),
  order: z.number().int().min(0),
});

// Validation schema for updating a form field
const updateFieldSchema = z.object({
  label: z.string().min(1, 'Label is required').max(200).optional(),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  settings: z.object({}).optional(),
  order: z.number().int().min(0).optional(),
});

interface RouteParams {
  params: { id: string };
}

// GET /api/forms/[id]/fields - Get all fields for a form
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
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

    const fields = await db.formField.findMany({
      where: { formId: params.id },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(fields);
  } catch (error) {
    console.error('Error fetching form fields:', error);
    return NextResponse.json(
      { error: 'Failed to fetch form fields' },
      { status: 500 }
    );
  }
}

// POST /api/forms/[id]/fields - Create a new field for a form
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    const validatedData = createFieldSchema.parse(body);

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

    // Validate options for field types that require them
    const fieldTypesWithOptions = ['DROPDOWN', 'RADIO', 'CHECKBOX'];
    if (fieldTypesWithOptions.includes(validatedData.type) && 
        (!validatedData.options || validatedData.options.length === 0)) {
      return NextResponse.json(
        { error: 'Options are required for this field type' },
        { status: 400 }
      );
    }

    const field = await db.formField.create({
      data: {
        ...validatedData,
        formId: params.id,
      },
    });

    return NextResponse.json(field, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating form field:', error);
    return NextResponse.json(
      { error: 'Failed to create form field' },
      { status: 500 }
    );
  }
}

// PUT /api/forms/[id]/fields - Update multiple fields (reorder)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    const { fields } = body;

    if (!Array.isArray(fields)) {
      return NextResponse.json(
        { error: 'Fields must be an array' },
        { status: 400 }
      );
    }

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

    // Update all fields in a transaction
    const updatePromises = fields.map((field: any) => 
      db.formField.update({
        where: { id: field.id },
        data: { order: field.order },
      })
    );

    await db.$transaction(updatePromises);

    // Return updated fields
    const updatedFields = await db.formField.findMany({
      where: { formId: params.id },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(updatedFields);
  } catch (error) {
    console.error('Error updating form fields:', error);
    return NextResponse.json(
      { error: 'Failed to update form fields' },
      { status: 500 }
    );
  }
}
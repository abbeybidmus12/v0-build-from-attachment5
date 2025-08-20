import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

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
  params: { id: string; fieldId: string };
}

// GET /api/forms/[id]/fields/[fieldId] - Get a specific field
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const field = await db.formField.findUnique({
      where: { 
        id: params.fieldId,
        formId: params.id,
      },
    });

    if (!field) {
      return NextResponse.json(
        { error: 'Field not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(field);
  } catch (error) {
    console.error('Error fetching form field:', error);
    return NextResponse.json(
      { error: 'Failed to fetch form field' },
      { status: 500 }
    );
  }
}

// PUT /api/forms/[id]/fields/[fieldId] - Update a specific field
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    const validatedData = updateFieldSchema.parse(body);

    // Check if field exists
    const existingField = await db.formField.findUnique({
      where: { 
        id: params.fieldId,
        formId: params.id,
      },
    });

    if (!existingField) {
      return NextResponse.json(
        { error: 'Field not found' },
        { status: 404 }
      );
    }

    // Validate options for field types that require them
    const fieldTypesWithOptions = ['DROPDOWN', 'RADIO', 'CHECKBOX'];
    if (validatedData.options !== undefined && 
        fieldTypesWithOptions.includes(existingField.type) && 
        validatedData.options.length === 0) {
      return NextResponse.json(
        { error: 'Options are required for this field type' },
        { status: 400 }
      );
    }

    const field = await db.formField.update({
      where: { id: params.fieldId },
      data: validatedData,
    });

    return NextResponse.json(field);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating form field:', error);
    return NextResponse.json(
      { error: 'Failed to update form field' },
      { status: 500 }
    );
  }
}

// DELETE /api/forms/[id]/fields/[fieldId] - Delete a specific field
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check if field exists
    const existingField = await db.formField.findUnique({
      where: { 
        id: params.fieldId,
        formId: params.id,
      },
    });

    if (!existingField) {
      return NextResponse.json(
        { error: 'Field not found' },
        { status: 404 }
      );
    }

    // Delete field (cascade will handle response fields)
    await db.formField.delete({
      where: { id: params.fieldId },
    });

    // Reorder remaining fields
    const remainingFields = await db.formField.findMany({
      where: { formId: params.id },
      orderBy: { order: 'asc' },
    });

    const updatePromises = remainingFields.map((field, index) => 
      db.formField.update({
        where: { id: field.id },
        data: { order: index },
      })
    );

    await db.$transaction(updatePromises);

    return NextResponse.json({ message: 'Field deleted successfully' });
  } catch (error) {
    console.error('Error deleting form field:', error);
    return NextResponse.json(
      { error: 'Failed to delete form field' },
      { status: 500 }
    );
  }
}
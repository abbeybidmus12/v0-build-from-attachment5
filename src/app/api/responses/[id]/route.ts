import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema for updating response status
const updateResponseSchema = z.object({
  status: z.enum(['NEW', 'READ', 'FLAGGED', 'ARCHIVED']),
});

interface RouteParams {
  params: { id: string };
}

// GET /api/responses/[id] - Get a specific response
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const response = await db.formResponse.findUnique({
      where: { id: params.id },
      include: {
        form: {
          select: { id: true, title: true, slug: true },
        },
        user: {
          select: { id: true, name: true, email: true },
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
    });

    if (!response) {
      return NextResponse.json(
        { error: 'Response not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching response:', error);
    return NextResponse.json(
      { error: 'Failed to fetch response' },
      { status: 500 }
    );
  }
}

// PUT /api/responses/[id] - Update response status
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    const validatedData = updateResponseSchema.parse(body);

    // Check if response exists
    const existingResponse = await db.formResponse.findUnique({
      where: { id: params.id },
    });

    if (!existingResponse) {
      return NextResponse.json(
        { error: 'Response not found' },
        { status: 404 }
      );
    }

    const response = await db.formResponse.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        form: {
          select: { id: true, title: true, slug: true },
        },
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
    });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating response:', error);
    return NextResponse.json(
      { error: 'Failed to update response' },
      { status: 500 }
    );
  }
}

// DELETE /api/responses/[id] - Delete a response
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check if response exists
    const existingResponse = await db.formResponse.findUnique({
      where: { id: params.id },
    });

    if (!existingResponse) {
      return NextResponse.json(
        { error: 'Response not found' },
        { status: 404 }
      );
    }

    // Delete response (cascade will handle response fields)
    await db.formResponse.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Response deleted successfully' });
  } catch (error) {
    console.error('Error deleting response:', error);
    return NextResponse.json(
      { error: 'Failed to delete response' },
      { status: 500 }
    );
  }
}
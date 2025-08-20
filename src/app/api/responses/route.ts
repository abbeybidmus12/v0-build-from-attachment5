import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema for querying responses
const queryResponsesSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['NEW', 'READ', 'FLAGGED', 'ARCHIVED']).optional(),
  formId: z.string().optional(),
  search: z.string().optional(),
});

// Validation schema for updating response status
const updateResponseSchema = z.object({
  status: z.enum(['NEW', 'READ', 'FLAGGED', 'ARCHIVED']),
});

// GET /api/responses - Get all responses (across all forms)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryData = queryResponsesSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
      formId: searchParams.get('formId'),
      search: searchParams.get('search'),
    });

    const page = parseInt(queryData.page || '1');
    const limit = parseInt(queryData.limit || '10');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (queryData.status) {
      where.status = queryData.status;
    }

    if (queryData.formId) {
      where.formId = queryData.formId;
    }

    if (queryData.search) {
      where.OR = [
        { respondentEmail: { contains: queryData.search, mode: 'insensitive' } },
        { form: { title: { contains: queryData.search, mode: 'insensitive' } } },
        { fields: { some: { value: { contains: queryData.search, mode: 'insensitive' } } } },
      ];
    }

    // Get responses with pagination
    const [responses, total] = await Promise.all([
      db.formResponse.findMany({
        where,
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

    console.error('Error fetching responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch responses' },
      { status: 500 }
    );
  }
}

// POST /api/responses/bulk - Bulk operations on responses
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, responseIds } = body;

    if (!action || !Array.isArray(responseIds) || responseIds.length === 0) {
      return NextResponse.json(
        { error: 'Action and responseIds are required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'markAsRead':
        await db.formResponse.updateMany({
          where: { id: { in: responseIds } },
          data: { status: 'READ' },
        });
        break;

      case 'markAsFlagged':
        await db.formResponse.updateMany({
          where: { id: { in: responseIds } },
          data: { status: 'FLAGGED' },
        });
        break;

      case 'archive':
        await db.formResponse.updateMany({
          where: { id: { in: responseIds } },
          data: { status: 'ARCHIVED' },
        });
        break;

      case 'delete':
        await db.formResponse.deleteMany({
          where: { id: { in: responseIds } },
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ 
      message: `Successfully performed ${action} on ${responseIds.length} responses` 
    });
  } catch (error) {
    console.error('Error performing bulk operation:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}
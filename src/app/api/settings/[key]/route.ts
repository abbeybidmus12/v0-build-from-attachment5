import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema for updating a setting
const updateSettingSchema = z.object({
  value: z.any(),
  category: z.enum(['general', 'email', 'security', 'integrations', 'appearance']).optional(),
});

interface RouteParams {
  params: { key: string };
}

// GET /api/settings/[key] - Get a specific setting
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const setting = await db.appSettings.findUnique({
      where: { key: params.key },
    });

    if (!setting) {
      return NextResponse.json(
        { error: 'Setting not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      key: setting.key,
      value: setting.value,
      category: setting.category,
      updatedAt: setting.updatedAt,
    });

  } catch (error) {
    console.error('Error fetching setting:', error);
    return NextResponse.json(
      { error: 'Failed to fetch setting' },
      { status: 500 }
    );
  }
}

// PUT /api/settings/[key] - Update a specific setting
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    const validatedData = updateSettingSchema.parse(body);

    // Check if setting exists
    const existing = await db.appSettings.findUnique({
      where: { key: params.key },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Setting not found' },
        { status: 404 }
      );
    }

    const setting = await db.appSettings.update({
      where: { key: params.key },
      data: validatedData,
    });

    return NextResponse.json({
      message: 'Setting updated successfully',
      setting: {
        key: setting.key,
        value: setting.value,
        category: setting.category,
        updatedAt: setting.updatedAt,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating setting:', error);
    return NextResponse.json(
      { error: 'Failed to update setting' },
      { status: 500 }
    );
  }
}

// DELETE /api/settings/[key] - Delete a specific setting
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check if setting exists
    const existing = await db.appSettings.findUnique({
      where: { key: params.key },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Setting not found' },
        { status: 404 }
      );
    }

    await db.appSettings.delete({
      where: { key: params.key },
    });

    return NextResponse.json({
      message: 'Setting deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting setting:', error);
    return NextResponse.json(
      { error: 'Failed to delete setting' },
      { status: 500 }
    );
  }
}
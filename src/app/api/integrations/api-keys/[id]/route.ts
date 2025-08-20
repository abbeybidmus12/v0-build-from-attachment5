import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { randomUUID } from 'crypto';

// Validation schema for updating API keys
const updateApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  permissions: z.array(z.string()).min(1, 'At least one permission is required').optional(),
  expiresAt: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
});

// Available API permissions
const availablePermissions = [
  'forms.read',
  'forms.write',
  'forms.delete',
  'responses.read',
  'responses.write',
  'responses.delete',
  'analytics.read',
  'settings.read',
  'settings.write',
];

interface RouteParams {
  params: { id: string };
}

// GET /api/integrations/api-keys/[id] - Get a specific API key
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const apiKey = await db.apiKey.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        permissions: true,
        lastUsed: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Never return the actual key
      },
    });

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      apiKey,
      availablePermissions,
    });

  } catch (error) {
    console.error('Error fetching API key:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API key' },
      { status: 500 }
    );
  }
}

// PUT /api/integrations/api-keys/[id] - Update an API key
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    const validatedData = updateApiKeySchema.parse(body);

    // Check if API key exists
    const existing = await db.apiKey.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Validate permissions if provided
    if (validatedData.permissions) {
      const invalidPermissions = validatedData.permissions.filter(permission => !availablePermissions.includes(permission));
      if (invalidPermissions.length > 0) {
        return NextResponse.json(
          { error: 'Invalid permissions', invalidPermissions },
          { status: 400 }
        );
      }
    }

    const apiKey = await db.apiKey.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined,
      },
    });

    return NextResponse.json({
      message: 'API key updated successfully',
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        permissions: apiKey.permissions,
        lastUsed: apiKey.lastUsed,
        expiresAt: apiKey.expiresAt,
        isActive: apiKey.isActive,
        createdAt: apiKey.createdAt,
        updatedAt: apiKey.updatedAt,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating API key:', error);
    return NextResponse.json(
      { error: 'Failed to update API key' },
      { status: 500 }
    );
  }
}

// DELETE /api/integrations/api-keys/[id] - Delete an API key
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check if API key exists
    const existing = await db.apiKey.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    await db.apiKey.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: 'API key deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}

// POST /api/integrations/api-keys/[id]/regenerate - Regenerate an API key
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Check if API key exists
    const existing = await db.apiKey.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Generate new API key
    const newApiKey = `fb_${randomUUID()}_${randomUUID()}`.replace(/-/g, '');
    
    const apiKey = await db.apiKey.update({
      where: { id: params.id },
      data: {
        key: newApiKey,
      },
    });

    return NextResponse.json({
      message: 'API key regenerated successfully',
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        key: newApiKey, // Only shown once
        permissions: apiKey.permissions,
        expiresAt: apiKey.expiresAt,
        isActive: apiKey.isActive,
        createdAt: apiKey.createdAt,
        updatedAt: apiKey.updatedAt,
      },
    });

  } catch (error) {
    console.error('Error regenerating API key:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate API key' },
      { status: 500 }
    );
  }
}
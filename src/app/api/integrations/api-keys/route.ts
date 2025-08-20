import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { randomUUID } from 'crypto';

// Validation schema for API keys
const apiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
  expiresAt: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
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

// GET /api/integrations/api-keys - Get all API keys
export async function GET(request: NextRequest) {
  try {
    const apiKeys = await db.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        permissions: true,
        lastUsed: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Never return the actual key in listings
      },
    });

    return NextResponse.json({
      apiKeys,
      availablePermissions,
    });

  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

// POST /api/integrations/api-keys - Create a new API key
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = apiKeySchema.parse(body);
    
    // Validate permissions
    const invalidPermissions = validatedData.permissions.filter(permission => !availablePermissions.includes(permission));
    if (invalidPermissions.length > 0) {
      return NextResponse.json(
        { error: 'Invalid permissions', invalidPermissions },
        { status: 400 }
      );
    }

    // Generate API key
    const apiKey = `fb_${randomUUID()}_${randomUUID()}`.replace(/-/g, '');
    
    const apiKeyData = await db.apiKey.create({
      data: {
        ...validatedData,
        key: apiKey,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
      },
    });

    // Return the key only on creation (never show it again)
    return NextResponse.json({
      message: 'API key created successfully',
      apiKey: {
        id: apiKeyData.id,
        name: apiKeyData.name,
        key: apiKey, // Only shown once
        permissions: apiKeyData.permissions,
        expiresAt: apiKeyData.expiresAt,
        isActive: apiKeyData.isActive,
        createdAt: apiKeyData.createdAt,
      },
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating API key:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}
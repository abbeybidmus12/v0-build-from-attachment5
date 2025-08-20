import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { randomUUID } from 'crypto';

// Validation schema for webhooks
const webhookSchema = z.object({
  url: z.string().url('Invalid URL format'),
  events: z.array(z.string()).min(1, 'At least one event is required'),
  secret: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Validation schema for API keys
const apiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
  expiresAt: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
});

// Available webhook events
const availableEvents = [
  'form.submitted',
  'form.published',
  'form.archived',
  'response.created',
  'response.updated',
  'response.deleted',
];

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

// GET /api/integrations - Get all integrations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'webhooks' or 'api-keys'

    const [webhooks, apiKeys] = await Promise.all([
      db.webhook.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      db.apiKey.findMany({
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const response: any = {
      webhooks,
      apiKeys,
      availableEvents,
      availablePermissions,
    };

    if (type === 'webhooks') {
      return NextResponse.json({
        webhooks,
        availableEvents,
      });
    }

    if (type === 'api-keys') {
      return NextResponse.json({
        apiKeys,
        availablePermissions,
      });
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching integrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    );
  }
}

// POST /api/integrations - Create integration (webhook or API key)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...data } = body;

    if (!type || !['webhook', 'api-key'].includes(type)) {
      return NextResponse.json(
        { error: 'Valid integration type (webhook or api-key) is required' },
        { status: 400 }
      );
    }

    if (type === 'webhook') {
      const validatedData = webhookSchema.parse(data);
      
      // Validate events
      const invalidEvents = validatedData.events.filter(event => !availableEvents.includes(event));
      if (invalidEvents.length > 0) {
        return NextResponse.json(
          { error: 'Invalid events', invalidEvents },
          { status: 400 }
        );
      }

      const webhook = await db.webhook.create({
        data: validatedData,
      });

      return NextResponse.json({
        message: 'Webhook created successfully',
        webhook,
      }, { status: 201 });
    }

    if (type === 'api-key') {
      const validatedData = apiKeySchema.parse(data);
      
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
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating integration:', error);
    return NextResponse.json(
      { error: 'Failed to create integration' },
      { status: 500 }
    );
  }
}
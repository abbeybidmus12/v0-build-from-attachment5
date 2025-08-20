import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema for webhooks
const webhookSchema = z.object({
  url: z.string().url('Invalid URL format').optional(),
  events: z.array(z.string()).optional(),
  secret: z.string().optional(),
  isActive: z.boolean().optional(),
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

// GET /api/integrations/webhooks - Get all webhooks
export async function GET(request: NextRequest) {
  try {
    const webhooks = await db.webhook.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      webhooks,
      availableEvents,
    });

  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhooks' },
      { status: 500 }
    );
  }
}

// POST /api/integrations/webhooks - Create a new webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = webhookSchema.parse(body);
    
    // Validate events
    if (validatedData.events) {
      const invalidEvents = validatedData.events.filter(event => !availableEvents.includes(event));
      if (invalidEvents.length > 0) {
        return NextResponse.json(
          { error: 'Invalid events', invalidEvents },
          { status: 400 }
        );
      }
    }

    const webhook = await db.webhook.create({
      data: {
        url: validatedData.url || '',
        events: validatedData.events || [],
        secret: validatedData.secret,
        isActive: validatedData.isActive ?? true,
      },
    });

    return NextResponse.json({
      message: 'Webhook created successfully',
      webhook,
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating webhook:', error);
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    );
  }
}
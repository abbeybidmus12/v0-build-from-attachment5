import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema for updating webhooks
const updateWebhookSchema = z.object({
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

interface RouteParams {
  params: { id: string };
}

// GET /api/integrations/webhooks/[id] - Get a specific webhook
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const webhook = await db.webhook.findUnique({
      where: { id: params.id },
    });

    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      webhook,
      availableEvents,
    });

  } catch (error) {
    console.error('Error fetching webhook:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook' },
      { status: 500 }
    );
  }
}

// PUT /api/integrations/webhooks/[id] - Update a webhook
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    const validatedData = updateWebhookSchema.parse(body);

    // Check if webhook exists
    const existing = await db.webhook.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    // Validate events if provided
    if (validatedData.events) {
      const invalidEvents = validatedData.events.filter(event => !availableEvents.includes(event));
      if (invalidEvents.length > 0) {
        return NextResponse.json(
          { error: 'Invalid events', invalidEvents },
          { status: 400 }
        );
      }
    }

    const webhook = await db.webhook.update({
      where: { id: params.id },
      data: validatedData,
    });

    return NextResponse.json({
      message: 'Webhook updated successfully',
      webhook,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating webhook:', error);
    return NextResponse.json(
      { error: 'Failed to update webhook' },
      { status: 500 }
    );
  }
}

// DELETE /api/integrations/webhooks/[id] - Delete a webhook
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check if webhook exists
    const existing = await db.webhook.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    await db.webhook.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: 'Webhook deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting webhook:', error);
    return NextResponse.json(
      { error: 'Failed to delete webhook' },
      { status: 500 }
    );
  }
}

// POST /api/integrations/webhooks/[id]/test - Test a webhook
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Check if webhook exists
    const webhook = await db.webhook.findUnique({
      where: { id: params.id },
    });

    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    if (!webhook.isActive) {
      return NextResponse.json(
        { error: 'Webhook is not active' },
        { status: 400 }
      );
    }

    // Prepare test payload
    const testPayload = {
      event: 'test.webhook',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook payload',
        webhookId: webhook.id,
      },
    };

    // Send test request
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FormBuilder-Webhook/1.0',
        ...(webhook.secret && {
          'X-Webhook-Signature': 'test-signature',
        }),
      },
      body: JSON.stringify(testPayload),
    });

    const result = {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      responseTime: Date.now(),
    };

    return NextResponse.json({
      message: 'Webhook test completed',
      result,
    });

  } catch (error) {
    console.error('Error testing webhook:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test webhook',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
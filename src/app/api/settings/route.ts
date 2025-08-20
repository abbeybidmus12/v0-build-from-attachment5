import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema for settings
const settingsSchema = z.object({
  key: z.string().min(1, 'Key is required').max(100),
  value: z.any(),
  category: z.enum(['general', 'email', 'security', 'integrations', 'appearance']).default('general'),
});

// Validation schema for updating settings
const updateSettingsSchema = z.object({
  value: z.any(),
  category: z.enum(['general', 'email', 'security', 'integrations', 'appearance']).optional(),
});

// Default settings
const defaultSettings = [
  { key: 'app_name', value: 'Form Builder', category: 'general' as const },
  { key: 'app_description', value: 'Build beautiful forms with ease', category: 'general' as const },
  { key: 'admin_email', value: 'admin@example.com', category: 'general' as const },
  { key: 'timezone', value: 'UTC', category: 'general' as const },
  { key: 'date_format', value: 'MM/DD/YYYY', category: 'general' as const },
  { key: 'enable_email_notifications', value: true, category: 'email' as const },
  { key: 'email_from_address', value: 'noreply@formbuilder.com', category: 'email' as const },
  { key: 'email_from_name', value: 'Form Builder', category: 'email' as const },
  { key: 'enable_rate_limiting', value: true, category: 'security' as const },
  { key: 'rate_limit_requests', value: 100, category: 'security' as const },
  { key: 'rate_limit_window', value: 60, category: 'security' as const },
  { key: 'enable_captcha', value: false, category: 'security' as const },
  { key: 'theme', value: 'light', category: 'appearance' as const },
  { key: 'primary_color', value: '#3b82f6', category: 'appearance' as const },
  { key: 'enable_analytics', value: true, category: 'integrations' as const },
  { key: 'analytics_tracking_id', value: '', category: 'integrations' as const },
];

// GET /api/settings - Get all settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const keys = searchParams.get('keys')?.split(',');

    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (keys && keys.length > 0) {
      where.key = { in: keys };
    }

    // Get settings from database
    let settings = await db.appSettings.findMany({
      where,
      orderBy: { category: 'asc' },
    });

    // If no settings exist, create default settings
    if (settings.length === 0) {
      await db.appSettings.createMany({
        data: defaultSettings,
        skipDuplicates: true,
      });
      
      settings = await db.appSettings.findMany({
        where,
        orderBy: { category: 'asc' },
      });
    }

    // Group settings by category
    const settingsByCategory = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push({
        key: setting.key,
        value: setting.value,
        category: setting.category,
        updatedAt: setting.updatedAt,
      });
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({
      settings: category ? settingsByCategory[category] || [] : settingsByCategory,
      categories: ['general', 'email', 'security', 'integrations', 'appearance'],
    });

  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST /api/settings - Create or update settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle bulk settings update
    if (Array.isArray(body)) {
      const validatedSettings = body.map(setting => settingsSchema.parse(setting));
      
      const results = await Promise.all(
        validatedSettings.map(async (setting) => {
          const existing = await db.appSettings.findUnique({
            where: { key: setting.key },
          });

          if (existing) {
            return db.appSettings.update({
              where: { key: setting.key },
              data: { 
                value: setting.value,
                category: setting.category,
              },
            });
          } else {
            return db.appSettings.create({
              data: setting,
            });
          }
        })
      );

      return NextResponse.json({
        message: 'Settings updated successfully',
        settings: results,
      });
    }

    // Handle single setting creation
    const validatedData = settingsSchema.parse(body);
    
    const existing = await db.appSettings.findUnique({
      where: { key: validatedData.key },
    });

    let setting;
    if (existing) {
      setting = await db.appSettings.update({
        where: { key: validatedData.key },
        data: validatedData,
      });
    } else {
      setting = await db.appSettings.create({
        data: validatedData,
      });
    }

    return NextResponse.json({
      message: 'Setting created successfully',
      setting,
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating setting:', error);
    return NextResponse.json(
      { error: 'Failed to create setting' },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle bulk settings update
    if (Array.isArray(body)) {
      const validatedSettings = body.map(setting => ({
        key: setting.key,
        ...updateSettingsSchema.parse(setting),
      }));
      
      const results = await Promise.all(
        validatedSettings.map(async (setting) => {
          const existing = await db.appSettings.findUnique({
            where: { key: setting.key },
          });

          if (!existing) {
            throw new Error(`Setting with key '${setting.key}' not found`);
          }

          return db.appSettings.update({
            where: { key: setting.key },
            data: setting,
          });
        })
      );

      return NextResponse.json({
        message: 'Settings updated successfully',
        settings: results,
      });
    }

    // Handle single setting update
    const { key, ...updateData } = body;
    
    if (!key) {
      return NextResponse.json(
        { error: 'Key is required for update' },
        { status: 400 }
      );
    }

    const validatedData = updateSettingsSchema.parse(updateData);
    
    const existing = await db.appSettings.findUnique({
      where: { key },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Setting not found' },
        { status: 404 }
      );
    }

    const setting = await db.appSettings.update({
      where: { key },
      data: validatedData,
    });

    return NextResponse.json({
      message: 'Setting updated successfully',
      setting,
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
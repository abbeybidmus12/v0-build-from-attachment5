import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema for form submission with enhanced validation
const submitFormSchema = z.object({
  respondentEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  fields: z.array(z.object({
    fieldId: z.string(),
    value: z.string(),
  })),
  captchaToken: z.string().optional(),
});

// Field type validators
const fieldValidators = {
  SHORT_TEXT: (value: string) => value.trim().length > 0,
  LONG_TEXT: (value: string) => value.trim().length > 0,
  EMAIL: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  PHONE: (value: string) => /^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, '')),
  NUMBER: (value: string) => !isNaN(Number(value)) && value.trim() !== '',
  URL: (value: string) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  DATE: (value: string) => !isNaN(Date.parse(value)),
  DROPDOWN: (value: string) => value.trim() !== '',
  RADIO: (value: string) => value.trim() !== '',
  CHECKBOX: (value: string) => value.trim() !== '',
  RATING: (value: string) => {
    const num = Number(value);
    return !isNaN(num) && num >= 1 && num <= 5;
  },
  FILE_UPLOAD: (value: string) => value.trim() !== '',
  SECTION: (value: string) => true, // Sections don't require validation
};

interface RouteParams {
  params: { id: string };
}

// POST /api/forms/[id]/submit - Public form submission endpoint
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    const validatedData = submitFormSchema.parse(body);

    // Check if form exists and is published
    const form = await db.form.findUnique({
      where: { id: params.id },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      );
    }

    if (form.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Form is not accepting submissions at this time' },
        { status: 400 }
      );
    }

    // Check if form has reached submission limit (if configured)
    const settings = form.settings as any || {};
    if (settings.maxSubmissions && settings.maxSubmissions > 0) {
      const responseCount = await db.formResponse.count({
        where: { formId: params.id },
      });

      if (responseCount >= settings.maxSubmissions) {
        return NextResponse.json(
          { error: 'This form has reached its submission limit' },
          { status: 400 }
        );
      }
    }

    // Validate required fields and field types
    const validationErrors: string[] = [];
    const fieldMap = new Map(form.fields.map(field => [field.id, field]));

    // Check for missing required fields
    const requiredFields = form.fields.filter(field => field.required);
    const submittedFieldIds = new Set(validatedData.fields.map(f => f.fieldId));

    for (const field of requiredFields) {
      if (!submittedFieldIds.has(field.id)) {
        validationErrors.push(`Field "${field.label}" is required`);
        continue;
      }

      const submittedField = validatedData.fields.find(f => f.fieldId === field.id);
      if (!submittedField || submittedField.value.trim() === '') {
        validationErrors.push(`Field "${field.label}" is required`);
      }
    }

    // Validate field types
    for (const submittedField of validatedData.fields) {
      const field = fieldMap.get(submittedField.fieldId);
      if (!field) continue;

      const validator = fieldValidators[field.type as keyof typeof fieldValidators];
      if (validator && submittedField.value.trim() !== '' && !validator(submittedField.value)) {
        validationErrors.push(`Field "${field.label}" contains invalid data`);
      }

      // Validate dropdown/radio/checkbox options
      if ((field.type === 'DROPDOWN' || field.type === 'RADIO' || field.type === 'CHECKBOX') && 
          field.options && field.options.length > 0) {
        const validOptions = field.options;
        const submittedValues = submittedField.value.split(',').map(v => v.trim());
        
        for (const value of submittedValues) {
          if (value && !validOptions.includes(value)) {
            validationErrors.push(`Field "${field.label}" contains invalid option: ${value}`);
            break;
          }
        }
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationErrors 
        },
        { status: 400 }
      );
    }

    // Check for duplicate submissions (if configured)
    if (settings.preventDuplicates && validatedData.respondentEmail) {
      const existingResponse = await db.formResponse.findFirst({
        where: {
          formId: params.id,
          respondentEmail: validatedData.respondentEmail,
        },
      });

      if (existingResponse) {
        return NextResponse.json(
          { error: 'You have already submitted this form' },
          { status: 400 }
        );
      }
    }

    // Get client information
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     request.ip?.toString() || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create form response
    const response = await db.formResponse.create({
      data: {
        formId: params.id,
        respondentEmail: validatedData.respondentEmail || null,
        ipAddress: clientIP,
        userAgent,
        status: 'NEW',
      },
    });

    // Create response fields
    const responseFieldsData = validatedData.fields
      .filter(field => field.value.trim() !== '') // Skip empty values
      .map(field => ({
        responseId: response.id,
        fieldId: field.fieldId,
        value: field.value,
      }));

    if (responseFieldsData.length > 0) {
      await db.responseField.createMany({
        data: responseFieldsData,
      });
    }

    // Return success response
    return NextResponse.json({
      success: true,
      responseId: response.id,
      message: 'Form submitted successfully',
      submittedAt: response.submittedAt,
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error submitting form:', error);
    return NextResponse.json(
      { error: 'Failed to submit form. Please try again later.' },
      { status: 500 }
    );
  }
}
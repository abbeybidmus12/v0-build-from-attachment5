import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { db } from '@/lib/db';
import { z } from 'zod';
import { randomUUID } from 'crypto';

// Validation schema for file upload
const uploadSchema = z.object({
  fieldId: z.string().optional(),
  responseId: z.string().optional(),
});

// Allowed file types and their MIME types
const ALLOWED_FILE_TYPES = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/gif': ['gif'],
  'image/webp': ['webp'],
  'application/pdf': ['pdf'],
  'text/plain': ['txt'],
  'application/msword': ['doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  'application/vnd.ms-excel': ['xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
  'application/vnd.ms-powerpoint': ['ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['pptx'],
};

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

// Upload directory
const UPLOAD_DIR = join(process.cwd(), 'uploads');

// Ensure upload directory exists
import { mkdir } from 'fs/promises';
async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
}

function getFileExtension(mimeType: string): string | null {
  const extensions = ALLOWED_FILE_TYPES[mimeType as keyof typeof ALLOWED_FILE_TYPES];
  return extensions ? extensions[0] : null;
}

function generateUniqueFilename(originalName: string, extension: string): string {
  const timestamp = Date.now();
  const uuid = randomUUID().split('-')[0];
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\s+/g, '_');
  return `${timestamp}_${uuid}_${sanitizedName}.${extension}`;
}

// POST /api/upload - Upload a file
export async function POST(request: NextRequest) {
  try {
    await ensureUploadDir();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fieldId = formData.get('fieldId') as string;
    const responseId = formData.get('responseId') as string;

    // Validate file presence
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds maximum limit of 10MB' },
        { status: 400 }
      );
    }

    // Validate file type
    const fileExtension = getFileExtension(file.type);
    if (!fileExtension) {
      return NextResponse.json(
        { error: 'File type not supported' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const filename = generateUniqueFilename(file.name, fileExtension);
    const filePath = join(UPLOAD_DIR, filename);

    // Convert File to Buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await writeFile(filePath, buffer);

    // Save file information to database
    const uploadedFile = await db.uploadedFile.create({
      data: {
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        path: filePath,
        url: `/api/files/${filename}`, // Public URL
        fieldId: fieldId || null,
        responseId: responseId || null,
      },
    });

    return NextResponse.json({
      message: 'File uploaded successfully',
      file: {
        id: uploadedFile.id,
        filename: uploadedFile.filename,
        originalName: uploadedFile.originalName,
        mimeType: uploadedFile.mimeType,
        size: uploadedFile.size,
        url: uploadedFile.url,
        uploadedAt: uploadedFile.createdAt,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// GET /api/upload - Get upload information and settings
export async function GET() {
  try {
    const settings = {
      maxFileSize: MAX_FILE_SIZE,
      maxFileSizeMB: MAX_FILE_SIZE / (1024 * 1024),
      allowedFileTypes: Object.keys(ALLOWED_FILE_TYPES),
      allowedExtensions: Object.values(ALLOWED_FILE_TYPES).flat(),
    };

    return NextResponse.json({
      settings,
      message: 'Upload endpoint is ready',
    });

  } catch (error) {
    console.error('Error fetching upload settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upload settings' },
      { status: 500 }
    );
  }
}
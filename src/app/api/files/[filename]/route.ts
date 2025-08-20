import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { db } from '@/lib/db';
import { existsSync } from 'fs';

interface RouteParams {
  params: { filename: string };
}

// GET /api/files/[filename] - Serve uploaded files
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const filename = params.filename;
    
    // Get file information from database
    const fileRecord = await db.uploadedFile.findUnique({
      where: { filename },
    });

    if (!fileRecord) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Check if file exists on disk
    if (!existsSync(fileRecord.path)) {
      return NextResponse.json(
        { error: 'File not found on disk' },
        { status: 404 }
      );
    }

    // Read file content
    const fileBuffer = await readFile(fileRecord.path);

    // Determine content type
    const contentType = fileRecord.mimeType || 'application/octet-stream';

    // Set appropriate headers for file serving
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', fileBuffer.length.toString());
    
    // Set content disposition for download
    const contentDisposition = `inline; filename="${fileRecord.originalName}"`;
    headers.set('Content-Disposition', contentDisposition);

    // Set cache headers (1 week for static files)
    headers.set('Cache-Control', 'public, max-age=604800, immutable');

    // Return file as response
    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Error serving file:', error);
    
    if (error.code === 'ENOENT') {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    );
  }
}

// HEAD /api/files/[filename] - Check if file exists without downloading
export async function HEAD(request: NextRequest, { params }: RouteParams) {
  try {
    const filename = params.filename;
    
    // Get file information from database
    const fileRecord = await db.uploadedFile.findUnique({
      where: { filename },
    });

    if (!fileRecord) {
      return new NextResponse(null, { status: 404 });
    }

    // Check if file exists on disk
    if (!existsSync(fileRecord.path)) {
      return new NextResponse(null, { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', fileRecord.mimeType || 'application/octet-stream');
    headers.set('Content-Length', fileRecord.size.toString());
    headers.set('Content-Disposition', `inline; filename="${fileRecord.originalName}"`);
    headers.set('Cache-Control', 'public, max-age=604800, immutable');

    return new NextResponse(null, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Error checking file:', error);
    return new NextResponse(null, { status: 500 });
  }
}
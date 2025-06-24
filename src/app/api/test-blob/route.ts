import { NextResponse } from 'next/server';
import { put, list } from '@vercel/blob';

export async function GET() {
  try {
    // Check if Blob environment is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({
        status: 'error',
        message: 'BLOB_READ_WRITE_TOKEN not configured',
        environment: process.env.NODE_ENV
      });
    }

    // Test writing to blob
    const testData = {
      message: 'Hello from Vercel Blob!',
      timestamp: new Date().toISOString(),
      test: true
    };

    const blob = await put('test-blob.json', JSON.stringify(testData), {
      access: 'public',
    });

    // Test listing blobs
    const { blobs } = await list();

    return NextResponse.json({
      status: 'success',
      message: 'Blob connection successful',
      blobUrl: blob.url,
      totalBlobs: blobs.length,
      testBlob: blob,
      environment: process.env.NODE_ENV
    });

  } catch (error) {
    console.error('Blob test error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Blob test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV
    }, { status: 500 });
  }
} 
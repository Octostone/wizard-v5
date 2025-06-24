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

    console.log('Testing Blob connection with allowOverwrite...');

    // Test writing to blob
    const testData = {
      message: 'Hello from Vercel Blob!',
      timestamp: new Date().toISOString(),
      test: true
    };

    const blob = await put('test-blob.json', JSON.stringify(testData), {
      access: 'public',
      allowOverwrite: true,
    });

    console.log('Successfully wrote test blob:', blob.url);

    // Test listing blobs
    const { blobs } = await list();
    console.log('Found blobs:', blobs.length);

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
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json({
      status: 'error',
      message: 'Blob test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV
    }, { status: 500 });
  }
} 
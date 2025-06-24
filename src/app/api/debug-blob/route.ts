import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';

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

    console.log('Debugging Blob storage...');

    // List all blobs
    const { blobs } = await list();
    console.log('All blobs found:', blobs.map(b => b.pathname));

    const adminBlob = blobs.find(blob => blob.pathname === 'admin-data.json');
    
    if (adminBlob) {
      console.log('Found admin-data.json, fetching content...');
      
      // Fetch the blob content
      const response = await fetch(adminBlob.url);
      console.log('Fetch response status:', response.status);
      
      if (response.ok) {
        const text = await response.text();
        console.log('Blob content length:', text.length);
        
        try {
          const data = JSON.parse(text);
          return NextResponse.json({
            status: 'success',
            message: 'Admin data found in blob',
            blobInfo: {
              url: adminBlob.url,
              pathname: adminBlob.pathname
            },
            data: data,
            environment: process.env.NODE_ENV
          });
        } catch (parseError) {
          return NextResponse.json({
            status: 'error',
            message: 'Failed to parse blob content as JSON',
            blobInfo: {
              url: adminBlob.url,
              pathname: adminBlob.pathname
            },
            rawContent: text.substring(0, 500),
            parseError: parseError instanceof Error ? parseError.message : 'Unknown error',
            environment: process.env.NODE_ENV
          });
        }
      } else {
        return NextResponse.json({
          status: 'error',
          message: 'Failed to fetch blob content',
          blobInfo: {
            url: adminBlob.url,
            pathname: adminBlob.pathname
          },
          fetchStatus: response.status,
          environment: process.env.NODE_ENV
        });
      }
    } else {
      return NextResponse.json({
        status: 'error',
        message: 'admin-data.json blob not found',
        allBlobs: blobs.map(b => b.pathname),
        environment: process.env.NODE_ENV
      });
    }

  } catch (error) {
    console.error('Debug blob error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Debug blob failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV
    }, { status: 500 });
  }
} 
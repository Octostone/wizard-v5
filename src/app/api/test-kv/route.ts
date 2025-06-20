import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET() {
  try {
    console.log('Testing Vercel KV connection...');
    
    // Test writing data
    const testData = { test: 'Hello from Vercel KV!', timestamp: new Date().toISOString() };
    await kv.set('test_key', testData);
    console.log('Successfully wrote test data to KV');
    
    // Test reading data
    const retrievedData = await kv.get('test_key');
    console.log('Successfully read test data from KV:', retrievedData);
    
    // Clean up test data
    await kv.del('test_key');
    console.log('Successfully cleaned up test data');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Vercel KV is working correctly!',
      testData: retrievedData
    });
  } catch (error) {
    console.error('Vercel KV test failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Vercel KV connection failed. Please check your KV configuration.'
    }, { status: 500 });
  }
} 
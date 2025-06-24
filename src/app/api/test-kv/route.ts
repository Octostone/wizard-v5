import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET() {
  try {
    console.log('Testing Vercel KV functionality...');
    
    // Test 1: Write a test value
    const testData = {
      timestamp: new Date().toISOString(),
      testValue: Math.random(),
      message: 'KV test successful'
    };
    
    console.log('Writing test data to KV...');
    await kv.set('test_key', testData);
    
    // Test 2: Read the test value
    console.log('Reading test data from KV...');
    const readData = await kv.get('test_key');
    
    // Test 3: Read admin data (if it exists)
    console.log('Reading admin data from KV...');
    const adminData = await kv.get('admin_data');
    
    // Test 4: List keys (optional)
    console.log('Listing KV keys...');
    const keys = await kv.keys('*');
    
    return NextResponse.json({
      success: true,
      testWrite: testData,
      testRead: readData,
      adminData: adminData,
      keys: keys,
      environment: {
        kvUrl: process.env.KV_URL ? 'SET' : 'NOT SET',
        kvRestApiUrl: process.env.KV_REST_API_URL ? 'SET' : 'NOT SET',
        kvRestApiToken: process.env.KV_REST_API_TOKEN ? 'SET' : 'NOT SET'
      }
    });

  } catch (error: any) {
    console.error('KV test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      environment: {
        kvUrl: process.env.KV_URL ? 'SET' : 'NOT SET',
        kvRestApiUrl: process.env.KV_REST_API_URL ? 'SET' : 'NOT SET',
        kvRestApiToken: process.env.KV_REST_API_TOKEN ? 'SET' : 'NOT SET'
      }
    }, { status: 500 });
  }
} 
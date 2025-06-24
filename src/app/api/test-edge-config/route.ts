import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';

export async function GET() {
  try {
    // Test 1: Try to read data (this should work)
    console.log('Testing Edge Config read access...');
    const data = await get('admin_data');
    console.log('Read data:', data);

    // Test 2: Try to write data using the REST API
    console.log('Testing Edge Config write access...');
    const edgeConfigId = process.env.EDGE_CONFIG_ID;
    const token = process.env.EDGE_CONFIG_TOKEN;
    
    if (!edgeConfigId || !token) {
      return NextResponse.json({
        error: 'Missing environment variables',
        edgeConfigId: !!edgeConfigId,
        token: !!token
      });
    }

    // Try to update a test value
    const testData = {
      test_timestamp: new Date().toISOString(),
      test_value: Math.random()
    };

    const url = `https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        items: { 
          test_data: testData 
        } 
      }),
    });

    const responseText = await response.text();
    console.log('Write response status:', response.status);
    console.log('Write response:', responseText);

    return NextResponse.json({
      success: true,
      readData: data,
      writeTest: {
        status: response.status,
        success: response.ok,
        response: responseText,
        testData
      },
      environment: {
        edgeConfigId: edgeConfigId ? 'SET' : 'NOT SET',
        token: token ? 'SET' : 'NOT SET',
        tokenLength: token?.length || 0
      }
    });

  } catch (error: any) {
    console.error('Edge Config test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 
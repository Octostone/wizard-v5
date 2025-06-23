import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';

// Type definitions
interface AccountManager {
  name: string;
  email: string;
}

interface AdminData {
  accountManagers: AccountManager[];
  geoOptions: string[];
  osOptions: string[];
  category1Options: string[];
  category2Options: string[];
  category3Options: string[];
  eventTypeOptions: string[];
  pubRevSourceOptions: string[];
}

// Helper function to fetch admin data from Edge Config
const getAdminData = async (): Promise<AdminData | null> => {
  try {
    const data = await get('admin_data');
    // Runtime type check for expected keys
    if (
      data &&
      typeof data === 'object' &&
      'accountManagers' in data &&
      'geoOptions' in data &&
      'osOptions' in data &&
      'category1Options' in data &&
      'category2Options' in data &&
      'category3Options' in data &&
      'eventTypeOptions' in data &&
      'pubRevSourceOptions' in data
    ) {
      return data as unknown as AdminData;
    }
    return null;
  } catch (error) {
    console.error('Error fetching admin data from Edge Config:', error);
    return null;
  }
};

// Helper function to update admin data in Edge Config using REST API
const updateAdminData = async (data: AdminData): Promise<boolean> => {
  try {
    // Vercel Edge Config REST API endpoint
    const edgeConfigId = process.env.EDGE_CONFIG?.split('/').pop();
    const token = process.env.EDGE_CONFIG_TOKEN;
    if (!edgeConfigId || !token) {
      throw new Error('Missing EDGE_CONFIG or EDGE_CONFIG_TOKEN environment variable.');
    }
    const url = `https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items: { admin_data: data } }),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to update Edge Config: ${res.status} ${errorText}`);
    }
    return true;
  } catch (error) {
    console.error('Error updating admin data in Edge Config:', error);
    return false;
  }
};

export async function GET() {
  const data = await getAdminData();
  if (!data) {
    return NextResponse.json({ error: 'Failed to read admin data' }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    // Validate data (basic)
    if (!data.accountManagers || !Array.isArray(data.accountManagers)) {
      return NextResponse.json({ error: 'Invalid accountManagers data' }, { status: 400 });
    }
    // ... (other validation as before)
    const success = await updateAdminData(data);
    if (!success) {
      return NextResponse.json({ error: 'Failed to save admin data' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save admin data' }, { status: 500 });
  }
}

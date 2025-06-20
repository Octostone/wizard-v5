import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for development (will be replaced with proper database later)
let adminData = {
  accountManagers: [
    { name: 'James', email: '' },
    { name: 'Jason', email: '' },
    { name: 'Marina', email: '' },
    { name: 'Zhaowen', email: '' }
  ],
  geoOptions: ['US', 'CA', 'UK', 'AU'],
  osOptions: ['iOS', 'Android'],
  category1Options: ['Cat', 'Dog', 'Bird'],
  category2Options: ['Cat', 'Dog', 'Bird'],
  category3Options: ['Cat', 'Dog', 'Bird'],
  eventTypeOptions: ['GOAL', 'ADD', 'INITIAL', 'PURCHASE'],
  pubRevSourceOptions: ['IN EVENT NAME', 'IN POST BACK']
};

// Helper function to convert old string format to new object format
const migrateAccountManagers = (accountManagers: any[]): Array<{name: string, email: string}> => {
  return accountManagers.map(manager => {
    if (typeof manager === 'string') {
      return { name: manager, email: '' };
    }
    return manager;
  });
};

export async function GET() {
  try {
    console.log('GET /api/admin - Returning data:', adminData);
    return NextResponse.json(adminData);
  } catch (error) {
    console.error('Error reading admin data:', error);
    return NextResponse.json({ error: 'Failed to read admin data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/admin - Starting save process');
    const data = await request.json();
    console.log('POST /api/admin - Received data:', data);
    
    // Validate account managers data
    if (!data.accountManagers || !Array.isArray(data.accountManagers)) {
      console.error('Invalid accountManagers data:', data.accountManagers);
      return NextResponse.json({ error: 'Invalid accountManagers data' }, { status: 400 });
    }
    
    // Ensure account managers are in the correct format
    data.accountManagers = data.accountManagers.map((manager: any) => {
      if (typeof manager === 'string') {
        return { name: manager, email: '' };
      }
      return {
        name: manager.name || '',
        email: manager.email || ''
      };
    });
    
    if (!data.geoOptions || !Array.isArray(data.geoOptions)) {
      console.error('Invalid geoOptions data:', data.geoOptions);
      return NextResponse.json({ error: 'Invalid geoOptions data' }, { status: 400 });
    }
    
    if (!data.osOptions || !Array.isArray(data.osOptions)) {
      console.error('Invalid osOptions data:', data.osOptions);
      return NextResponse.json({ error: 'Invalid osOptions data' }, { status: 400 });
    }

    if (!data.category1Options || !Array.isArray(data.category1Options)) {
      console.error('Invalid category1Options data:', data.category1Options);
      return NextResponse.json({ error: 'Invalid category1Options data' }, { status: 400 });
    }

    if (!data.category2Options || !Array.isArray(data.category2Options)) {
      console.error('Invalid category2Options data:', data.category2Options);
      return NextResponse.json({ error: 'Invalid category2Options data' }, { status: 400 });
    }

    if (!data.category3Options || !Array.isArray(data.category3Options)) {
      console.error('Invalid category3Options data:', data.category3Options);
      return NextResponse.json({ error: 'Invalid category3Options data' }, { status: 400 });
    }
    
    if (!data.eventTypeOptions || !Array.isArray(data.eventTypeOptions)) {
      console.error('Invalid eventTypeOptions data:', data.eventTypeOptions);
      return NextResponse.json({ error: 'Invalid eventTypeOptions data' }, { status: 400 });
    }
    
    if (!data.pubRevSourceOptions || !Array.isArray(data.pubRevSourceOptions)) {
      console.error('Invalid pubRevSourceOptions data:', data.pubRevSourceOptions);
      return NextResponse.json({ error: 'Invalid pubRevSourceOptions data' }, { status: 400 });
    }
    
    // Save data to in-memory storage
    adminData = data;
    console.log('POST /api/admin - Successfully saved data:', adminData);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving admin data:', error);
    return NextResponse.json({ error: 'Failed to save admin data' }, { status: 500 });
  }
}

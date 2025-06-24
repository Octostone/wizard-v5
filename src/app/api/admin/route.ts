import { NextRequest, NextResponse } from 'next/server';
import { put, list, del } from '@vercel/blob';

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

// Default data structure
const defaultAdminData: AdminData = {
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

// In-memory fallback for local development
let inMemoryData: AdminData | null = null;

// Helper function to fetch admin data
const getAdminData = async (): Promise<AdminData> => {
  try {
    // Check if we're in production (Vercel) with Blob environment
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      console.log('Fetching admin data from Blob...');
      try {
        // List blobs to check if admin-data.json exists
        const { blobs } = await list();
        console.log('Found blobs:', blobs.map(b => b.pathname));
        
        const adminBlob = blobs.find(blob => blob.pathname === 'admin-data.json');
        
        if (adminBlob) {
          console.log('Found admin-data.json blob, fetching content...');
          // Fetch the blob content
          const response = await fetch(adminBlob.url);
          console.log('Fetch response status:', response.status);
          
          if (response.ok) {
            const text = await response.text();
            console.log('Fetched blob content length:', text.length);
            console.log('Fetched blob content preview:', text.substring(0, 200));
            
            const parsedData = JSON.parse(text);
            console.log('Successfully parsed admin data from blob');
            return parsedData;
          } else {
            console.error('Failed to fetch blob content, status:', response.status);
          }
        } else {
          console.log('admin-data.json blob not found, will initialize with default data');
        }
      } catch (error) {
        console.error('Error reading from blob:', error);
      }
      
      // Initialize with default data in Blob
      console.log('Initializing with default data in Blob...');
      await put('admin-data.json', JSON.stringify(defaultAdminData), {
        access: 'public',
        allowOverwrite: true,
      });
      console.log('Successfully initialized default data in Blob');
      return defaultAdminData;
    } else {
      // Local development fallback
      console.log('Using local in-memory storage for admin data');
      if (inMemoryData) {
        return inMemoryData;
      }
      inMemoryData = defaultAdminData;
      return defaultAdminData;
    }
  } catch (error) {
    console.error('Error fetching admin data:', error);
    return defaultAdminData;
  }
};

// Helper function to update admin data
const updateAdminData = async (data: AdminData): Promise<boolean> => {
  try {
    // Check if we're in production (Vercel) with Blob environment
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      console.log('Updating admin data in Blob with allowOverwrite...');
      
      // Always use allowOverwrite to prevent conflicts
      const result = await put('admin-data.json', JSON.stringify(data), {
        access: 'public',
        allowOverwrite: true,
      });
      
      console.log('Successfully updated admin data in Blob:', result.url);
    } else {
      // Local development fallback
      console.log('Using local in-memory storage for admin data');
      inMemoryData = data;
    }
    return true;
  } catch (error) {
    console.error('Error updating admin data:', error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return false;
  }
};

export async function GET() {
  try {
    const data = await getAdminData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/admin:', error);
    return NextResponse.json({ error: 'Failed to read admin data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate data structure
    if (!data.accountManagers || !Array.isArray(data.accountManagers)) {
      return NextResponse.json({ error: 'Invalid accountManagers data' }, { status: 400 });
    }
    
    if (!data.geoOptions || !Array.isArray(data.geoOptions)) {
      return NextResponse.json({ error: 'Invalid geoOptions data' }, { status: 400 });
    }
    
    if (!data.osOptions || !Array.isArray(data.osOptions)) {
      return NextResponse.json({ error: 'Invalid osOptions data' }, { status: 400 });
    }
    
    if (!data.category1Options || !Array.isArray(data.category1Options)) {
      return NextResponse.json({ error: 'Invalid category1Options data' }, { status: 400 });
    }
    
    if (!data.category2Options || !Array.isArray(data.category2Options)) {
      return NextResponse.json({ error: 'Invalid category2Options data' }, { status: 400 });
    }
    
    if (!data.category3Options || !Array.isArray(data.category3Options)) {
      return NextResponse.json({ error: 'Invalid category3Options data' }, { status: 400 });
    }
    
    if (!data.eventTypeOptions || !Array.isArray(data.eventTypeOptions)) {
      return NextResponse.json({ error: 'Invalid eventTypeOptions data' }, { status: 400 });
    }
    
    if (!data.pubRevSourceOptions || !Array.isArray(data.pubRevSourceOptions)) {
      return NextResponse.json({ error: 'Invalid pubRevSourceOptions data' }, { status: 400 });
    }

    const success = await updateAdminData(data);
    if (!success) {
      return NextResponse.json({ error: 'Failed to save admin data' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/admin:', error);
    return NextResponse.json({ error: 'Failed to save admin data' }, { status: 500 });
  }
}

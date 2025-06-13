import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'admin.json');

// Ensure data directory exists
const ensureDataDir = () => {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Initialize data file if it doesn't exist
const initDataFile = () => {
  ensureDataDir();
  if (!fs.existsSync(dataFilePath)) {
    const initialData = {
      accountManagers: [
        'James Pavelich',
        'Jason Wolofsky',
        'Mariana Levant',
        'Zhaowen Shen'
      ],
      geoOptions: ['US', 'CA', 'UK', 'AU'],
      osOptions: ['iOS', 'Android'],
      category1Options: ['Cat', 'Dog', 'Bird'],
      category2Options: ['Cat', 'Dog', 'Bird'],
      category3Options: ['Cat', 'Dog', 'Bird'],
      eventTypeOptions: ['GOAL', 'ADD', 'INITIAL', 'PURCHASE'],
      pubRevSourceOptions: ['IN EVENT NAME', 'IN POST BACK']
    };
    fs.writeFileSync(dataFilePath, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  return JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
};

export async function GET() {
  try {
    const data = initDataFile();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading admin data:', error);
    return NextResponse.json({ error: 'Failed to read admin data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    ensureDataDir();
    const data = await request.json();
    
    // Validate data
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
    
    // Save data
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving admin data:', error);
    return NextResponse.json({ error: 'Failed to save admin data' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getAdminData, updateAdminData } from '../../../utils/adminConfig';

export async function GET() {
  try {
    const data = await getAdminData();
    return NextResponse.json(data);
  } catch (error) {
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
    return NextResponse.json({ error: 'Failed to save admin data' }, { status: 500 });
  }
}

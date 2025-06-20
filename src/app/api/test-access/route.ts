import { google } from 'googleapis';
import { NextResponse } from 'next/server';

// Helper function to properly format the private key
function formatPrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  
  return key
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\/g, '')
    .trim();
}

// Initialize service account authentication
const serviceAccountAuth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: formatPrivateKey(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY),
  scopes: [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/spreadsheets'
  ]
});

export async function GET() {
  try {
    console.log('🔍 Testing service account access...');
    console.log('Service Account Email:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
    console.log('Private Key Set:', process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ? 'YES' : 'NO');
    console.log('Template Sheet ID:', process.env.GOOGLE_TEMPLATE_SHEET_ID);

    // Authorize the service account
    await serviceAccountAuth.authorize();
    console.log('✅ Service account authorized successfully');

    const drive = google.drive({ version: 'v3', auth: serviceAccountAuth });

    // Test 1: List all files the service account can access
    console.log('📋 Listing accessible files...');
    const filesResponse = await drive.files.list({
      pageSize: 10,
      fields: 'files(id,name,mimeType,parents)'
    });

    const accessibleFiles = filesResponse.data.files || [];
    console.log(`Found ${accessibleFiles.length} accessible files:`);
    accessibleFiles.forEach(file => {
      console.log(`- ${file.name} (${file.id}) [${file.mimeType}]`);
    });

    // Test 2: Try to access the specific template file
    const templateId = process.env.GOOGLE_TEMPLATE_SHEET_ID;
    if (templateId) {
      console.log(`🔍 Testing access to template file: ${templateId}`);
      try {
        const fileInfo = await drive.files.get({
          fileId: templateId,
          fields: 'id,name,permissions,parents'
        });
        console.log('✅ Template file accessible:', fileInfo.data.name);
        console.log('📋 File permissions:', fileInfo.data.permissions?.map(p => p.emailAddress).join(', '));
      } catch (error: any) {
        console.log('❌ Cannot access template file:', error.message);
      }
    }

    // Test 3: List shared drives
    console.log('🏢 Listing shared drives...');
    try {
      const drivesResponse = await drive.drives.list({
        pageSize: 10
      });
      const sharedDrives = drivesResponse.data.drives || [];
      console.log(`Found ${sharedDrives.length} shared drives:`);
      sharedDrives.forEach(drive => {
        console.log(`- ${drive.name} (${drive.id})`);
      });
    } catch (error: any) {
      console.log('❌ Cannot list shared drives:', error.message);
    }

    return NextResponse.json({
      success: true,
      accessibleFiles: accessibleFiles.map(f => ({ id: f.id, name: f.name, type: f.mimeType })),
      templateFileAccessible: templateId ? accessibleFiles.some(f => f.id === templateId) : false,
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      templateId: templateId
    });

  } catch (error: any) {
    console.error('❌ Test access failed:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message,
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      templateId: process.env.GOOGLE_TEMPLATE_SHEET_ID
    }, { status: 500 });
  }
} 
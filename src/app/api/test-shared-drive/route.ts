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

export async function GET() {
  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: formatPrivateKey(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY),
      scopes: ['https://www.googleapis.com/auth/drive']
    });

    await auth.authorize();
    const drive = google.drive({ version: 'v3', auth });

    // Test 1: List all shared drives
    const sharedDrives = await drive.drives.list({
      fields: 'drives(id,name,capabilities)'
    });

    // Test 2: Try to access the specific shared drive
    const sharedDriveId = '0AGeXmCblyF6rUk9PVA'; // From your diagnostic results
    const sharedDriveFiles = await drive.files.list({
      corpora: 'drive',
      driveId: sharedDriveId,
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
      fields: 'files(id,name,mimeType,parents,permissions)',
      pageSize: 10
    });

    // Test 3: Try to get the specific template file
    const templateId = process.env.GOOGLE_TEMPLATE_SHEET_ID;
    let templateFile = null;
    let templateError = null;
    
    if (templateId) {
      try {
        templateFile = await drive.files.get({
          fileId: templateId,
          supportsAllDrives: true,
          fields: 'id,name,mimeType,parents,permissions,driveId'
        });
      } catch (error: any) {
        templateError = error.message;
      }
    }

    return NextResponse.json({
      success: true,
      sharedDrives: {
        count: sharedDrives.data.drives?.length || 0,
        drives: sharedDrives.data.drives || []
      },
      sharedDriveFiles: {
        count: sharedDriveFiles.data.files?.length || 0,
        files: sharedDriveFiles.data.files || []
      },
      templateFile: templateFile ? {
        id: templateFile.data.id,
        name: templateFile.data.name,
        mimeType: templateFile.data.mimeType,
        driveId: templateFile.data.driveId,
        parents: templateFile.data.parents
      } : null,
      templateError: templateError
    });

  } catch (error: any) {
    console.error('Error testing shared drive access:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.toString()
    }, { status: 500 });
  }
} 
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

export async function POST() {
  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: formatPrivateKey(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY),
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });

    await auth.authorize();
    const drive = google.drive({ version: 'v3', auth });

    // Create a test file in the shared drive
    const sharedDriveId = '0AGeXmCblyF6rUk9PVA'; // From diagnostic results

    const fileMetadata = {
      name: 'Test File - Service Account Access',
      mimeType: 'application/vnd.google-apps.spreadsheet',
      parents: [sharedDriveId]
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      supportsAllDrives: true
    });

    const fileId = file.data.id;

    // Test if we can access the file we just created
    const fileInfo = await drive.files.get({
      fileId: fileId!,
      supportsAllDrives: true,
      fields: 'id,name,permissions'
    });

    return NextResponse.json({
      success: true,
      createdFile: {
        id: fileId,
        name: fileInfo.data.name,
        url: `https://docs.google.com/spreadsheets/d/${fileId}`
      },
      message: 'Service account successfully created and accessed a file'
    });

  } catch (error: any) {
    console.error('Error creating test file:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 
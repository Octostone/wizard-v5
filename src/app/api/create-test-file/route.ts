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
  return await createTestFile();
}

export async function POST() {
  return await createTestFile();
}

async function createTestFile() {
  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: formatPrivateKey(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY),
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });

    await auth.authorize();
    const drive = google.drive({ version: 'v3', auth });

    // Create a test file
    const fileMetadata = {
      name: 'Test File - Service Account Access',
      mimeType: 'application/vnd.google-apps.document',
      parents: [] // This will create it in the service account's root
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id,name,webViewLink'
    });

    return NextResponse.json({
      success: true,
      message: 'Test file created successfully',
      fileId: file.data.id,
      fileName: file.data.name,
      webViewLink: file.data.webViewLink
    });

  } catch (error: any) {
    console.error('Error creating test file:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.toString()
    }, { status: 500 });
  }
} 
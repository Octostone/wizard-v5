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
    // Initialize service account authentication
    const serviceAccountAuth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: formatPrivateKey(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY),
      scopes: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/spreadsheets'
      ]
    });

    // Authorize the service account
    await serviceAccountAuth.authorize();

    // Test Drive access
    const drive = google.drive({ version: 'v3', auth: serviceAccountAuth });
    
    // List files the service account has access to
    const filesResponse = await drive.files.list({
      pageSize: 10,
      fields: 'files(id,name,parents,permissions)',
      q: "mimeType='application/vnd.google-apps.spreadsheet'"
    });

    const files = filesResponse.data.files || [];

    return NextResponse.json({
      success: true,
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      accessibleFiles: files.map(file => ({
        id: file.id,
        name: file.name,
        permissions: file.permissions?.map(p => p.emailAddress)
      }))
    });

  } catch (error: any) {
    console.error('Service account test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    }, { status: 500 });
  }
} 
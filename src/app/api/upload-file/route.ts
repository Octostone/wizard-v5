import { google } from 'googleapis';
import { NextResponse } from 'next/server';

// Helper function to properly format the private key
function formatPrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  return key.replace(/\\n/g, '\n').trim();
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const targetFolderId = formData.get('targetFolderId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!targetFolderId) {
      return NextResponse.json({ error: 'No target folder ID provided' }, { status: 400 });
    }

    // Validate file type
    const acceptedTypes = ['image/jpeg', 'image/png'];
    if (!acceptedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG and PNG are allowed.' }, { status: 400 });
    }

    // Validate file size (100KB limit)
    const maxSize = 100 * 1024; // 100KB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 100KB.' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Google API Authentication
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: formatPrivateKey(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY),
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/spreadsheets'
      ],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Upload file to Google Drive
    const fileMetadata = {
      name: file.name,
      parents: [targetFolderId],
      mimeType: file.type,
    };

    const media = {
      mimeType: file.type,
      body: buffer,
    };

    const uploadedFile = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id,name,webViewLink,webContentLink',
      supportsAllDrives: true,
    });

    if (!uploadedFile.data.id) {
      throw new Error('Failed to upload file to Google Drive');
    }

    return NextResponse.json({
      success: true,
      fileId: uploadedFile.data.id,
      fileName: uploadedFile.data.name,
      webViewLink: uploadedFile.data.webViewLink,
      webContentLink: uploadedFile.data.webContentLink,
    });

  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { 
        error: 'An error occurred during file upload.',
        details: error.message 
      }, 
      { status: 500 }
    );
  }
} 
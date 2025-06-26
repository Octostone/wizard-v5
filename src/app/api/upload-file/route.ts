import { google } from 'googleapis';
import { NextResponse } from 'next/server';

// Route segment config for file uploads
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Helper function to properly format the private key
function formatPrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  return key.replace(/\\n/g, '\n').trim();
}

export async function POST(request: Request) {
  try {
    console.log('🔍 Starting file upload process...');
    
    // Check environment variables
    console.log('🔍 Environment variables check:');
    console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'SET' : 'NOT SET');
    console.log('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY:', process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ? 'SET (length: ' + process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.length + ')' : 'NOT SET');

    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
      console.error('❌ Missing required environment variables');
      return NextResponse.json({ 
        error: 'Server configuration error: Missing Google service account credentials',
        details: 'GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY not set'
      }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const targetFolderId = formData.get('targetFolderId') as string;

    console.log('🔍 Form data received:');
    console.log('File:', file ? `name: ${file.name}, size: ${file.size}, type: ${file.type}` : 'null');
    console.log('Target folder ID:', targetFolderId);

    if (!file) {
      console.error('❌ No file provided');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!targetFolderId) {
      console.error('❌ No target folder ID provided');
      return NextResponse.json({ error: 'No target folder ID provided' }, { status: 400 });
    }

    // Validate file type
    const acceptedTypes = ['image/jpeg', 'image/png'];
    if (!acceptedTypes.includes(file.type)) {
      console.error('❌ Invalid file type:', file.type);
      return NextResponse.json({ error: 'Invalid file type. Only JPEG and PNG are allowed.' }, { status: 400 });
    }

    // Validate file size (100KB limit)
    const maxSize = 100 * 1024; // 100KB
    if (file.size > maxSize) {
      console.error('❌ File too large:', file.size, 'bytes');
      return NextResponse.json({ error: 'File too large. Maximum size is 100KB.' }, { status: 400 });
    }

    console.log('✅ File validation passed');

    // Convert file to buffer
    console.log('🔄 Converting file to buffer...');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log('✅ File converted to buffer, size:', buffer.length, 'bytes');

    // Google API Authentication
    console.log('🔐 Setting up Google API authentication...');
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: formatPrivateKey(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY),
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/spreadsheets'
      ],
    });

    console.log('🔐 Authorizing Google API...');
    await auth.authorize();
    console.log('✅ Google API authorization successful');

    const drive = google.drive({ version: 'v3', auth });

    // Upload file to Google Drive
    console.log('📤 Uploading file to Google Drive...');
    console.log('Target folder ID:', targetFolderId);
    console.log('File name:', file.name);
    console.log('File type:', file.type);

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

    console.log('✅ File uploaded successfully');
    console.log('File ID:', uploadedFile.data.id);
    console.log('File name:', uploadedFile.data.name);
    console.log('Web view link:', uploadedFile.data.webViewLink);

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
    console.error('❌ Error uploading file:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      response: error.response?.data
    });
    
    // Provide more specific error messages
    let errorMessage = 'An error occurred during file upload.';
    let errorDetails = error.message;

    if (error.code === 403) {
      errorMessage = 'Access denied. Please check folder permissions.';
      errorDetails = 'The service account does not have permission to upload to the specified folder.';
    } else if (error.code === 404) {
      errorMessage = 'Target folder not found.';
      errorDetails = 'The specified folder ID does not exist or is not accessible.';
    } else if (error.message?.includes('invalid_grant')) {
      errorMessage = 'Authentication failed.';
      errorDetails = 'Google service account credentials are invalid or expired.';
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        code: error.code
      }, 
      { status: 500 }
    );
  }
} 
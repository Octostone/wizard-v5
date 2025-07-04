import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { Readable } from 'stream';

// Route segment config for file uploads
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Helper function to properly format the private key
function formatPrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  return key.replace(/\\n/g, '\n').trim();
}

// Helper function to convert buffer to readable stream
function bufferToStream(buffer: Buffer): Readable {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
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

    // Parse FormData to get the actual uploaded file
    console.log('📦 Parsing FormData...');
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
    let fileBuffer: Buffer;
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      console.log('✅ File converted to buffer, size:', fileBuffer.length, 'bytes');
    } catch (bufferError: any) {
      console.error('❌ Error converting file to buffer:', bufferError);
      return NextResponse.json({
        error: 'Failed to process file data',
        details: bufferError.message || 'Error converting file to buffer',
        code: 'BUFFER_ERROR'
      }, { status: 500 });
    }

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
    try {
      await auth.authorize();
      console.log('✅ Google API authorization successful');
    } catch (authError: any) {
      console.error('❌ Google API authorization failed:', authError);
      return NextResponse.json({
        error: 'Google API authentication failed',
        details: authError.message || 'Failed to authenticate with Google API',
        code: 'AUTH_ERROR'
      }, { status: 500 });
    }

    const drive = google.drive({ version: 'v3', auth });

    // Test folder access first
    console.log('🔍 Testing folder access...');
    try {
      await drive.files.get({
        fileId: targetFolderId,
        fields: 'id,name',
        supportsAllDrives: true,
      });
      console.log('✅ Folder access confirmed');
    } catch (folderError: any) {
      console.error('❌ Folder access failed:', folderError);
      return NextResponse.json({
        error: 'Cannot access target folder',
        details: folderError.message || 'The specified folder does not exist or is not accessible',
        code: folderError.code || 'FOLDER_ACCESS_ERROR'
      }, { status: 500 });
    }

    // Upload actual file to Google Drive using stream
    console.log('📤 Uploading file to Google Drive...');
    console.log('Target folder ID:', targetFolderId);
    console.log('File name:', file.name);
    console.log('File type:', file.type);

    const fileMetadata = {
      name: file.name,
      parents: [targetFolderId],
      mimeType: file.type,
    };

    // Convert buffer to readable stream to avoid multipart upload issues
    const fileStream = bufferToStream(fileBuffer);

    const media = {
      mimeType: file.type,
      body: fileStream,
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
      response: error.response?.data,
      stack: error.stack
    });
    
    // Provide more specific error messages
    let errorMessage = 'An error occurred during file upload.';
    let errorDetails = error.message || 'Unknown error';
    let errorCode = error.code || 'UNKNOWN_ERROR';

    if (error.code === 403) {
      errorMessage = 'Access denied. Please check folder permissions.';
      errorDetails = 'The service account does not have permission to upload to the specified folder.';
      errorCode = 'PERMISSION_DENIED';
    } else if (error.code === 404) {
      errorMessage = 'Target folder not found.';
      errorDetails = 'The specified folder ID does not exist or is not accessible.';
      errorCode = 'FOLDER_NOT_FOUND';
    } else if (error.message?.includes('invalid_grant')) {
      errorMessage = 'Authentication failed.';
      errorDetails = 'Google service account credentials are invalid or expired.';
      errorCode = 'AUTH_ERROR';
    } else if (error.message?.includes('quota')) {
      errorMessage = 'Upload quota exceeded.';
      errorDetails = 'Google Drive upload quota has been exceeded.';
      errorCode = 'QUOTA_EXCEEDED';
    } else if (error.message?.includes('pipe is not a function')) {
      errorMessage = 'File processing error.';
      errorDetails = 'Error processing file data. Please try again.';
      errorCode = 'FILE_PROCESSING_ERROR';
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        code: errorCode
      }, 
      { status: 500 }
    );
  }
} 
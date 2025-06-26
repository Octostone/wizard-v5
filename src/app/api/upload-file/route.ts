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

    // Get the raw request body as a buffer
    const requestBuffer = await request.arrayBuffer();
    console.log('📦 Raw request buffer size:', requestBuffer.byteLength);

    // For now, let's create a simple test file to verify the Google Drive upload works
    // We'll implement proper FormData parsing later
    console.log('🔍 Creating test file for upload...');
    
    const testFileName = 'test-image.jpg';
    const testFileContent = Buffer.from('test image content');
    const targetFolderId = '1Yild77pDrcQHjGNMtHN_xwNll2bV3TmJ'; // Use the folder ID from the request

    console.log('🔍 Test file details:');
    console.log('File name:', testFileName);
    console.log('File size:', testFileContent.length, 'bytes');
    console.log('Target folder ID:', targetFolderId);

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

    // Upload test file to Google Drive
    console.log('📤 Uploading test file to Google Drive...');
    console.log('Target folder ID:', targetFolderId);
    console.log('File name:', testFileName);

    const fileMetadata = {
      name: testFileName,
      parents: [targetFolderId],
      mimeType: 'image/jpeg',
    };

    const media = {
      mimeType: 'image/jpeg',
      body: testFileContent,
    };

    const uploadedFile = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id,name,webViewLink,webContentLink',
      supportsAllDrives: true,
    });

    console.log('✅ Test file uploaded successfully');
    console.log('File ID:', uploadedFile.data.id);
    console.log('File name:', uploadedFile.data.name);
    console.log('Web view link:', uploadedFile.data.webViewLink);

    if (!uploadedFile.data.id) {
      throw new Error('Failed to upload test file to Google Drive');
    }

    return NextResponse.json({
      success: true,
      fileId: uploadedFile.data.id,
      fileName: uploadedFile.data.name,
      webViewLink: uploadedFile.data.webViewLink,
      webContentLink: uploadedFile.data.webContentLink,
      message: 'Test file uploaded successfully. FormData parsing will be implemented next.'
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
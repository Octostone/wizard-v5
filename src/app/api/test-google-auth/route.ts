import { google } from 'googleapis';
import { NextResponse } from 'next/server';

// Helper function to properly format the private key
function formatPrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  return key.replace(/\\n/g, '\n').trim();
}

export async function GET() {
  try {
    console.log('🔍 Testing Google Drive API authentication...');
    
    // Check environment variables
    console.log('🔍 Environment variables check:');
    console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'SET' : 'NOT SET');
    console.log('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY:', process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ? 'SET (length: ' + process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.length + ')' : 'NOT SET');

    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
      console.error('❌ Missing required environment variables');
      return NextResponse.json({ 
        error: 'Missing Google service account credentials',
        details: 'GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY not set'
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

    // Test folder access
    const testFolderId = '1Yild77pDrcQHjGNMtHN_xwNll2bV3TmJ';
    console.log('🔍 Testing folder access for:', testFolderId);
    
    try {
      const folderInfo = await drive.files.get({
        fileId: testFolderId,
        fields: 'id,name,mimeType',
        supportsAllDrives: true,
      });
      console.log('✅ Folder access confirmed:', folderInfo.data);
    } catch (folderError: any) {
      console.error('❌ Folder access failed:', folderError);
      return NextResponse.json({
        error: 'Cannot access target folder',
        details: folderError.message || 'The specified folder does not exist or is not accessible',
        code: folderError.code || 'FOLDER_ACCESS_ERROR'
      }, { status: 500 });
    }

    // Test creating a simple file
    console.log('📤 Testing file creation...');
    const testFileName = 'test-file-' + Date.now() + '.txt';
    const testContent = 'This is a test file created by the Flourish Wizard API.';

    const fileMetadata = {
      name: testFileName,
      parents: [testFolderId],
      mimeType: 'text/plain',
    };

    const media = {
      mimeType: 'text/plain',
      body: testContent,
    };

    const uploadedFile = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id,name,webViewLink',
      supportsAllDrives: true,
    });

    console.log('✅ Test file created successfully:', uploadedFile.data);

    return NextResponse.json({
      success: true,
      message: 'Google Drive API test successful',
      testFile: {
        id: uploadedFile.data.id,
        name: uploadedFile.data.name,
        webViewLink: uploadedFile.data.webViewLink,
      },
      folderInfo: {
        id: testFolderId,
        accessible: true,
      }
    });

  } catch (error: any) {
    console.error('❌ Error in Google Drive API test:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      response: error.response?.data,
      stack: error.stack
    });
    
    return NextResponse.json(
      { 
        error: 'Google Drive API test failed',
        details: error.message || 'Unknown error',
        code: error.code || 'UNKNOWN_ERROR'
      }, 
      { status: 500 }
    );
  }
} 
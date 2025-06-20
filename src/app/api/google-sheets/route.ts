import { google } from 'googleapis';
import { NextResponse } from 'next/server';

// Helper function to properly format the private key
function formatPrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  return key.replace(/\\n/g, '\n').trim();
}

// Template sheet ID - this should be stored in environment variables
const TEMPLATE_SHEET_ID = process.env.GOOGLE_TEMPLATE_SHEET_ID;

export async function POST(request: Request) {
  try {
    // --- Environment Variable and Request Body Validation ---
    if (!TEMPLATE_SHEET_ID) {
      console.error('CRITICAL: GOOGLE_TEMPLATE_SHEET_ID environment variable is not set.');
      throw new Error('GOOGLE_TEMPLATE_SHEET_ID environment variable is not set');
    }

    const body = await request.json();
    const { 
      outputFileName, 
      targetFolderId, 
      formData 
    } = body;

    if (!outputFileName || !targetFolderId || !formData) {
      return NextResponse.json({ error: 'Missing required fields in request body' }, { status: 400 });
    }

    // --- Google API Authentication ---
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: formatPrivateKey(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY),
      scopes: [
        'https://www.googleapis.com/auth/drive', // Use the broader 'drive' scope that we know works
        'https://www.googleapis.com/auth/spreadsheets'
      ],
    });

    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });

    // --- Step 1: Verify Template Access (with enhanced debugging) ---
    try {
      await drive.files.get({
        fileId: TEMPLATE_SHEET_ID,
        fields: 'id, name',
        supportsAllDrives: true,
      });
    } catch (error: any) {
      console.error(`CRITICAL: Failed to access template file ID: ${TEMPLATE_SHEET_ID}.`, error.response?.data || error.message);
      throw new Error(`Cannot access template file. Please verify it exists and the service account has 'Content manager' access to the shared drive containing the template. Details: ${error.message}`);
    }
    
    // --- Step 2: Copy the Template File ---
    const copiedFile = await drive.files.copy({
      fileId: TEMPLATE_SHEET_ID,
      requestBody: {
        name: outputFileName,
        parents: [targetFolderId],
      },
      supportsAllDrives: true,
      fields: 'id, webViewLink',
    });

    const newSheetId = copiedFile.data.id;
    if (!newSheetId) {
      throw new Error('Failed to create a copy of the template file.');
    }

    // --- Step 3: Write Form Data to the New Sheet ---
    // (The rest of the logic remains the same)
    const clientData = [
      formData.clientName || '',
      formData.clientEmail || '',
      formData.clientPhone || '',
      formData.clientWebsite || '',
      formData.businessName || '',
      formData.businessAddress || '',
      formData.industry || ''
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: newSheetId,
      range: 'Client & Business!B3:B9',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: clientData.map(value => [value])
      },
    });

    // ... (Add other data writes here, e.g., App, Events, Campaigns)

    // --- Success Response ---
    return NextResponse.json({
      message: 'Sheet created and updated successfully!',
      spreadsheetId: newSheetId,
      spreadsheetUrl: copiedFile.data.webViewLink,
    });

  } catch (error: any) {
    console.error('Error in Google Sheets operation:', error);
    return NextResponse.json(
      { 
        error: 'An error occurred during the Google Sheets operation.',
        details: error.message 
      }, 
      { status: 500 }
    );
  }
} 
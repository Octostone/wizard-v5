import { google } from 'googleapis';
import { NextResponse } from 'next/server';

// Use google.auth.OAuth2 for compatibility with googleapis

// Initialize OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Template sheet ID - this should be stored in environment variables
const TEMPLATE_SHEET_ID = process.env.TEMPLATE_SHEET_ID;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      outputFileName, 
      targetFolderId, 
      formData 
    } = body;

    if (!TEMPLATE_SHEET_ID) {
      throw new Error('TEMPLATE_SHEET_ID environment variable is not set');
    }
    if (!outputFileName) {
      throw new Error('outputFileName is required');
    }
    if (!targetFolderId) {
      throw new Error('targetFolderId is required');
    }

    // Set credentials
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    // Initialize Google Drive and Sheets APIs
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    // 1. Copy the template file
    const copyResponse = await drive.files.copy({
      fileId: TEMPLATE_SHEET_ID,
      requestBody: {
        name: outputFileName,
        parents: [targetFolderId]
      }
    });

    const newFileId = copyResponse.data.id;

    if (!newFileId) {
      throw new Error('Failed to create copy of template');
    }

    // 2. Update the sheet with form data
    // Write Client Basics
    await sheets.spreadsheets.values.update({
      spreadsheetId: newFileId,
      range: 'Client Basics!A2:C2',
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          [
            formData.accountManager || '',
            formData.clientDBAName || '',
            formData.billingName || ''
          ]
        ]
      }
    });

    // Write Client Details
    await sheets.spreadsheets.values.update({
      spreadsheetId: newFileId,
      range: 'Client Details!A2:E2',
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          [
            formData.flourishClientName || '',
            formData.mmp || '',
            formData.netGross || '',
            formData.grossDeduction || '',
            formData.baseCM || ''
          ]
        ]
      }
    });

    return NextResponse.json({ 
      success: true, 
      fileId: newFileId,
      fileUrl: `https://docs.google.com/spreadsheets/d/${newFileId}`
    });

  } catch (error) {
    console.error('Error in Google Sheets operation:', error);
    return NextResponse.json(
      { error: 'Failed to process Google Sheets operation' },
      { status: 500 }
    );
  }
} 
import { google } from 'googleapis';
import { NextResponse } from 'next/server';

// Helper function to properly format the private key
function formatPrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  
  // Remove any existing formatting and ensure proper line breaks
  return key
    .replace(/\\n/g, '\n')  // Replace \n with actual line breaks
    .replace(/\\r/g, '\r')  // Replace \r with actual carriage returns
    .replace(/\\t/g, '\t')  // Replace \t with actual tabs
    .replace(/\\/g, '')     // Remove any remaining backslashes
    .trim();                // Remove leading/trailing whitespace
}

// Initialize service account authentication using JWT
const serviceAccountAuth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: formatPrivateKey(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY),
  scopes: [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/spreadsheets'
  ]
});

// Template sheet ID - this should be stored in environment variables
const TEMPLATE_SHEET_ID = process.env.GOOGLE_TEMPLATE_SHEET_ID;

export async function POST(request: Request) {
  try {
    // Debug: Log environment variables (remove in production)
    console.log('Environment variables check:');
    console.log('GOOGLE_TEMPLATE_SHEET_ID:', process.env.GOOGLE_TEMPLATE_SHEET_ID ? 'SET' : 'NOT SET');
    console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'SET' : 'NOT SET');
    console.log('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY:', process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ? 'SET' : 'NOT SET');
    
    const body = await request.json();
    const { 
      outputFileName, 
      targetFolderId, 
      formData 
    } = body;

    if (!TEMPLATE_SHEET_ID) {
      throw new Error('GOOGLE_TEMPLATE_SHEET_ID environment variable is not set');
    }
    if (!outputFileName) {
      throw new Error('outputFileName is required');
    }
    if (!targetFolderId) {
      throw new Error('targetFolderId is required');
    }

    // Authorize the service account
    await serviceAccountAuth.authorize();

    // Debug: Test if we can access the template file
    try {
      console.log('🔍 Testing access to template file:', TEMPLATE_SHEET_ID);
      const drive = google.drive({ version: 'v3', auth: serviceAccountAuth });
      const fileInfo = await drive.files.get({
        fileId: TEMPLATE_SHEET_ID,
        fields: 'id,name,permissions'
      });
      console.log('✅ Template file accessible:', fileInfo.data.name);
      console.log('📋 File permissions:', fileInfo.data.permissions?.map(p => p.emailAddress).join(', '));
    } catch (error: any) {
      console.log('❌ Cannot access template file:', error.message);
      console.log('This means the service account does not have access to this file');
      throw new Error(`Cannot access template file: ${error.message}`);
    }

    // Initialize Google Drive and Sheets APIs with service account
    const drive = google.drive({ version: 'v3', auth: serviceAccountAuth });
    const sheets = google.sheets({ version: 'v4', auth: serviceAccountAuth });

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

    // Write App Info
    await sheets.spreadsheets.values.update({
      spreadsheetId: newFileId,
      range: 'App Info!A2:I2',
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          [
            formData.accountManager || '',
            formData.flourishClientName || '',
            formData.appName || '',
            formData.os || '',
            formData.storeUrl || '',
            formData.retributionDays || '',
            formData.category1 || '',
            formData.category2 || '',
            formData.category3 || ''
          ]
        ]
      }
    });

    // Write Events tab (multiple rows)
    if (Array.isArray(formData.events) && formData.events.length > 0) {
      // Map each event to the correct order of columns
      const eventRows = formData.events.map((event: any) => [
        event.position || '',
        event.name || '',
        event.postbackEventName || '',
        event.estCRPercent || '',
        event.estTTCMins || '',
        event.eventType || '',
        event.pubReveSource || ''
      ]);
      // Write all event rows starting at A2
      await sheets.spreadsheets.values.update({
        spreadsheetId: newFileId,
        range: `Events!A2:G${formData.events.length + 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: eventRows
        }
      });
    }

    // Write Campaign tab
    await sheets.spreadsheets.values.update({
      spreadsheetId: newFileId,
      range: 'Campaign!A2:Q2',
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          [
            formData.accountManager || '',
            formData.flourishClientName || '',
            formData.appName || '',
            formData.geo || '',
            formData.clientCampaignName || '',
            formData.monthlyBudget || '',
            formData.dailyBudget || '',
            formData.pricingModel || '',
            formData.carouselSpotlight || '',
            formData.clickUrl || '',
            formData.enableSpiral ? 'TRUE' : 'FALSE',
            formData.D7 || '',
            formData.D14 || '',
            formData.D30 || '',
            formData.D60 || '',
            formData.D90 || '',
            formData.D180 || ''
          ]
        ]
      }
    });

    // Write Offers tab (multiple rows)
    if (Array.isArray(formData.offers) && formData.offers.length > 0) {
      // Map each offer to the correct order of columns
      const offerRows = formData.offers.map((offer: any) => [
        offer.geo || '',
        offer.gender || '',
        offer.minAge || '',
        offer.maxAge || '',
        offer.minOS || '',
        offer.maxOS || '',
        offer.cpi || '',
        offer.cpiOverride || '',
        offer.dailyBudget || '',
        offer.dailyCap || '',
        offer.clientOfferName || ''
      ]);
      // Write all offer rows starting at A2
      await sheets.spreadsheets.values.update({
        spreadsheetId: newFileId,
        range: `Offers!A2:K${formData.offers.length + 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: offerRows
        }
      });
    }

    // Write Images tab
    await sheets.spreadsheets.values.update({
      spreadsheetId: newFileId,
      range: 'Images!A2:G2',
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          [
            formData.flourishClientName || '',
            formData.appName || '',
            formData.geo || '',
            formData.iconImageName || '',
            formData.iconImageLink || '',
            formData.fillImageName || '',
            formData.fillImageLink || ''
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
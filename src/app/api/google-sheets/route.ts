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
    // This logic is restored from the original version to match the template's structure.
    
    // Write Client Basics
    await sheets.spreadsheets.values.update({
      spreadsheetId: newSheetId,
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
      spreadsheetId: newSheetId,
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
      spreadsheetId: newSheetId,
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
      const eventRows = formData.events.map((event: any) => [
        event.position || '',
        event.name || '',
        event.postbackEventName || '',
        event.estCRPercent || '',
        event.estTTCMins || '',
        event.eventType || '',
        event.pubReveSource || ''
      ]);
      await sheets.spreadsheets.values.update({
        spreadsheetId: newSheetId,
        range: `Events!A2:G${formData.events.length + 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: eventRows
        }
      });
    }

    // Write Campaign tab
    await sheets.spreadsheets.values.update({
      spreadsheetId: newSheetId,
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
      await sheets.spreadsheets.values.update({
        spreadsheetId: newSheetId,
        range: `Offers!A2:K${formData.offers.length + 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: offerRows
        }
      });
    }

    // Write Images tab
    await sheets.spreadsheets.values.update({
      spreadsheetId: newSheetId,
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
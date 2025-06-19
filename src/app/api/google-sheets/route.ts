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
    // Debug: Log environment variables (remove in production)
    console.log('Environment variables check:');
    console.log('TEMPLATE_SHEET_ID:', process.env.TEMPLATE_SHEET_ID ? 'SET' : 'NOT SET');
    console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET');
    console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET');
    console.log('GOOGLE_REFRESH_TOKEN:', process.env.GOOGLE_REFRESH_TOKEN ? 'SET' : 'NOT SET');
    
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

    // Debug: Get the authenticated user info
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      console.log('✅ Authenticated as:', userInfo.data.email);
    } catch (error: any) {
      console.log('⚠️ Could not get user info, using service account or other auth method');
      console.log('Error details:', error.message);
    }

    // Initialize Google Drive and Sheets APIs
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    // Debug: Test if we can access the template file
    try {
      console.log('🔍 Testing access to template file:', TEMPLATE_SHEET_ID);
      const fileInfo = await drive.files.get({
        fileId: TEMPLATE_SHEET_ID,
        fields: 'id,name,permissions'
      });
      console.log('✅ Template file accessible:', fileInfo.data.name);
      console.log('📋 File permissions:', fileInfo.data.permissions?.map(p => p.emailAddress).join(', '));
    } catch (error: any) {
      console.log('❌ Cannot access template file:', error.message);
      console.log('This means the authenticated user does not have access to this file');
    }

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
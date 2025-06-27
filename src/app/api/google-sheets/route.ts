import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { Readable } from 'stream';
import { getAdminData } from '../../../utils/adminConfig';

// Helper function to properly format the private key
function formatPrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  return key.replace(/\\n/g, '\n').trim();
}

// Template sheet ID - this should be stored in environment variables
const TEMPLATE_SHEET_ID = process.env.TEMPLATE_SHEET_ID || process.env.GOOGLE_TEMPLATE_SHEET_ID;

export async function POST(request: Request) {
  try {
    console.log('🔍 Google Sheets API called');
    
    // --- Environment Variable and Request Body Validation ---
    console.log('🔍 Environment variables check:');
    console.log('TEMPLATE_SHEET_ID:', process.env.TEMPLATE_SHEET_ID ? 'SET' : 'NOT SET');
    console.log('GOOGLE_TEMPLATE_SHEET_ID:', process.env.GOOGLE_TEMPLATE_SHEET_ID ? 'SET' : 'NOT SET');
    console.log('Final TEMPLATE_SHEET_ID value:', TEMPLATE_SHEET_ID ? 'SET' : 'NOT SET');
    
    if (!TEMPLATE_SHEET_ID) {
      console.error('CRITICAL: TEMPLATE_SHEET_ID environment variable is not set.');
      console.error('Available environment variables:', Object.keys(process.env).filter(key => key.includes('SHEET') || key.includes('GOOGLE')));
      throw new Error('TEMPLATE_SHEET_ID environment variable is not set');
    }

    const body = await request.json();
    console.log('📦 Request body received:', {
      hasOutputFileName: !!body.outputFileName,
      hasTargetFolderId: !!body.targetFolderId,
      hasFormData: !!body.formData,
      uploadedFilesCount: body.formData?.uploadedFiles?.length || 0
    });
    
    const { 
      outputFileName, 
      targetFolderId, 
      formData 
    } = body;

    if (!outputFileName || !targetFolderId || !formData) {
      console.error('❌ Missing required fields:', { outputFileName, targetFolderId, hasFormData: !!formData });
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
    console.log('📋 Copying template file...');
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
      console.error('❌ Failed to get new sheet ID from copied file');
      throw new Error('Failed to create a copy of the template file.');
    }
    
    console.log('✅ Google Sheet created with ID:', newSheetId);

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

    // Write Images tab - handle multiple files
    const imageRows = [];
    
    // Process uploaded icon files
    if (Array.isArray(formData.uploadedFiles)) {
      const iconFiles = formData.uploadedFiles.filter((file: any) => file.type === 'icon');
      const fillFiles = formData.uploadedFiles.filter((file: any) => file.type === 'fill');
      
      // Create rows for icon files
      iconFiles.forEach((file: any) => {
        imageRows.push([
          formData.flourishClientName || '',
          formData.appName || '',
          formData.geo || '',
          file.name || '',
          file.webViewLink || '',
          '', // Empty fill image name
          ''  // Empty fill image link
        ]);
      });
      
      // Create rows for fill files
      fillFiles.forEach((file: any) => {
        imageRows.push([
          formData.flourishClientName || '',
          formData.appName || '',
          formData.geo || '',
          '', // Empty icon image name
          '', // Empty icon image link
          file.name || '',
          file.webViewLink || ''
        ]);
      });
    }

    // If no files were uploaded, add a default row
    if (imageRows.length === 0) {
      imageRows.push([
        formData.flourishClientName || '',
        formData.appName || '',
        formData.geo || '',
        formData.iconImageName || '',
        formData.iconImageLink || '',
        formData.fillImageName || '',
        formData.fillImageLink || ''
      ]);
    }

    // Write all image rows to the sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId: newSheetId,
      range: `Images!A2:G${imageRows.length + 1}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: imageRows
      }
    });

    // --- Step 4: Send Email Notification ---
    console.log('📧 Sending email notification...');
    try {
      // Get admin data to access email templates and settings
      console.log('🔍 Fetching admin data for email configuration...');
      const adminData = await getAdminData();
      console.log('📊 Admin data received:', {
        hasEmailSettings: !!adminData.emailSettings,
        enableNotifications: adminData.emailSettings?.enableNotifications,
        accountManagersCount: adminData.accountManagers?.length,
        accountManagers: adminData.accountManagers?.map((am: any) => ({ name: am.name, hasEmail: !!am.email }))
      });
      
      // Check if email notifications are enabled
      if (adminData.emailSettings?.enableNotifications) {
        console.log('✅ Email notifications are enabled');
        
        // Find the account manager's email
        const accountManager = adminData.accountManagers?.find((am: any) => am.name === formData.accountManager);
        console.log('👤 Looking for account manager:', formData.accountManager);
        console.log('👤 Found account manager:', accountManager);
        
        const accountManagerEmail = accountManager?.email;
        console.log('📧 Account manager email:', accountManagerEmail);
        
        if (accountManagerEmail) {
          console.log('✅ Account manager email found, preparing email data...');
          
          // Prepare form summary
          const formSummary = `
            <strong>Client:</strong> ${formData.flourishClientName}<br>
            <strong>App:</strong> ${formData.appName}<br>
            <strong>Geo:</strong> ${formData.geo}<br>
            <strong>Campaign:</strong> ${formData.clientCampaignName}<br>
            <strong>Images:</strong> ${formData.uploadedFiles?.length || 0} files uploaded
          `;
          
          // Prepare Google folder URL
          const googleFolderUrl = `https://drive.google.com/drive/folders/${targetFolderId}`;
          
          const emailPayload = {
            accountManagerName: formData.accountManager,
            accountManagerEmail: accountManagerEmail,
            clientName: formData.flourishClientName,
            fileName: outputFileName,
            googleSheetUrl: copiedFile.data.webViewLink,
            googleFolderUrl: googleFolderUrl,
            formSummary: formSummary,
            additionalRecipients: adminData.emailSettings?.defaultRecipients || [],
            emailSubject: adminData.emailTemplates?.subject || 'New Campaign Created: {clientName} - {fileName}',
            emailBody: adminData.emailTemplates?.body || 'A new campaign has been created.'
          };
          
          console.log('📧 Email payload prepared:', {
            to: accountManagerEmail,
            additionalRecipients: emailPayload.additionalRecipients,
            subject: emailPayload.emailSubject,
            hasBody: !!emailPayload.emailBody
          });
          
          // Send email notification using the full Vercel deployment URL
          console.log('📧 Calling send-notification API...');
          const emailResponse = await fetch(`${process.env.VERCEL_URL}/api/send-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailPayload),
          });
          
          console.log('📡 Send-notification API response status:', emailResponse.status);
          
          if (emailResponse.ok) {
            const emailData = await emailResponse.json();
            console.log('✅ Email notification sent successfully:', emailData);
          } else {
            const errorText = await emailResponse.text();
            console.error('❌ Failed to send email notification. Status:', emailResponse.status);
            console.error('❌ Error response:', errorText);
          }
        } else {
          console.warn('⚠️ Account manager email not found for:', formData.accountManager);
          console.warn('⚠️ Available account managers:', adminData.accountManagers?.map((am: any) => `${am.name}: ${am.email || 'NO EMAIL'}`));
        }
      } else {
        console.log('ℹ️ Email notifications are disabled in admin settings');
        console.log('ℹ️ Email settings:', adminData.emailSettings);
      }
    } catch (emailError) {
      console.error('❌ Error sending email notification:', emailError);
      console.error('❌ Error details:', {
        message: emailError instanceof Error ? emailError.message : 'Unknown error',
        stack: emailError instanceof Error ? emailError.stack : undefined
      });
      // Don't fail the entire operation if email fails
    }

    // --- Success Response ---
    return NextResponse.json({
      success: true,
      message: 'Sheet created and updated successfully!',
      fileId: newSheetId,
      fileUrl: copiedFile.data.webViewLink,
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
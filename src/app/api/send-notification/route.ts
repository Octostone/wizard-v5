import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

interface EmailData {
  accountManagerName: string;
  accountManagerEmail: string;
  clientName: string;
  fileName: string;
  googleSheetUrl: string;
  googleFolderUrl: string;
  formSummary: string;
  additionalRecipients: string[];
  emailSubject: string;
  emailBody: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Send-notification API called');
    
    // Initialize Resend client inside the function
    const resend = new Resend(process.env.RESEND_API_KEY);
    console.log('🔑 Resend API key configured:', !!process.env.RESEND_API_KEY);
    
    const data: EmailData = await request.json();
    console.log('📦 Email data received:', {
      accountManagerName: data.accountManagerName,
      accountManagerEmail: data.accountManagerEmail,
      clientName: data.clientName,
      fileName: data.fileName,
      additionalRecipientsCount: data.additionalRecipients?.length || 0,
      hasSubject: !!data.emailSubject,
      hasBody: !!data.emailBody
    });
    
    // Combine account manager email with additional recipients
    const allRecipients = [
      data.accountManagerEmail,
      ...data.additionalRecipients
    ].filter(Boolean); // Remove empty strings
    
    console.log('📧 All recipients:', allRecipients);
    
    if (allRecipients.length === 0) {
      console.error('❌ No valid recipients found');
      return NextResponse.json(
        { error: 'No valid recipients found' },
        { status: 400 }
      );
    }

    // Replace placeholders in email content
    const processedSubject = data.emailSubject
      .replace('{accountManagerName}', data.accountManagerName)
      .replace('{clientName}', data.clientName)
      .replace('{fileName}', data.fileName);

    const processedBody = data.emailBody
      .replace('{accountManagerName}', data.accountManagerName)
      .replace('{clientName}', data.clientName)
      .replace('{fileName}', data.fileName)
      .replace('{googleSheetUrl}', data.googleSheetUrl)
      .replace('{googleFolderUrl}', data.googleFolderUrl)
      .replace('{formSummary}', data.formSummary);

    console.log('📧 Processed email content:', {
      subject: processedSubject,
      bodyLength: processedBody.length,
      bodyPreview: processedBody.substring(0, 200) + '...'
    });

    console.log('📧 Sending email via Resend...');
    const { data: emailData, error } = await resend.emails.send({
      from: 'Flourish Wizard <onboarding@resend.dev>',
      to: allRecipients,
      subject: processedSubject,
      html: processedBody,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      console.error('❌ Resend error details:', {
        message: error.message,
        name: error.name
      });
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      );
    }

    console.log('✅ Email sent successfully via Resend:', {
      messageId: emailData?.id,
      recipients: allRecipients
    });

    return NextResponse.json({ 
      success: true, 
      messageId: emailData?.id,
      recipients: allRecipients 
    });

  } catch (error) {
    console.error('❌ Email sending error:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
} 
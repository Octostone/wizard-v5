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
    // Initialize Resend client inside the function
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const data: EmailData = await request.json();
    
    // Combine account manager email with additional recipients
    const allRecipients = [
      data.accountManagerEmail,
      ...data.additionalRecipients
    ].filter(Boolean); // Remove empty strings
    
    if (allRecipients.length === 0) {
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

    const { data: emailData, error } = await resend.emails.send({
      from: 'Flourish Wizard <onboarding@resend.dev>',
      to: allRecipients,
      subject: processedSubject,
      html: processedBody,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      messageId: emailData?.id,
      recipients: allRecipients 
    });

  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
} 
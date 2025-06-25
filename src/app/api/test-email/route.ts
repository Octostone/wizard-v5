import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Initialize Resend client inside the function
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const { testEmail } = await request.json();
    
    if (!testEmail) {
      return NextResponse.json(
        { error: 'Test email address is required' },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: 'Flourish Wizard <noreply@yourdomain.com>', // You'll update this
      to: [testEmail],
      subject: 'Test Email - Flourish Wizard System',
      html: `
        <h2>Test Email from Flourish Wizard</h2>
        <p>This is a test email to verify that the email notification system is working correctly.</p>
        <p><strong>Test Details:</strong></p>
        <ul>
          <li>Account Manager: {accountManagerName}</li>
          <li>Client Name: {clientName}</li>
          <li>File Name: {fileName}</li>
          <li>Google Sheet: {googleSheetUrl}</li>
          <li>Google Folder: {googleFolderUrl}</li>
        </ul>
        <p>If you receive this email, the email system is working properly!</p>
      `,
    });

    if (error) {
      console.error('Resend test error:', error);
      return NextResponse.json(
        { error: 'Failed to send test email', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      messageId: data?.id,
      message: 'Test email sent successfully'
    });

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
} 
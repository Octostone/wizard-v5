import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { oldPassword, newPassword, recipients } = await request.json();

    if (!recipients || recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients specified' }, { status: 400 });
    }

    const emailSubject = 'Admin Password Changed - Flourish Wizard System';
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d32f2f;">⚠️ Admin Password Changed</h2>
        
        <p>The admin password for the Flourish Wizard System has been changed.</p>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #856404;">Password Details:</h3>
          <p><strong>Old Password:</strong> ${oldPassword}</p>
          <p><strong>New Password:</strong> ${newPassword}</p>
        </div>
        
        <p><strong>Important:</strong> Please update your records with the new password.</p>
        
        <p style="color: #666; font-size: 0.9rem; margin-top: 30px;">
          This is an automated notification from the Flourish Wizard System.
        </p>
      </div>
    `;

    // Send email to all recipients
    const emailPromises = recipients.map((recipient: string) =>
      resend.emails.send({
        from: 'onboarding@resend.dev',
        to: recipient,
        subject: emailSubject,
        html: emailBody,
      })
    );

    await Promise.all(emailPromises);

    return NextResponse.json({ 
      success: true, 
      message: `Password change notification sent to ${recipients.length} recipient(s)` 
    });

  } catch (error) {
    console.error('Error sending password change notification:', error);
    return NextResponse.json(
      { error: 'Failed to send password change notification' }, 
      { status: 500 }
    );
  }
} 
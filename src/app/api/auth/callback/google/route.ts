import { NextResponse } from 'next/server';
import { getTokens } from '@/utils/googleAuth';

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.redirect('https://wizard-v5.vercel.app/?error=No%20code%20provided');
    }

    // For now, let's display the authorization code so we can capture it
    // This is temporary for debugging the OAuth flow
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>OAuth Authorization Code</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .code { background: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all; }
          .instructions { margin: 20px 0; }
        </style>
      </head>
      <body>
        <h1>OAuth Authorization Code Received</h1>
        <div class="instructions">
          <p>Copy this authorization code and use it in the refresh token generation script:</p>
        </div>
        <div class="code">${code}</div>
        <div class="instructions">
          <p><strong>Next steps:</strong></p>
          <ol>
            <li>Copy the authorization code above</li>
            <li>Run the refresh token generation script</li>
            <li>Paste this code when prompted</li>
            <li>Add the new refresh token to your environment variables</li>
          </ol>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error('Error in Google callback:', error);
    return NextResponse.redirect('https://wizard-v5.vercel.app/?error=Authentication%20failed');
  }
} 
import { NextResponse } from 'next/server';
import { getTokens } from '@/utils/googleAuth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.redirect('/?error=No code provided');
    }

    const tokens = await getTokens(code);
    
    // Store the tokens in a secure way (you might want to use a database)
    // For now, we'll store them in the session
    const response = NextResponse.redirect('/');
    response.cookies.set('google_access_token', tokens.access_token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600 // 1 hour
    });

    if (tokens.refresh_token) {
      response.cookies.set('google_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 // 30 days
      });
    }

    return response;
  } catch (error) {
    console.error('Error in Google callback:', error);
    return NextResponse.redirect('/?error=Authentication failed');
  }
} 
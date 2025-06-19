const { OAuth2Client } = require('google-auth-library');
const readline = require('readline');
require('dotenv').config({ path: '.env.local' });

// Configuration - Use environment variables
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'https://wizard-v5.vercel.app/api/auth/callback/google';

// Validate that credentials are available
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Error: Missing Google OAuth credentials');
  console.log('Please make sure you have the following in your .env.local file:');
  console.log('GOOGLE_CLIENT_ID=your_actual_client_id');
  console.log('GOOGLE_CLIENT_SECRET=your_actual_client_secret');
  process.exit(1);
}

console.log('✅ Using credentials from environment variables');
console.log('Client ID:', CLIENT_ID.substring(0, 20) + '...');
console.log('Client Secret:', CLIENT_SECRET.substring(0, 10) + '...');
console.log('Redirect URI:', REDIRECT_URI);
console.log('');

const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function generateRefreshToken() {
  try {
    // Generate the authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/spreadsheets'
      ],
      prompt: 'consent' // This ensures we get a refresh token
    });

    console.log('🔗 Authorization URL:');
    console.log(authUrl);
    console.log('\n📋 Please:');
    console.log('1. Copy and paste this URL into your browser');
    console.log('2. Sign in with your Google account (the one that owns the template sheet)');
    console.log('3. Grant the requested permissions');
    console.log('4. You will be redirected to a page showing the authorization code');
    console.log('5. Copy that authorization code and paste it below\n');

    rl.question('Enter the authorization code: ', async (code) => {
      try {
        // Exchange the authorization code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        
        console.log('\n✅ Success! Here are your tokens:');
        console.log('\n🔄 Refresh Token (add this to your environment variables):');
        console.log(tokens.refresh_token);
        console.log('\n🔑 Access Token (temporary):');
        console.log(tokens.access_token);
        console.log('\n📝 Add this to your .env.local file:');
        console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
        console.log('\n📝 Add this to your Vercel environment variables:');
        console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
        
        rl.close();
      } catch (error) {
        console.error('❌ Error exchanging code for tokens:', error.message);
        rl.close();
      }
    });
  } catch (error) {
    console.error('❌ Error generating auth URL:', error.message);
    rl.close();
  }
}

generateRefreshToken(); 
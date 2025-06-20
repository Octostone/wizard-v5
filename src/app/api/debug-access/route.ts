import { google } from 'googleapis';
import { NextResponse } from 'next/server';

// Helper function to properly format the private key
function formatPrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  
  return key
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\/g, '')
    .trim();
}

export async function GET() {
  const diagnostics: any = {
    environment: {},
    authentication: {},
    apiAccess: {},
    fileAccess: {},
    recommendations: []
  };

  try {
    // 1. Environment Variables Check
    diagnostics.environment = {
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'SET' : 'NOT SET',
      privateKeySet: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ? 'SET' : 'NOT SET',
      templateSheetId: process.env.GOOGLE_TEMPLATE_SHEET_ID ? 'SET' : 'NOT SET',
      privateKeyLength: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.length || 0
    };

    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
      diagnostics.recommendations.push('Environment variables are missing');
      return NextResponse.json(diagnostics);
    }

    // 2. Test different scopes
    const scopeTests = [
      {
        name: 'drive.file (current)',
        scopes: ['https://www.googleapis.com/auth/drive.file']
      },
      {
        name: 'drive (full access)',
        scopes: ['https://www.googleapis.com/auth/drive']
      },
      {
        name: 'drive.readonly',
        scopes: ['https://www.googleapis.com/auth/drive.readonly']
      },
      {
        name: 'spreadsheets',
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      },
      {
        name: 'combined (current)',
        scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/spreadsheets']
      }
    ];

    diagnostics.authentication = {};
    diagnostics.fileAccess = {};

    for (const test of scopeTests) {
      try {
        console.log(`Testing scopes: ${test.name}`);
        
        const auth = new google.auth.JWT({
          email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          key: formatPrivateKey(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY),
          scopes: test.scopes
        });

        await auth.authorize();
        
        const drive = google.drive({ version: 'v3', auth });
        
        // Test file listing
        const filesResponse = await drive.files.list({
          pageSize: 5,
          fields: 'files(id,name,mimeType)'
        });

        const files = filesResponse.data.files || [];
        
        diagnostics.fileAccess[test.name] = {
          success: true,
          fileCount: files.length,
          files: files.map(f => ({ id: f.id, name: f.name, type: f.mimeType }))
        };

        // Test specific template file access
        if (process.env.GOOGLE_TEMPLATE_SHEET_ID) {
          try {
            const fileInfo = await drive.files.get({
              fileId: process.env.GOOGLE_TEMPLATE_SHEET_ID,
              fields: 'id,name,permissions'
            });
            diagnostics.fileAccess[test.name].templateAccessible = true;
            diagnostics.fileAccess[test.name].templateName = fileInfo.data.name;
          } catch (error: any) {
            diagnostics.fileAccess[test.name].templateAccessible = false;
            diagnostics.fileAccess[test.name].templateError = error.message;
          }
        }

      } catch (error: any) {
        diagnostics.fileAccess[test.name] = {
          success: false,
          error: error.message
        };
      }
    }

    // 3. Test API enablement by trying to access user info
    try {
      const auth = new google.auth.JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: formatPrivateKey(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY),
        scopes: ['https://www.googleapis.com/auth/drive.file']
      });

      await auth.authorize();
      
      // Try to get service account info
      const oauth2 = google.oauth2({ version: 'v2', auth });
      const userInfo = await oauth2.userinfo.get();
      
      diagnostics.apiAccess.userInfo = {
        success: true,
        email: userInfo.data.email,
        id: userInfo.data.id
      };
    } catch (error: any) {
      diagnostics.apiAccess.userInfo = {
        success: false,
        error: error.message
      };
    }

    // 4. Test shared drive access specifically
    try {
      const auth = new google.auth.JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: formatPrivateKey(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY),
        scopes: ['https://www.googleapis.com/auth/drive']
      });

      await auth.authorize();
      const drive = google.drive({ version: 'v3', auth });
      
      const drivesResponse = await drive.drives.list({
        pageSize: 10
      });
      
      diagnostics.apiAccess.sharedDrives = {
        success: true,
        count: drivesResponse.data.drives?.length || 0,
        drives: drivesResponse.data.drives?.map(d => ({ id: d.id, name: d.name })) || []
      };
    } catch (error: any) {
      diagnostics.apiAccess.sharedDrives = {
        success: false,
        error: error.message
      };
    }

    // 5. Generate recommendations
    const hasAnyAccess = Object.values(diagnostics.fileAccess).some((test: any) => test.success && test.fileCount > 0);
    
    if (!hasAnyAccess) {
      diagnostics.recommendations.push('Service account has no file access - check shared drive permissions');
      diagnostics.recommendations.push('Verify the service account is added to the shared drive as a member');
      diagnostics.recommendations.push('Check if the template file is actually in a shared drive');
    }

    const bestScope = Object.entries(diagnostics.fileAccess).find(([name, test]: [string, any]) => 
      test.success && test.fileCount > 0
    );

    if (bestScope) {
      diagnostics.recommendations.push(`Best working scope: ${bestScope[0]}`);
    }

    if (!diagnostics.apiAccess.sharedDrives?.success) {
      diagnostics.recommendations.push('Cannot access shared drives - check API enablement');
    }

    return NextResponse.json(diagnostics);

  } catch (error: any) {
    diagnostics.error = error.message;
    return NextResponse.json(diagnostics, { status: 500 });
  }
} 
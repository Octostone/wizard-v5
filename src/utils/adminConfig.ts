// Type definitions
export interface AccountManager {
  name: string;
  email: string;
}

export interface EmailTemplate {
  subject: string;
  body: string;
}

export interface AdminData {
  accountManagers: AccountManager[];
  geoOptions: string[];
  osOptions: string[];
  category1Options: string[];
  category2Options: string[];
  category3Options: string[];
  eventTypeOptions: string[];
  pubRevSourceOptions: string[];
  emailTemplates: EmailTemplate;
  emailSettings: {
    defaultRecipients: string[];
    enableNotifications: boolean;
    notificationDelay: number;
  };
  passwordChangeSettings: {
    notificationRecipients: string[];
  };
  adminPassword: string;
}

export const defaultAdminData: AdminData = {
  accountManagers: [
    { name: 'James', email: '' },
    { name: 'Jason', email: '' },
    { name: 'Marina', email: '' },
    { name: 'Zhaowen', email: '' }
  ],
  geoOptions: ['US', 'CA', 'UK', 'AU'],
  osOptions: ['iOS', 'Android'],
  category1Options: ['Cat', 'Dog', 'Bird'],
  category2Options: ['Cat', 'Dog', 'Bird'],
  category3Options: ['Cat', 'Dog', 'Bird'],
  eventTypeOptions: ['GOAL', 'ADD', 'INITIAL', 'PURCHASE'],
  pubRevSourceOptions: ['IN EVENT NAME', 'IN POST BACK'],
  emailTemplates: {
    subject: 'New Campaign Created: {clientName} - {fileName}',
    body: `
      <h2>New Campaign Created</h2>
      <p>Hello {accountManagerName},</p>
      <p>A new campaign has been created for <strong>{clientName}</strong>.</p>
      <h3>Campaign Details:</h3>
      <ul>
        <li><strong>File Name:</strong> {fileName}</li>
        <li><strong>Google Sheet:</strong> <a href="{googleSheetUrl}">View Sheet</a></li>
        <li><strong>Google Folder:</strong> <a href="{googleFolderUrl}">View Folder</a></li>
      </ul>
      <h3>Form Summary:</h3>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
        {formSummary}
      </div>
      <p>Please review the campaign details and take any necessary actions.</p>
      <p>Best regards,<br>Flourish Wizard System</p>
    `
  },
  emailSettings: {
    defaultRecipients: [],
    enableNotifications: true,
    notificationDelay: 0
  },
  passwordChangeSettings: {
    notificationRecipients: []
  },
  adminPassword: 'admin123'
};

let inMemoryData: AdminData | null = null;

import { put, list } from '@vercel/blob';

export const getAdminData = async (): Promise<AdminData> => {
  try {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { blobs } = await list();
        const adminBlob = blobs.find(blob => blob.pathname === 'admin-data.json');
        if (adminBlob) {
          const cacheBustUrl = `${adminBlob.url}?t=${Date.now()}`;
          const response = await fetch(cacheBustUrl, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          if (response.ok) {
            const text = await response.text();
            const parsedData = JSON.parse(text);
            return parsedData;
          }
        }
      } catch (error) {
        // fallback below
      }
      await put('admin-data.json', JSON.stringify(defaultAdminData), {
        access: 'public',
        allowOverwrite: true,
      });
      return defaultAdminData;
    } else {
      if (inMemoryData) {
        return inMemoryData;
      }
      inMemoryData = defaultAdminData;
      return defaultAdminData;
    }
  } catch (error) {
    return defaultAdminData;
  }
};

export const updateAdminData = async (data: AdminData): Promise<boolean> => {
  try {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      await put('admin-data.json', JSON.stringify(data), {
        access: 'public',
        allowOverwrite: true,
      });
    } else {
      inMemoryData = data;
    }
    return true;
  } catch (error) {
    return false;
  }
}; 
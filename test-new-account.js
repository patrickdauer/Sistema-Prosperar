import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

async function testNewAccount() {
  try {
    // Test the new service account
    const serviceAccountPath = path.join(process.cwd(), 'tanamao-464721-fabfbca1450e.json');
    
    if (!fs.existsSync(serviceAccountPath)) {
      console.error('Service account file not found:', serviceAccountPath);
      return;
    }

    const auth = new google.auth.GoogleAuth({
      keyFile: serviceAccountPath,
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });

    const drive = google.drive({ version: 'v3', auth });
    
    console.log('Testing new service account...');
    
    // Test creating a simple file
    const fileMetadata = {
      name: 'test-new-account.txt',
    };

    const media = {
      mimeType: 'text/plain',
      body: 'Test file from new service account',
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
      supportsAllDrives: true,
      enforceUserOwnership: false,
    });

    console.log('✓ SUCCESS! New service account can upload files');
    console.log('File ID:', response.data.id);
    console.log('Email:', 'sistema-interno-contabilid-169@tanamao-464721.iam.gserviceaccount.com');
    
    // Test uploading to specific folder
    const SHARED_FOLDER_ID = '1bGzY-dEAevVafaAwF_hjLj0g--_A9o_e';
    
    const folderFileMetadata = {
      name: 'test-folder-upload.txt',
      parents: [SHARED_FOLDER_ID]
    };

    const folderResponse = await drive.files.create({
      resource: folderFileMetadata,
      media: media,
      fields: 'id,parents',
      supportsAllDrives: true,
      enforceUserOwnership: false,
    });

    console.log('✓ SUCCESS! Can upload to shared folder');
    console.log('Folder File ID:', folderResponse.data.id);
    console.log('Parents:', folderResponse.data.parents);
    
  } catch (error) {
    console.error('✗ ERROR with new service account:', error.message);
    if (error.response) {
      console.error('Error details:', error.response.data);
    }
  }
}

testNewAccount();
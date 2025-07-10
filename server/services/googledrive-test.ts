import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

// Test service for the new Google Drive account
export class GoogleDriveTestService {
  private drive: any;
  private auth: any;

  constructor() {
    this.initializeAuth();
  }

  private initializeAuth() {
    try {
      // Use the new service account
      const serviceAccountPath = path.join(process.cwd(), 'tanamao-464721-fabfbca1450e.json');
      
      if (!fs.existsSync(serviceAccountPath)) {
        console.error('Service account file not found:', serviceAccountPath);
        return;
      }

      this.auth = new google.auth.GoogleAuth({
        keyFile: serviceAccountPath,
        scopes: ['https://www.googleapis.com/auth/drive.file']
      });

      this.drive = google.drive({ version: 'v3', auth: this.auth });
      console.log('Google Drive Test Service initialized with new account');
    } catch (error) {
      console.error('Error initializing Google Drive Test Service:', error);
    }
  }

  async testUpload(fileName: string, buffer: Buffer, mimeType: string, folderId?: string): Promise<any> {
    try {
      const fileMetadata: any = {
        name: fileName,
      };

      if (folderId) {
        fileMetadata.parents = [folderId];
      }

      const media = {
        mimeType: mimeType,
        body: buffer,
      };

      console.log(`Testing upload with new service account: ${fileName}`);
      
      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id,parents',
        supportsAllDrives: true,
        enforceUserOwnership: false,
      });

      console.log(`✓ Upload successful with new account: ${fileName} (ID: ${response.data.id})`);
      return response.data;
    } catch (error) {
      console.error(`✗ Upload failed with new account: ${fileName}`, error);
      throw error;
    }
  }

  async testCreateFolder(folderName: string, parentId?: string): Promise<string> {
    try {
      const fileMetadata: any = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      };

      if (parentId) {
        fileMetadata.parents = [parentId];
      }

      const response = await this.drive.files.create({
        resource: fileMetadata,
        fields: 'id',
        supportsAllDrives: true,
        enforceUserOwnership: false,
      });

      console.log(`✓ Folder created with new account: ${folderName} (ID: ${response.data.id})`);
      return response.data.id;
    } catch (error) {
      console.error(`✗ Folder creation failed with new account: ${folderName}`, error);
      throw error;
    }
  }
}

export const googleDriveTestService = new GoogleDriveTestService();
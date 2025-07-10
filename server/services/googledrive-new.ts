import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

export class GoogleDriveNewService {
  private drive: any;
  private auth: any;

  constructor() {
    this.initializeAuth();
  }

  private initializeAuth() {
    try {
      const serviceAccountPath = path.join(process.cwd(), 'tanamao-464721-fabfbca1450e.json');
      
      console.log('Initializing Google Drive with new service account...');
      console.log('Service account path:', serviceAccountPath);
      
      if (!fs.existsSync(serviceAccountPath)) {
        console.error('Service account file not found:', serviceAccountPath);
        return;
      }

      this.auth = new google.auth.GoogleAuth({
        keyFile: serviceAccountPath,
        scopes: [
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/drive.file'
        ]
      });

      this.drive = google.drive({ version: 'v3', auth: this.auth });
      console.log('New Google Drive service initialized successfully');
      console.log('Service account email: sistema-interno-contabilid-169@tanamao-464721.iam.gserviceaccount.com');
    } catch (error) {
      console.error('Error initializing New Google Drive service:', error);
    }
  }

  async uploadFile(fileName: string, buffer: Buffer, mimeType: string, folderId?: string): Promise<any> {
    try {
      console.log(`Attempting upload with NEW service account: ${fileName}`);
      
      const fileMetadata: any = {
        name: fileName,
      };

      if (folderId) {
        fileMetadata.parents = [folderId];
        console.log(`Upload target folder: ${folderId}`);
      }

      const media = {
        mimeType: mimeType,
        body: buffer,
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id,parents',
        supportsAllDrives: true,
        enforceUserOwnership: false,
      });

      console.log(`✓ SUCCESS! File uploaded with NEW account: ${fileName}`);
      console.log(`File ID: ${response.data.id}`);
      console.log(`Parents: ${response.data.parents}`);
      
      return response.data;
    } catch (error) {
      console.error(`✗ Upload failed with NEW account: ${fileName}`);
      console.error('Error details:', error);
      throw error;
    }
  }

  async uploadPDF(fileName: string, buffer: Buffer, folderId?: string): Promise<any> {
    return this.uploadFile(fileName, buffer, 'application/pdf', folderId);
  }

  async createFolder(folderName: string, parentId?: string): Promise<string> {
    try {
      console.log(`Creating folder with NEW service account: ${folderName}`);
      
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

      console.log(`✓ Folder created with NEW account: ${folderName} (ID: ${response.data.id})`);
      return response.data.id;
    } catch (error) {
      console.error(`✗ Folder creation failed with NEW account: ${folderName}`);
      console.error('Error details:', error);
      throw error;
    }
  }
}

export const googleDriveNewService = new GoogleDriveNewService();
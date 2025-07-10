import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';

export class GoogleDriveSharedService {
  private drive: any;
  private auth: any;
  private SHARED_DRIVE_ID = '0APe1WRUeIBtMUk9PVA';

  constructor() {
    this.initializeAuth();
  }

  private initializeAuth() {
    try {
      const serviceAccountPath = path.join(process.cwd(), 'tanamao-464721-fabfbca1450e.json');
      
      console.log('Initializing Google Drive Shared Service...');
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
      console.log('Google Drive Shared Service initialized successfully');
      console.log('Service account email: sistema-interno-contabilid-169@tanamao-464721.iam.gserviceaccount.com');
      console.log('Shared Drive ID:', this.SHARED_DRIVE_ID);
    } catch (error) {
      console.error('Error initializing Google Drive Shared Service:', error);
    }
  }

  async uploadFile(fileName: string, buffer: Buffer, mimeType: string, useSharedFolder: boolean = false): Promise<any> {
    try {
      console.log(`Starting upload with SHARED service: ${fileName}`);
      
      const fileMetadata: any = {
        name: fileName,
      };

      if (useSharedFolder) {
        // Upload to the original shared folder
        fileMetadata.parents = ['1bGzY-dEAevVafaAwF_hjLj0g--_A9o_e'];
        console.log(`Target: Original shared folder (1bGzY-dEAevVafaAwF_hjLj0g--_A9o_e)`);
      } else {
        // Upload to Shared Drive root
        fileMetadata.parents = [this.SHARED_DRIVE_ID];
        console.log(`Target: Shared Drive root (${this.SHARED_DRIVE_ID})`);
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

      console.log(`✅ SUCCESS! File uploaded: ${fileName}`);
      console.log(`File ID: ${response.data.id}`);
      console.log(`Parents: ${response.data.parents}`);
      
      return response.data;
    } catch (error) {
      console.error(`❌ Upload failed: ${fileName}`);
      console.error('Error details:', error);
      throw error;
    }
  }

  async uploadPDF(fileName: string, buffer: Buffer, useSharedFolder: boolean = false): Promise<any> {
    return this.uploadFile(fileName, buffer, 'application/pdf', useSharedFolder);
  }

  async createFolderInSharedDrive(folderName: string): Promise<string> {
    try {
      console.log(`Creating folder in Shared Drive: ${folderName}`);
      
      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [this.SHARED_DRIVE_ID],
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        fields: 'id',
        supportsAllDrives: true,
        enforceUserOwnership: false,
      });

      console.log(`✅ Folder created in Shared Drive: ${folderName} (ID: ${response.data.id})`);
      return response.data.id;
    } catch (error) {
      console.error(`❌ Folder creation failed: ${folderName}`);
      console.error('Error details:', error);
      throw error;
    }
  }

  getSharedDriveId(): string {
    return this.SHARED_DRIVE_ID;
  }

  getSharedDriveLink(): string {
    return `https://drive.google.com/drive/folders/${this.SHARED_DRIVE_ID}`;
  }

  getSharedFolderLink(): string {
    return `https://drive.google.com/drive/folders/1bGzY-dEAevVafaAwF_hjLj0g--_A9o_e`;
  }
}

export const googleDriveSharedService = new GoogleDriveSharedService();
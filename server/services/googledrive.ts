import { google } from 'googleapis';
import { Readable } from 'stream';

export class GoogleDriveService {
  private drive: any;
  private auth: any;

  constructor() {
    // Initialize Google Auth with service account or OAuth
    this.auth = new google.auth.GoogleAuth({
      credentials: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY) : undefined,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
    
    this.drive = google.drive({ version: 'v3', auth: this.auth });
  }

  async createFolder(folderName: string, parentFolderId?: string): Promise<string> {
    try {
      const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentFolderId ? [parentFolderId] : undefined,
      };

      const response = await this.drive.files.create({
        resource: folderMetadata,
        fields: 'id',
      });

      return response.data.id;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  async uploadFile(
    fileName: string,
    fileBuffer: Buffer,
    mimeType: string,
    folderId: string
  ): Promise<string> {
    try {
      const fileMetadata = {
        name: fileName,
        parents: [folderId],
      };

      const media = {
        mimeType: mimeType,
        body: Readable.from(fileBuffer),
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id',
      });

      return `https://drive.google.com/file/d/${response.data.id}/view`;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async uploadPDF(
    fileName: string,
    pdfBuffer: Buffer,
    folderId: string
  ): Promise<string> {
    return this.uploadFile(fileName, pdfBuffer, 'application/pdf', folderId);
  }
}

export const googleDriveService = new GoogleDriveService();
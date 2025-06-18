import { google } from 'googleapis';
import { Readable } from 'stream';

export class GoogleDriveService {
  private drive: any;
  private auth: any;

  constructor() {
    console.log('Initializing Google Drive service...');
    
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      console.error('GOOGLE_SERVICE_ACCOUNT_KEY not found in environment variables');
      throw new Error('Google Service Account Key not configured');
    }
    
    try {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      console.log('Service account email:', credentials.client_email);
      
      this.auth = new google.auth.GoogleAuth({
        credentials: credentials,
        scopes: [
          'https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/drive'
        ],
      });
      
      this.drive = google.drive({ version: 'v3', auth: this.auth });
      console.log('Google Drive service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google Drive service:', error);
      throw new Error('Invalid Google Service Account Key format');
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing Google Drive connection...');
      await this.drive.files.list({
        pageSize: 1,
        fields: 'files(id, name)',
      });
      console.log('Google Drive connection test successful');
      return true;
    } catch (error: any) {
      console.error('Google Drive connection test failed:', error.message);
      return false;
    }
  }

  async createFolder(folderName: string, parentFolderId?: string): Promise<string> {
    try {
      console.log(`Creating folder "${folderName}"`);
      
      const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        // Criar na raiz da conta de serviço - sem parent
      };

      console.log('Creating folder in service account root directory');
      const response = await this.drive.files.create({
        resource: folderMetadata,
        fields: 'id, webViewLink, parents',
      });

      const folderId = response.data.id;
      const folderUrl = response.data.webViewLink;
      
      console.log(`✓ Folder created successfully with ID: ${folderId}`);
      console.log(`✓ Folder URL: ${folderUrl}`);
      
      // Compartilhar a pasta publicamente para facilitar o acesso
      try {
        await this.drive.permissions.create({
          fileId: folderId,
          resource: {
            role: 'reader',
            type: 'anyone'
          }
        });
        console.log('✓ Folder shared publicly for viewing');
      } catch (shareError) {
        console.log('Note: Could not share folder publicly, but folder was created successfully');
      }
      
      return folderId;
    } catch (error: any) {
      console.error('Error creating folder:', error);
      console.error('Error details:', error.response?.data || error.message);
      throw new Error(`Failed to create folder: ${error.message}`);
    }
  }

  async uploadFile(
    fileName: string,
    fileBuffer: Buffer,
    mimeType: string,
    folderId: string
  ): Promise<string> {
    try {
      console.log(`Uploading file "${fileName}" to folder: ${folderId}`);
      console.log(`File size: ${fileBuffer.length} bytes, MIME type: ${mimeType}`);
      
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

      const fileUrl = `https://drive.google.com/file/d/${response.data.id}/view`;
      console.log(`File uploaded successfully: ${fileUrl}`);
      return fileUrl;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      console.error('Error details:', error.response?.data || error.message);
      throw new Error(`Failed to upload file: ${error.message}`);
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
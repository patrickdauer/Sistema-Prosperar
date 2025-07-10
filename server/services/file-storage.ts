import fs from 'fs';
import path from 'path';
import { googleDriveNewService } from './googledrive-new';
import { googleDriveService } from './googledrive';

export class FileStorageService {
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadsDir();
  }

  private ensureUploadsDir() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
      console.log('Created uploads directory:', this.uploadsDir);
    }
  }

  async saveFile(fileName: string, buffer: Buffer): Promise<string> {
    const filePath = path.join(this.uploadsDir, fileName);
    
    try {
      fs.writeFileSync(filePath, buffer);
      console.log(`✓ File saved locally: ${fileName}`);
      return filePath;
    } catch (error) {
      console.error(`Error saving file locally: ${fileName}`, error);
      throw error;
    }
  }

  async uploadToGoogleDrive(fileName: string, buffer: Buffer, mimeType: string, folderId?: string): Promise<{ success: boolean; error?: string }> {
    // Try multiple strategies to upload
    const strategies = [
      { name: 'NEW_SERVICE_ACCOUNT', service: googleDriveNewService },
      { name: 'OLD_SERVICE_ACCOUNT', service: googleDriveService },
    ];

    for (const strategy of strategies) {
      try {
        console.log(`Trying upload with ${strategy.name}...`);
        const result = await strategy.service.uploadFile(fileName, buffer, mimeType, folderId);
        console.log(`✓ Success with ${strategy.name}: ${fileName}`);
        return { success: true };
      } catch (error) {
        console.log(`✗ Failed with ${strategy.name}: ${fileName}`, error.message);
        continue;
      }
    }

    // If all strategies fail, save locally
    try {
      await this.saveFile(fileName, buffer);
      return { 
        success: false, 
        error: 'Google Drive upload failed - file saved locally' 
      };
    } catch (saveError) {
      return { 
        success: false, 
        error: `Both Google Drive and local save failed: ${saveError.message}` 
      };
    }
  }

  async uploadPDFToGoogleDrive(fileName: string, buffer: Buffer, folderId?: string): Promise<{ success: boolean; error?: string }> {
    return this.uploadToGoogleDrive(fileName, buffer, 'application/pdf', folderId);
  }

  getLocalFileUrl(fileName: string): string {
    return `/uploads/${fileName}`;
  }

  listLocalFiles(): string[] {
    try {
      return fs.readdirSync(this.uploadsDir);
    } catch (error) {
      console.error('Error listing local files:', error);
      return [];
    }
  }
}

export const fileStorageService = new FileStorageService();
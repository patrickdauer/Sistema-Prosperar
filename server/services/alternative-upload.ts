import fs from 'fs';
import path from 'path';
import { googleDriveService } from './googledrive.js';

export class AlternativeUploadService {
  private uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    // Criar diretório de uploads se não existir
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveAndUploadFiles(
    files: Express.Multer.File[],
    folderId: string,
    prefix: string = ''
  ): Promise<{ uploaded: number; failed: number; details: string[] }> {
    const results = {
      uploaded: 0,
      failed: 0,
      details: []
    };

    for (const file of files) {
      try {
        const fileName = `${prefix}_${file.originalname}`;
        
        // Salvar arquivo localmente primeiro
        const localFilePath = path.join(this.uploadDir, fileName);
        fs.writeFileSync(localFilePath, file.buffer);
        
        console.log(`File saved locally: ${localFilePath}`);
        
        // Tentar upload para Google Drive
        try {
          await this.uploadWithRetry(fileName, file.buffer, file.mimetype, folderId);
          results.uploaded++;
          results.details.push(`✓ Uploaded: ${fileName}`);
          
          // Remover arquivo local após upload bem-sucedido
          fs.unlinkSync(localFilePath);
        } catch (uploadError) {
          results.failed++;
          results.details.push(`⚠️ Upload failed: ${fileName} (saved locally)`);
          console.error(`Upload failed for ${fileName}:`, uploadError);
        }
        
      } catch (error) {
        results.failed++;
        results.details.push(`❌ Error processing: ${file.originalname}`);
        console.error(`Error processing file ${file.originalname}:`, error);
      }
    }

    return results;
  }

  private async uploadWithRetry(
    fileName: string,
    fileBuffer: Buffer,
    mimeType: string,
    folderId: string,
    maxRetries: number = 3
  ): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Upload attempt ${attempt}/${maxRetries} for ${fileName}`);
        
        const result = await googleDriveService.uploadFile(fileName, fileBuffer, mimeType, folderId);
        
        if (!result.includes('quota/permission issue')) {
          console.log(`✓ Upload successful on attempt ${attempt}: ${fileName}`);
          return;
        }
        
        if (attempt === maxRetries) {
          throw new Error('Max retries reached, upload failed');
        }
        
        // Aguardar antes da próxima tentativa
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        console.log(`Attempt ${attempt} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  async uploadPDFWithRetry(
    pdfFileName: string,
    pdfBuffer: Buffer,
    folderId: string
  ): Promise<string> {
    try {
      // Salvar PDF localmente primeiro
      const localPDFPath = path.join(this.uploadDir, pdfFileName);
      fs.writeFileSync(localPDFPath, pdfBuffer);
      console.log(`PDF saved locally: ${localPDFPath}`);

      // Tentar upload para Google Drive
      const result = await this.uploadWithRetry(pdfFileName, pdfBuffer, 'application/pdf', folderId);
      
      // Remover arquivo local após upload bem-sucedido
      fs.unlinkSync(localPDFPath);
      
      return "PDF uploaded successfully";
    } catch (error) {
      console.error('PDF upload failed:', error);
      return "PDF saved locally, upload failed";
    }
  }

  getLocalFiles(): string[] {
    try {
      return fs.readdirSync(this.uploadDir);
    } catch (error) {
      return [];
    }
  }

  cleanupOldFiles(maxAgeHours: number = 24): void {
    try {
      const files = fs.readdirSync(this.uploadDir);
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(this.uploadDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          console.log(`Cleaned up old file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old files:', error);
    }
  }
}

export const alternativeUploadService = new AlternativeUploadService();
// Serviço de armazenamento local como fallback para o Google Drive
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);

export class LocalStorageService {
  private baseUploadPath: string;

  constructor() {
    this.baseUploadPath = path.join(process.cwd(), 'uploads');
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await access(this.baseUploadPath);
    } catch {
      await mkdir(this.baseUploadPath, { recursive: true });
    }
  }

  async createEmployeeFolder(employeeName: string): Promise<string> {
    const sanitizedName = employeeName.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
    const folderName = `funcionario_${sanitizedName}_${Date.now()}`;
    const folderPath = path.join(this.baseUploadPath, folderName);
    
    try {
      await mkdir(folderPath, { recursive: true });
      console.log(`📁 Pasta local criada para funcionário: ${folderPath}`);
      return folderPath;
    } catch (error) {
      console.error('Erro ao criar pasta local:', error);
      throw new Error(`Falha ao criar pasta para ${employeeName}`);
    }
  }

  async saveFile(
    employeeFolderPath: string, 
    fileName: string, 
    fileBuffer: Buffer
  ): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const finalFileName = `${timestamp}_${sanitizedFileName}`;
      const filePath = path.join(employeeFolderPath, finalFileName);
      
      await writeFile(filePath, fileBuffer);
      console.log(`💾 Arquivo salvo localmente: ${filePath}`);
      
      return filePath;
    } catch (error) {
      console.error('Erro ao salvar arquivo local:', error);
      throw new Error(`Falha ao salvar arquivo ${fileName}`);
    }
  }

  async saveEmployeeDocuments(
    employeeName: string,
    files: { name: string; buffer: Buffer }[]
  ): Promise<{ folderPath: string; savedFiles: string[] }> {
    try {
      const folderPath = await this.createEmployeeFolder(employeeName);
      const savedFiles: string[] = [];

      for (const file of files) {
        const savedFilePath = await this.saveFile(folderPath, file.name, file.buffer);
        savedFiles.push(savedFilePath);
      }

      // Criar arquivo de metadados
      const metadata = {
        employeeName,
        createdAt: new Date().toISOString(),
        files: savedFiles.map(filePath => ({
          originalName: path.basename(filePath),
          savedPath: filePath,
          size: files.find(f => filePath.includes(f.name.replace(/[^a-zA-Z0-9.-]/g, '_')))?.buffer.length || 0
        }))
      };

      const metadataPath = path.join(folderPath, 'metadata.json');
      await writeFile(metadataPath, JSON.stringify(metadata, null, 2));

      console.log(`✅ Documentos do funcionário ${employeeName} salvos localmente`);
      console.log(`📂 Pasta: ${folderPath}`);
      console.log(`📄 Arquivos: ${savedFiles.length}`);

      return {
        folderPath,
        savedFiles
      };
    } catch (error) {
      console.error('Erro ao salvar documentos do funcionário:', error);
      throw error;
    }
  }

  async savePDF(
    employeeName: string,
    pdfFileName: string,
    pdfBuffer: Buffer
  ): Promise<{ filePath: string }> {
    try {
      const sanitizedName = employeeName.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
      const folderName = `funcionario_${sanitizedName}_pdfs`;
      const folderPath = path.join(this.baseUploadPath, folderName);
      
      // Criar pasta se não existir
      try {
        await access(folderPath);
      } catch {
        await mkdir(folderPath, { recursive: true });
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const sanitizedFileName = pdfFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const finalFileName = `${timestamp}_${sanitizedFileName}`;
      const filePath = path.join(folderPath, finalFileName);
      
      await writeFile(filePath, pdfBuffer);
      console.log(`📄 PDF salvo localmente: ${filePath}`);
      
      return { filePath };
    } catch (error) {
      console.error('Erro ao salvar PDF local:', error);
      throw new Error(`Falha ao salvar PDF ${pdfFileName}`);
    }
  }

  getUploadPath(): string {
    return this.baseUploadPath;
  }
}

export const localStorageService = new LocalStorageService();
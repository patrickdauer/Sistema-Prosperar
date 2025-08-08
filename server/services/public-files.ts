import { ObjectStorageService } from "../objectStorage";
import { objectStorageClient } from "../objectStorage";

export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  lastModified?: string;
  downloadUrl?: string;
  previewUrl?: string;
  mimeType?: string;
}

export interface FolderContents {
  currentPath: string;
  parentPath?: string;
  files: FileItem[];
  folders: FileItem[];
  totalFiles: number;
  totalFolders: number;
}

export class PublicFilesService {
  private objectStorageService: ObjectStorageService;
  private bucketName = 'replit-objstore-a07a4d86-f9d1-4e27-91b5-bbc366dec51f';

  constructor() {
    this.objectStorageService = new ObjectStorageService();
  }

  async browseFolder(path: string = 'prosperar-publico'): Promise<FolderContents> {
    try {
      console.log(`📁 Browsing folder: ${path}`);
      
      const bucket = objectStorageClient.bucket(this.bucketName);
      const prefix = path.endsWith('/') ? path : path + '/';

      // Get folder structure with delimiter to separate folders from files
      const [files, , apiResponse] = await bucket.getFiles({
        prefix: prefix,
        delimiter: '/',
        includeTrailingDelimiter: true
      });

      const folders: FileItem[] = [];
      const fileItems: FileItem[] = [];

      // Process subfolders (prefixes)
      if (apiResponse?.prefixes) {
        for (const prefixPath of apiResponse.prefixes) {
          const folderName = prefixPath.replace(prefix, '').replace('/', '');
          if (folderName) {
            folders.push({
              name: folderName,
              path: prefixPath.slice(0, -1), // Remove trailing slash
              type: 'folder'
            });
          }
        }
      }

      // Process files (only files directly in this folder, not subfolders)
      for (const file of files) {
        const relativePath = file.name.replace(prefix, '');
        
        // Skip if this is actually a file in a subfolder
        if (relativePath && !relativePath.includes('/')) {
          try {
            const [metadata] = await file.getMetadata();
            
            // Generate public download link
            let downloadUrl;
            try {
              downloadUrl = await this.objectStorageService.generatePublicDownloadLink(`/${file.name}`, 168); // 7 days
            } catch (error) {
              console.error(`Error generating download link for ${file.name}:`, error);
            }

            fileItems.push({
              name: relativePath,
              path: file.name,
              type: 'file',
              size: parseInt(metadata.size || '0'),
              lastModified: metadata.timeCreated,
              mimeType: metadata.contentType,
              downloadUrl: downloadUrl,
              previewUrl: metadata.contentType?.startsWith('image/') ? downloadUrl : undefined
            });
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
          }
        }
      }

      // Determine parent path
      let parentPath;
      if (path !== 'prosperar-publico' && path !== '') {
        const pathParts = path.split('/').filter(Boolean);
        if (pathParts.length > 1) {
          parentPath = pathParts.slice(0, -1).join('/');
        } else {
          parentPath = 'prosperar-publico';
        }
      }

      const result: FolderContents = {
        currentPath: path,
        parentPath: parentPath,
        folders: folders.sort((a, b) => a.name.localeCompare(b.name)),
        files: fileItems.sort((a, b) => a.name.localeCompare(b.name)),
        totalFiles: fileItems.length,
        totalFolders: folders.length
      };

      console.log(`📁 Found ${folders.length} folders and ${fileItems.length} files in ${path}`);
      return result;

    } catch (error) {
      console.error(`Error browsing folder ${path}:`, error);
      throw new Error(`Erro ao listar conteúdo da pasta: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchFiles(query: string, rootPath: string = 'prosperar-publico'): Promise<FileItem[]> {
    try {
      console.log(`🔍 Searching for "${query}" in ${rootPath}`);
      
      const bucket = objectStorageClient.bucket(this.bucketName);
      const [files] = await bucket.getFiles({
        prefix: rootPath + '/'
      });

      const results: FileItem[] = [];

      for (const file of files) {
        const fileName = file.name.split('/').pop() || '';
        
        if (fileName.toLowerCase().includes(query.toLowerCase())) {
          try {
            const [metadata] = await file.getMetadata();
            
            let downloadUrl;
            try {
              downloadUrl = await this.objectStorageService.generatePublicDownloadLink(`/${file.name}`, 168);
            } catch (error) {
              console.error(`Error generating download link for ${file.name}:`, error);
            }

            results.push({
              name: fileName,
              path: file.name,
              type: 'file',
              size: parseInt(metadata.size || '0'),
              lastModified: metadata.timeCreated,
              mimeType: metadata.contentType,
              downloadUrl: downloadUrl,
              previewUrl: metadata.contentType?.startsWith('image/') ? downloadUrl : undefined
            });
          } catch (error) {
            console.error(`Error processing search result ${file.name}:`, error);
          }
        }
      }

      console.log(`🔍 Found ${results.length} files matching "${query}"`);
      return results.sort((a, b) => a.name.localeCompare(b.name));

    } catch (error) {
      console.error(`Error searching files:`, error);
      throw new Error(`Erro na busca: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const publicFilesService = new PublicFilesService();
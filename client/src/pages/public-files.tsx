import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Folder, 
  FileText, 
  Download, 
  Search, 
  ArrowLeft,
  File,
  Image as ImageIcon,
  FileSpreadsheet,
  Eye
} from 'lucide-react';

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  lastModified?: string;
  downloadUrl?: string;
  previewUrl?: string;
  mimeType?: string;
}

interface FolderContents {
  currentPath: string;
  parentPath?: string;
  files: FileItem[];
  folders: FileItem[];
}

export default function PublicFiles() {
  const [currentPath, setCurrentPath] = useState('prosperar-publico');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: folderContents, isLoading, error, refetch } = useQuery<FolderContents>({
    queryKey: ['/api/public-files', currentPath, searchTerm],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('path', currentPath);
      if (searchTerm) {
        params.set('search', searchTerm);
      }
      return fetch(`/api/public-files?${params.toString()}`).then(res => res.json());
    },
    enabled: true
  });

  const getFileIcon = (mimeType?: string, fileName?: string) => {
    if (!mimeType && !fileName) return <File className="h-5 w-5" />;
    
    const extension = fileName?.split('.').pop()?.toLowerCase();
    
    if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    }
    
    if (mimeType === 'application/pdf' || extension === 'pdf') {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    
    if (mimeType?.includes('spreadsheet') || ['xlsx', 'xls', 'csv'].includes(extension || '')) {
      return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    }
    
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '--';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredFiles = folderContents?.files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredFolders = folderContents?.folders.filter(folder =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const pathBreadcrumbs = currentPath.split('/').filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">📁 Arquivos Públicos</h1>
          <p className="text-gray-400">Interface pública para acessar documentos e arquivos</p>
        </div>

        {/* Navigation */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {/* Breadcrumb */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPath('prosperar-publico')}
                  className="text-blue-400 hover:text-blue-300"
                >
                  🏠 Início
                </Button>
                {pathBreadcrumbs.map((segment, index) => (
                  <div key={index} className="flex items-center">
                    <span className="text-gray-500 mx-2">/</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPath(
                        pathBreadcrumbs.slice(0, index + 1).join('/')
                      )}
                      className="text-gray-300 hover:text-white"
                    >
                      {segment}
                    </Button>
                  </div>
                ))}
              </div>

              {/* Back Button */}
              {folderContents?.parentPath && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPath(folderContents.parentPath!)}
                  className="border-gray-600"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar arquivos e pastas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Carregando arquivos...</p>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="bg-red-900/20 border-red-800">
            <CardContent className="p-6 text-center">
              <p className="text-red-400">Erro ao carregar arquivos: {error.message}</p>
            </CardContent>
          </Card>
        )}

        {/* Content */}
        {folderContents && !isLoading && (
          <div className="space-y-6">
            {/* Folders */}
            {filteredFolders.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Folder className="h-5 w-5 mr-2 text-yellow-500" />
                    Pastas ({filteredFolders.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredFolders.map((folder) => (
                      <Button
                        key={folder.path}
                        variant="ghost"
                        className="h-auto p-4 justify-start border border-gray-600 hover:border-yellow-500"
                        onClick={() => setCurrentPath(folder.path)}
                      >
                        <Folder className="h-6 w-6 mr-3 text-yellow-500" />
                        <span className="text-left">{folder.name}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Files */}
            {filteredFiles.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <FileText className="h-5 w-5 mr-2 text-blue-500" />
                    Arquivos ({filteredFiles.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredFiles.map((file) => (
                      <div
                        key={file.path}
                        className="flex items-center justify-between p-4 bg-gray-700 rounded-lg border border-gray-600"
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          {getFileIcon(file.mimeType, file.name)}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-white truncate">
                              {file.name}
                            </h3>
                            <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                              <span>{formatFileSize(file.size)}</span>
                              <span>{formatDate(file.lastModified)}</span>
                              {file.mimeType && (
                                <Badge variant="secondary" className="text-xs">
                                  {file.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {/* Preview Button */}
                          {file.previewUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(file.previewUrl, '_blank')}
                              className="border-gray-600"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}

                          {/* Download Button */}
                          {file.downloadUrl && (
                            <Button
                              size="sm"
                              onClick={() => window.open(file.downloadUrl, '_blank')}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {filteredFiles.length === 0 && filteredFolders.length === 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-8 text-center">
                  <Folder className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-300 mb-2">
                    {searchTerm ? 'Nenhum resultado encontrado' : 'Pasta vazia'}
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm 
                      ? `Não foram encontrados arquivos ou pastas para "${searchTerm}"`
                      : 'Esta pasta não contém arquivos ou subpastas.'
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
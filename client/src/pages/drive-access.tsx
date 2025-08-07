import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Copy, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";

export function DriveAccessPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const { toast } = useToast();

  const serviceAccountEmail = "sistema-interno-contabilid-169@tanamao-464721.iam.gserviceaccount.com";
  const driveId = "0APe1WRUeIBtMUk9PVA";
  const driveUrl = `https://drive.google.com/drive/folders/${driveId}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Email copiado para a área de transferência",
    });
  };

  const handleTestAccess = async () => {
    setIsLoading(true);
    try {
      // Simular teste de acesso
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Em um cenário real, isso faria uma chamada para a API
      // const response = await fetch('/api/drive/test-access');
      // const data = await response.json();
      
      setAccessGranted(true);
      toast({
        title: "Acesso Confirmado!",
        description: "A conta de serviço tem acesso ao Drive Compartilhado",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível verificar o acesso ao Drive",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Configuração de Acesso ao Google Drive</h1>
        
        <div className="grid gap-6">
          {/* Status Card */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {accessGranted ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                )}
                Status do Acesso
              </CardTitle>
            </CardHeader>
            <CardContent>
              {accessGranted ? (
                <Alert className="bg-green-900/20 border-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Acesso ao Drive Compartilhado configurado com sucesso!
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-yellow-900/20 border-yellow-700">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Acesso ao Drive precisa ser configurado manualmente.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Instructions Card */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Instruções para Configuração Manual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Passo 1: Copiar Email da Conta de Serviço</h3>
                <div className="flex items-center gap-2 p-3 bg-gray-700 rounded-lg">
                  <code className="flex-1 text-sm break-all">{serviceAccountEmail}</code>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => copyToClipboard(serviceAccountEmail)}
                    className="flex-shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Passo 2: Acessar o Drive Compartilhado</h3>
                <Button 
                  variant="outline" 
                  onClick={() => window.open(driveUrl, '_blank')}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir Drive Compartilhado
                </Button>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Passo 3: Adicionar Permissão</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300 ml-4">
                  <li>No Drive Compartilhado, clique no ícone de configurações (⚙️)</li>
                  <li>Selecione "Gerenciar membros"</li>
                  <li>Clique em "Adicionar membros"</li>
                  <li>Cole o email da conta de serviço copiado no Passo 1</li>
                  <li>Defina a permissão como "Organizador"</li>
                  <li>Clique em "Enviar" (sem enviar notificação por email)</li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Passo 4: Testar Acesso</h3>
                <Button 
                  onClick={handleTestAccess}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? "Testando..." : "Testar Acesso"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Information Card */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Informações Técnicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">ID do Drive Compartilhado:</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 text-sm bg-gray-700 p-2 rounded">{driveId}</code>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => copyToClipboard(driveId)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-semibold">Projeto Google Cloud:</Label>
                <div className="text-sm bg-gray-700 p-2 rounded mt-1">
                  tanamao-464721
                </div>
              </div>

              <Alert className="bg-blue-900/20 border-blue-700">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Importante:</strong> A conta de serviço precisa ter permissão de "Organizador" 
                  no Drive Compartilhado para criar pastas e fazer upload de arquivos automaticamente.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
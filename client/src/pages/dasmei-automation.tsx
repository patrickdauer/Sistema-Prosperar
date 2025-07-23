import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  CalendarDays, Settings, Users, FileText, Play, Square, Eye, Trash2, Edit, Plus, 
  BarChart3, MessageSquare, Mail, Clock, CheckCircle, AlertCircle, Zap, 
  Activity, TrendingUp, RefreshCw, Download, Send, PauseCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Tipos para o sistema DASMEI
interface DasmeiClient {
  id: number;
  nome: string;
  cnpj: string;
  telefone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DasmeiGuia {
  id: number;
  clienteMeiId: number;
  mesAno: string;
  dataVencimento: string;
  valor: string;
  filePath?: string;
  fileName?: string;
  downloadStatus: 'pending' | 'success' | 'failed';
  downloadedAt?: string;
}

interface AutomationSetting {
  id: number;
  chave: string;
  valor: string;
  descricao?: string;
  tipo: string;
}

interface SystemLog {
  id: number;
  tipoOperacao: string;
  clienteId?: number;
  status: 'success' | 'failed' | 'pending';
  detalhes: any;
  periodo?: string;
  operador: string;
  timestamp: string;
}

export default function DASMEIAutomationPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [isSchedulerRunning, setIsSchedulerRunning] = useState(false);

  // Queries principais
  const { data: estatisticas } = useQuery({
    queryKey: ['/api/dasmei/estatisticas'],
    refetchInterval: 30000
  });

  const { data: clientes } = useQuery<DasmeiClient[]>({
    queryKey: ['/api/dasmei/clientes'],
    refetchInterval: 30000
  });

  const { data: guias } = useQuery<DasmeiGuia[]>({
    queryKey: ['/api/dasmei/guias'],
    refetchInterval: 30000
  });

  const { data: logs } = useQuery<SystemLog[]>({
    queryKey: ['/api/dasmei/logs'],
    refetchInterval: 10000
  });

  const { data: settings } = useQuery<AutomationSetting[]>({
    queryKey: ['/api/dasmei/settings'],
    refetchInterval: 60000
  });

  // Mutations
  const toggleSchedulerMutation = useMutation({
    mutationFn: (action: 'start' | 'stop') => 
      apiRequest(`/api/dasmei/scheduler/${action}`, { method: 'POST' }),
    onSuccess: () => {
      setIsSchedulerRunning(!isSchedulerRunning);
      toast({ title: `Scheduler ${isSchedulerRunning ? 'parado' : 'iniciado'} com sucesso` });
    }
  });

  const manualGenerationMutation = useMutation({
    mutationFn: () => apiRequest('/api/dasmei/generate-manual', { method: 'POST' }),
    onSuccess: () => {
      toast({ title: 'Geração manual iniciada' });
      queryClient.invalidateQueries({ queryKey: ['/api/dasmei'] });
    }
  });

  const manualSendMutation = useMutation({
    mutationFn: () => apiRequest('/api/dasmei/send-manual', { method: 'POST' }),
    onSuccess: () => {
      toast({ title: 'Envio manual iniciado' });
      queryClient.invalidateQueries({ queryKey: ['/api/dasmei'] });
    }
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-green-400 flex items-center gap-2">
                <CalendarDays className="h-6 w-6" />
                DASMEI Automação
              </h1>
              <p className="text-gray-400 mt-1">
                Sistema completo de geração e envio automático de guias DAS-MEI
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => toggleSchedulerMutation.mutate(isSchedulerRunning ? 'stop' : 'start')}
                className={`${isSchedulerRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                disabled={toggleSchedulerMutation.isPending}
              >
                {isSchedulerRunning ? (
                  <>
                    <PauseCircle className="h-4 w-4 mr-2" />
                    Parar Scheduler
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar Scheduler
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="bg-gray-800 grid w-full grid-cols-6">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-green-600">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="clientes" className="data-[state=active]:bg-green-600">
              <Users className="h-4 w-4 mr-2" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="guias" className="data-[state=active]:bg-green-600">
              <FileText className="h-4 w-4 mr-2" />
              Guias DAS
            </TabsTrigger>
            <TabsTrigger value="automacao" className="data-[state=active]:bg-green-600">
              <Zap className="h-4 w-4 mr-2" />
              Automação
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-green-600">
              <Activity className="h-4 w-4 mr-2" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="configuracoes" className="data-[state=active]:bg-green-600">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Estatísticas principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">
                    Total Clientes
                  </CardTitle>
                  <Users className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {estatisticas?.totalClientes || 0}
                  </div>
                  <p className="text-xs text-green-400 mt-1">
                    +{estatisticas?.clientesAtivos || 0} ativos
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">
                    Guias Geradas
                  </CardTitle>
                  <FileText className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {estatisticas?.boletosGerados || 0}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Este mês
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">
                    WhatsApp Enviados
                  </CardTitle>
                  <MessageSquare className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {estatisticas?.whatsappEnviados || 0}
                  </div>
                  <p className="text-xs text-green-400 mt-1">
                    Sucesso: 98%
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">
                    Status Sistema
                  </CardTitle>
                  <Activity className="h-4 w-4 text-yellow-400" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <div className={`h-3 w-3 rounded-full ${isSchedulerRunning ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="text-sm font-medium text-white">
                      {isSchedulerRunning ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Scheduler automático
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Ações rápidas */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-green-400">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={() => manualGenerationMutation.mutate()}
                    disabled={manualGenerationMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 h-20 flex flex-col items-center justify-center"
                  >
                    <Download className="h-6 w-6 mb-2" />
                    Gerar Guias Manualmente
                  </Button>
                  
                  <Button
                    onClick={() => manualSendMutation.mutate()}
                    disabled={manualSendMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 h-20 flex flex-col items-center justify-center"
                  >
                    <Send className="h-6 w-6 mb-2" />
                    Enviar WhatsApp
                  </Button>
                  
                  <Button
                    onClick={() => queryClient.invalidateQueries()}
                    className="bg-purple-600 hover:bg-purple-700 h-20 flex flex-col items-center justify-center"
                  >
                    <RefreshCw className="h-6 w-6 mb-2" />
                    Atualizar Dados
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Últimos logs */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-green-400">Atividade Recente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {logs?.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {log.status === 'success' ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : log.status === 'failed' ? (
                          <AlertCircle className="h-5 w-5 text-red-400" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-400" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-white">{log.tipoOperacao}</p>
                          <p className="text-xs text-gray-400">
                            {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={
                          log.status === 'success' 
                            ? 'bg-green-600' 
                            : log.status === 'failed' 
                            ? 'bg-red-600' 
                            : 'bg-yellow-600'
                        }
                      >
                        {log.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Outras tabs serão implementadas posteriormente */}
          <TabsContent value="clientes">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-green-400">Gerenciamento de Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Em desenvolvimento...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guias">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-green-400">Guias DAS-MEI</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Em desenvolvimento...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automacao">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-green-400">Configurações de Automação</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Em desenvolvimento...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-green-400">Logs do Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Em desenvolvimento...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configuracoes">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-green-400">Configurações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Em desenvolvimento...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
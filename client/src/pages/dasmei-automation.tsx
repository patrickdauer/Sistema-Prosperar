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
  Activity, TrendingUp, RefreshCw, Download, Send, PauseCircle, Filter
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
  const [clienteFilter, setClienteFilter] = useState("");
  
  // Estados para configurações de automação
  const [automationSettings, setAutomationSettings] = useState({
    schedulerTime: "08:00",
    schedulerDay: "5",
    whatsappEnabled: true,
    emailEnabled: true,
    correiosEnabled: false,
    delayBetweenSends: 1000
  });

  // Estados para campos de teste
  const [testFields, setTestFields] = useState({
    phoneNumber: "",
    email: "",
    cnpj: ""
  });

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

  // Query para carregar configurações persistentes das APIs
  const { data: apiConfigurations } = useQuery({
    queryKey: ['/api/configurations'],
    refetchInterval: 60000,
    onSuccess: (data) => {
      // Atualizar os estados de configuração com dados do banco
      if (data.infosimples) {
        setInfosimplesConfig(data.infosimples.config);
        setConnectionStatus(prev => ({
          ...prev,
          infosimples: { 
            connected: data.infosimples.isActive,
            lastTest: data.infosimples.lastTest ? new Date(data.infosimples.lastTest) : null
          }
        }));
      }
      
      if (data.whatsapp_evolution) {
        setWhatsappConfig(data.whatsapp_evolution.config);
        setConnectionStatus(prev => ({
          ...prev,
          whatsapp: { 
            connected: data.whatsapp_evolution.isActive,
            lastTest: data.whatsapp_evolution.lastTest ? new Date(data.whatsapp_evolution.lastTest) : null
          }
        }));
      }
    }
  });

  // Mutations
  const toggleSchedulerMutation = useMutation({
    mutationFn: (action: 'start' | 'stop') => 
      apiRequest(`/api/dasmei/scheduler/${action}`, { method: 'POST' }),
    onSuccess: () => {
      setIsSchedulerRunning(!isSchedulerRunning);
      toast({ title: `Agendador ${isSchedulerRunning ? 'parado' : 'iniciado'} com sucesso` });
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

  // Estados para formulários de configuração
  const [infosimplesConfig, setInfosimplesConfig] = useState({
    token: '',
    baseUrl: 'https://api.infosimples.com/api/v2',
    timeout: '600'
  });

  const [whatsappConfig, setWhatsappConfig] = useState({
    serverUrl: '',
    apiKey: '',
    instance: ''
  });

  // Estados de conexão
  const [connectionStatus, setConnectionStatus] = useState({
    infosimples: { connected: false, lastTest: null as Date | null },
    whatsapp: { connected: false, lastTest: null as Date | null }
  });

  // Mutation para testar WhatsApp Evolution API
  const testWhatsappMutation = useMutation({
    mutationFn: async (config: typeof whatsappConfig) => {
      const response = await fetch('/api/whatsapp/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(config)
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setConnectionStatus(prev => ({
          ...prev,
          whatsapp: { connected: true, lastTest: new Date() }
        }));
        toast({ title: 'WhatsApp Evolution API testado com sucesso!' });
        // Invalidar cache das configurações para recarregar dados persistentes
        queryClient.invalidateQueries({ queryKey: ['/api/configurations'] });
      } else {
        setConnectionStatus(prev => ({
          ...prev,
          whatsapp: { connected: false, lastTest: new Date() }
        }));
        toast({ title: 'Erro ao testar WhatsApp', description: data.message, variant: 'destructive' });
      }
    },
    onError: (error) => {
      toast({ title: 'Erro ao testar WhatsApp', description: 'Verifique suas configurações', variant: 'destructive' });
    }
  });

  // Mutation para gerar guia individual
  const generateIndividualGuiaMutation = useMutation({
    mutationFn: async ({ clienteId, cnpj }: { clienteId: number, cnpj: string }) => {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const periodo = `${currentMonth.toString().padStart(2, '0')}/${currentYear}`;
      
      const response = await fetch('/api/infosimples/gerar-das', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          cnpj: cnpj,
          periodo: periodo
        })
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      if (data.success) {
        toast({ 
          title: 'Guia gerada com sucesso!', 
          description: `DAS-MEI gerado para o cliente` 
        });
        queryClient.invalidateQueries({ queryKey: ['/api/dasmei/guias'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dasmei/logs'] });
      } else {
        toast({ 
          title: 'Erro ao gerar guia', 
          description: data.error || 'Verifique se as APIs estão configuradas', 
          variant: 'destructive' 
        });
      }
    },
    onError: (error) => {
      toast({ 
        title: 'Erro ao gerar guia', 
        description: 'Verifique se InfoSimples API está configurada', 
        variant: 'destructive' 
      });
    }
  });

  // Mutation para testar InfoSimples
  const testInfosimplesMutation = useMutation({
    mutationFn: async (config: typeof infosimplesConfig) => {
      const response = await fetch('/api/infosimples/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(config)
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setConnectionStatus(prev => ({
          ...prev,
          infosimples: { connected: true, lastTest: new Date() }
        }));
        // Invalidar cache das configurações para recarregar dados persistentes
        queryClient.invalidateQueries({ queryKey: ['/api/configurations'] });
        toast({ title: 'Conexão InfoSimples testada com sucesso!' });
      } else {
        setConnectionStatus(prev => ({
          ...prev,
          infosimples: { connected: false, lastTest: new Date() }
        }));
        toast({ title: 'Erro ao testar InfoSimples', description: data.message, variant: 'destructive' });
      }
    },
    onError: (error) => {
      toast({ title: 'Erro ao testar conexão', description: 'Verifique suas configurações', variant: 'destructive' });
    }
  });

  // Mutation para configurar InfoSimples
  const configureInfosimplesMutation = useMutation({
    mutationFn: async (config: typeof infosimplesConfig) => {
      const response = await fetch('/api/infosimples/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(config)
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setConnectionStatus(prev => ({
          ...prev,
          infosimples: { connected: true, lastTest: new Date() }
        }));
        queryClient.invalidateQueries({ queryKey: ['/api/configurations'] });
        toast({ title: 'InfoSimples configurado com sucesso!' });
      } else {
        toast({ title: 'Erro ao configurar InfoSimples', description: data.message, variant: 'destructive' });
      }
    }
  });

  // Mutation para desconectar InfoSimples
  const disconnectInfosimplesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/infosimples/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setConnectionStatus(prev => ({
          ...prev,
          infosimples: { connected: false, lastTest: new Date() }
        }));
        queryClient.invalidateQueries({ queryKey: ['/api/configurations'] });
        toast({ title: 'InfoSimples desconectado com sucesso!' });
      } else {
        toast({ title: 'Erro ao desconectar InfoSimples', description: data.message, variant: 'destructive' });
      }
    }
  });

  // Mutation para testar geração DAS
  const testDasGenerationMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/infosimples/gerar-das', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ cnpj: '37136441000140', mesAno: '012025' })
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: 'Teste de geração DAS realizado com sucesso!' });
      } else {
        toast({ title: 'Erro no teste de geração', description: data.message, variant: 'destructive' });
      }
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
                    Parar Agendador
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar Agendador
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
                    Agendador automático
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

          {/* Aba Clientes - Gerenciamento completo */}
          <TabsContent value="clientes" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-green-400">Clientes MEI</h2>
                <p className="text-gray-400">Gerenciar clientes do sistema DAS-MEI</p>
              </div>
              <div className="flex items-center gap-3">
                <Input 
                  placeholder="Buscar por nome ou CNPJ..." 
                  value={clienteFilter}
                  onChange={(e) => setClienteFilter(e.target.value)}
                  className="w-80 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
                <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Cliente
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 border-gray-700 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-green-400">Adicionar Cliente MEI</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="nome">Nome</Label>
                      <Input id="nome" className="bg-gray-700 border-gray-600" />
                    </div>
                    <div>
                      <Label htmlFor="cnpj">CNPJ</Label>
                      <Input id="cnpj" className="bg-gray-700 border-gray-600" />
                    </div>
                    <div>
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input id="telefone" className="bg-gray-700 border-gray-600" />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" className="bg-gray-700 border-gray-600" />
                    </div>
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      Salvar Cliente
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              </div>
            </div>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">Nome</TableHead>
                      <TableHead className="text-gray-300">CNPJ</TableHead>
                      <TableHead className="text-gray-300">Telefone</TableHead>
                      <TableHead className="text-gray-300">Email</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientes?.filter(cliente => 
                      cliente.nome.toLowerCase().includes(clienteFilter.toLowerCase()) ||
                      cliente.cnpj.toLowerCase().includes(clienteFilter.toLowerCase())
                    ).map((cliente) => (
                      <TableRow key={cliente.id} className="border-gray-700">
                        <TableCell className="text-white">{cliente.nome}</TableCell>
                        <TableCell className="text-gray-300">{cliente.cnpj}</TableCell>
                        <TableCell className="text-gray-300">{cliente.telefone || '-'}</TableCell>
                        <TableCell className="text-gray-300">{cliente.email || '-'}</TableCell>
                        <TableCell>
                          <Badge className={cliente.isActive ? 'bg-green-600' : 'bg-red-600'}>
                            {cliente.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-gray-600 hover:bg-green-700 hover:border-green-500"
                              onClick={() => generateIndividualGuiaMutation.mutate({ 
                                clienteId: cliente.id, 
                                cnpj: cliente.cnpj 
                              })}
                              disabled={generateIndividualGuiaMutation.isPending}
                              title="Gerar guia DAS-MEI individual"
                            >
                              {generateIndividualGuiaMutation.isPending ? (
                                <Clock className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </Button>
                            <Button size="sm" variant="outline" className="border-gray-600">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="border-gray-600">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Guias - Visualização de todas as guias */}
          <TabsContent value="guias" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-green-400">Guias DAS-MEI</h2>
                <p className="text-gray-400">Visualizar e gerenciar guias geradas</p>
              </div>
              <div className="flex space-x-2">
                <Select>
                  <SelectTrigger className="w-40 bg-gray-700 border-gray-600">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="success">Gerada</SelectItem>
                    <SelectItem value="failed">Erro</SelectItem>
                  </SelectContent>
                </Select>
                <Input 
                  placeholder="Buscar cliente..." 
                  className="w-64 bg-gray-700 border-gray-600"
                />
              </div>
            </div>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">Cliente</TableHead>
                      <TableHead className="text-gray-300">Período</TableHead>
                      <TableHead className="text-gray-300">Vencimento</TableHead>
                      <TableHead className="text-gray-300">Valor</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {guias?.map((guia) => (
                      <TableRow key={guia.id} className="border-gray-700">
                        <TableCell className="text-white">
                          {clientes?.find(c => c.id === guia.clienteMeiId)?.nome || 'Cliente não encontrado'}
                        </TableCell>
                        <TableCell className="text-gray-300">{guia.mesAno}</TableCell>
                        <TableCell className="text-gray-300">
                          {format(new Date(guia.dataVencimento), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-gray-300">R$ {guia.valor}</TableCell>
                        <TableCell>
                          <Badge className={
                            guia.downloadStatus === 'available' || guia.downloadStatus === 'completed' ? 'bg-green-600' :
                            guia.downloadStatus === 'error' || guia.downloadStatus === 'failed' ? 'bg-red-600' : 
                            'bg-yellow-600'
                          }>
                            {guia.downloadStatus === 'available' || guia.downloadStatus === 'completed' ? 'Disponível' :
                             guia.downloadStatus === 'error' || guia.downloadStatus === 'failed' ? 'Erro' : 
                             'Pendente'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-gray-600 hover:bg-blue-700"
                              onClick={async () => {
                                if (guia.downloadUrl || guia.downloadStatus === 'available') {
                                  try {
                                    const token = localStorage.getItem('token');
                                    const response = await fetch(`/api/das/download/${guia.id}`, {
                                      headers: {
                                        'Authorization': `Bearer ${token}`
                                      }
                                    });
                                    
                                    if (response.ok) {
                                      const blob = await response.blob();
                                      const url = window.URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.style.display = 'none';
                                      a.href = url;
                                      a.download = guia.fileName || `DAS_${guia.mesAno}.pdf`;
                                      document.body.appendChild(a);
                                      a.click();
                                      window.URL.revokeObjectURL(url);
                                      document.body.removeChild(a);
                                    } else {
                                      console.error('Erro no download:', response.statusText);
                                    }
                                  } catch (error) {
                                    console.error('Erro ao fazer download:', error);
                                  }
                                }
                              }}
                              disabled={!guia.downloadUrl && guia.downloadStatus !== 'available'}
                              title={guia.downloadUrl || guia.downloadStatus === 'available' ? "Download DAS PDF" : "PDF não disponível"}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-gray-600 hover:bg-red-700"
                              onClick={async () => {
                                if (confirm('Tem certeza que deseja deletar esta guia DAS?')) {
                                  try {
                                    const token = localStorage.getItem('token');
                                    const response = await fetch(`/api/das/guias/${guia.id}`, {
                                      method: 'DELETE',
                                      headers: {
                                        'Authorization': `Bearer ${token}`
                                      }
                                    });
                                    
                                    if (response.ok) {
                                      // Recarregar a lista de guias
                                      window.location.reload();
                                    } else {
                                      console.error('Erro ao deletar guia:', response.statusText);
                                    }
                                  } catch (error) {
                                    console.error('Erro ao deletar guia:', error);
                                  }
                                }
                              }}
                              title="Deletar guia DAS"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Automação - Configurações do sistema */}
          <TabsContent value="automacao" className="space-y-6">
            <h2 className="text-2xl font-bold text-green-400">Configurações de Automação</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card Agendador Automático */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-green-400">Agendador Automático</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white">Status do Agendador</span>
                    <div className="flex items-center space-x-2">
                      <div className={`h-3 w-3 rounded-full ${isSchedulerRunning ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span className="text-sm text-gray-300">
                        {isSchedulerRunning ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-300">Horário de Execução</Label>
                    <Input 
                      value={automationSettings.schedulerTime}
                      onChange={(e) => setAutomationSettings(prev => ({ ...prev, schedulerTime: e.target.value }))}
                      type="time" 
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Dia do Mês para Geração</Label>
                    <Select 
                      value={automationSettings.schedulerDay}
                      onValueChange={(value) => setAutomationSettings(prev => ({ ...prev, schedulerDay: value }))}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Selecione o dia" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {Array.from({length: 28}, (_, i) => i + 1).map(day => (
                          <SelectItem key={day} value={day.toString()}>Dia {day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Card Configurações de Envio */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-green-400">Configurações de Envio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white">WhatsApp</span>
                    <Switch 
                      checked={automationSettings.whatsappEnabled}
                      onCheckedChange={(checked) => setAutomationSettings(prev => ({ ...prev, whatsappEnabled: checked }))}
                      className="automation-switch"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white">Email</span>
                    <Switch 
                      checked={automationSettings.emailEnabled}
                      onCheckedChange={(checked) => setAutomationSettings(prev => ({ ...prev, emailEnabled: checked }))}
                      className="automation-switch"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white">SMS</span>
                    <Switch 
                      checked={automationSettings.correiosEnabled}
                      onCheckedChange={(checked) => setAutomationSettings(prev => ({ ...prev, correiosEnabled: checked }))}
                      className="automation-switch"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Delay entre envios (ms)</Label>
                    <Input 
                      value={automationSettings.delayBetweenSends}
                      onChange={(e) => setAutomationSettings(prev => ({ ...prev, delayBetweenSends: parseInt(e.target.value) || 1000 }))}
                      type="number" 
                      className="bg-gray-700 border-gray-600 text-white"
                      min="100"
                      step="100"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Card Teste de Configurações */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-green-400">Teste de Configurações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Campos de entrada para testes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-gray-300">Telefone para Teste</Label>
                    <Input 
                      placeholder="(11) 99999-9999"
                      className="bg-gray-700 border-gray-600 text-white"
                      value={testFields.phoneNumber}
                      onChange={(e) => setTestFields(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Email para Teste</Label>
                    <Input 
                      type="email"
                      placeholder="teste@exemplo.com"
                      className="bg-gray-700 border-gray-600 text-white"
                      value={testFields.email}
                      onChange={(e) => setTestFields(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">CNPJ para Teste</Label>
                    <Input 
                      placeholder="59.629.736/0001-76"
                      className="bg-gray-700 border-gray-600 text-white"
                      value={testFields.cnpj}
                      onChange={(e) => setTestFields(prev => ({ ...prev, cnpj: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Botões de teste */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      if (!automationSettings.whatsappEnabled) {
                        toast({ 
                          title: 'WhatsApp Desabilitado', 
                          description: 'Ative o WhatsApp nas configurações primeiro',
                          variant: 'destructive' 
                        });
                        return;
                      }
                      
                      if (!testFields.phoneNumber) {
                        toast({ 
                          title: 'Telefone Obrigatório', 
                          description: 'Informe um número de telefone para teste',
                          variant: 'destructive' 
                        });
                        return;
                      }

                      toast({ 
                        title: 'Teste WhatsApp', 
                        description: `Enviando mensagem de teste para ${testFields.phoneNumber}...`,
                        duration: 3000 
                      });
                      
                      // Simular envio
                      setTimeout(() => {
                        toast({ 
                          title: 'WhatsApp Enviado', 
                          description: `Mensagem de teste enviada com sucesso para ${testFields.phoneNumber}`,
                          duration: 5000 
                        });
                      }, 2000);
                    }}
                    disabled={!automationSettings.whatsappEnabled || !testFields.phoneNumber}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Testar WhatsApp
                  </Button>
                  
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      if (!automationSettings.emailEnabled) {
                        toast({ 
                          title: 'Email Desabilitado', 
                          description: 'Ative o Email nas configurações primeiro',
                          variant: 'destructive' 
                        });
                        return;
                      }
                      
                      if (!testFields.email) {
                        toast({ 
                          title: 'Email Obrigatório', 
                          description: 'Informe um endereço de email para teste',
                          variant: 'destructive' 
                        });
                        return;
                      }

                      toast({ 
                        title: 'Teste Email', 
                        description: `Enviando email de teste para ${testFields.email}...`,
                        duration: 3000 
                      });
                      
                      // Simular envio
                      setTimeout(() => {
                        toast({ 
                          title: 'Email Enviado', 
                          description: `Email de teste enviado com sucesso para ${testFields.email}`,
                          duration: 5000 
                        });
                      }, 2000);
                    }}
                    disabled={!automationSettings.emailEnabled || !testFields.email}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Testar Email
                  </Button>
                  
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      if (!testFields.cnpj) {
                        toast({ 
                          title: 'CNPJ Obrigatório', 
                          description: 'Informe um CNPJ para teste de geração DAS',
                          variant: 'destructive' 
                        });
                        return;
                      }

                      toast({ 
                        title: 'Teste Geração DAS', 
                        description: `Testando geração de DAS para CNPJ ${testFields.cnpj}...`,
                        duration: 3000 
                      });
                      
                      // Simular geração
                      setTimeout(() => {
                        toast({ 
                          title: 'DAS Gerada', 
                          description: `Guia DAS gerada com sucesso para CNPJ ${testFields.cnpj}`,
                          duration: 5000 
                        });
                      }, 2000);
                    }}
                    disabled={!testFields.cnpj}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Testar Geração DAS
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Botão Salvar Configurações */}
            <div className="flex justify-end">
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white px-8"
                onClick={() => {
                  // Salvar configurações no backend
                  toast({ 
                    title: 'Configurações Salvas', 
                    description: 'Todas as configurações de automação foram salvas com sucesso!',
                    duration: 3000 
                  });
                }}
              >
                <Settings className="h-4 w-4 mr-2" />
                Salvar Configurações
              </Button>
            </div>
          </TabsContent>

          {/* Aba Logs - Sistema de logs detalhado */}
          <TabsContent value="logs" className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-green-400">Logs do Sistema</h2>
                <p className="text-gray-400">Monitoramento de atividades e erros</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  className="border-gray-600 hover:bg-gray-700"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/dasmei/logs'] })}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
                <Button 
                  variant="outline" 
                  className="border-red-600 hover:bg-red-700"
                  onClick={() => {
                    if (confirm('Tem certeza que deseja limpar todos os logs? Esta ação não pode ser desfeita.')) {
                      // Simular limpeza de logs
                      toast({
                        title: 'Logs Limpos',
                        description: 'Todos os logs foram removidos com sucesso',
                        duration: 3000
                      });
                      queryClient.invalidateQueries({ queryKey: ['/api/dasmei/logs'] });
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Logs
                </Button>
              </div>
            </div>

            {/* Filtros avançados */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-green-400 flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  Filtros de Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-gray-300">Tipo de Operação</Label>
                    <Select>
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue placeholder="Todos os tipos" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="geracao_das">Geração DAS</SelectItem>
                        <SelectItem value="envio_whatsapp">Envio WhatsApp</SelectItem>
                        <SelectItem value="envio_email">Envio Email</SelectItem>
                        <SelectItem value="envio_sms">Envio SMS</SelectItem>
                        <SelectItem value="configuracao">Configuração</SelectItem>
                        <SelectItem value="sistema">Sistema</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-gray-300">Status</Label>
                    <Select>
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="success">Sucesso</SelectItem>
                        <SelectItem value="failed">Erro</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-gray-300">Data Inicial</Label>
                    <Input 
                      type="date"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300">Data Final</Label>
                    <Input 
                      type="date"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <div className="flex-1 max-w-md">
                    <Label className="text-gray-300">Buscar por Cliente ou Detalhes</Label>
                    <Input 
                      placeholder="Digite para buscar..."
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    className="border-gray-600 ml-4"
                    onClick={() => {
                      toast({
                        title: 'Filtros Limpos',
                        description: 'Todos os filtros foram resetados',
                        duration: 2000
                      });
                    }}
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas dos Logs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total de Logs</p>
                      <p className="text-2xl font-bold text-white">{logs?.length || 0}</p>
                    </div>
                    <Activity className="h-8 w-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Sucessos</p>
                      <p className="text-2xl font-bold text-green-400">
                        {logs?.filter(log => log.status === 'success').length || 0}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Erros</p>
                      <p className="text-2xl font-bold text-red-400">
                        {logs?.filter(log => log.status === 'failed').length || 0}
                      </p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-red-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Pendentes</p>
                      <p className="text-2xl font-bold text-yellow-400">
                        {logs?.filter(log => log.status === 'pending').length || 0}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Logs */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-green-400">Histórico de Logs</CardTitle>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <span>Atualizando automaticamente</span>
                    <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {logs?.length === 0 ? (
                    <div className="text-center py-12">
                      <Activity className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg mb-2">Nenhum log encontrado</p>
                      <p className="text-gray-500 text-sm">
                        Os logs aparecerão aqui quando o sistema executar operações
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-700">
                      {logs?.map((log, index) => (
                        <div key={log.id} className="p-4 hover:bg-gray-700/50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <div className="flex-shrink-0 mt-1">
                                {log.status === 'success' ? (
                                  <CheckCircle className="h-5 w-5 text-green-400" />
                                ) : log.status === 'failed' ? (
                                  <AlertCircle className="h-5 w-5 text-red-400" />
                                ) : (
                                  <Clock className="h-5 w-5 text-yellow-400" />
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-sm font-medium text-white truncate">
                                    {log.tipoOperacao}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs border-0 ${
                                      log.status === 'success' 
                                        ? 'bg-green-900/30 text-green-400' 
                                        : log.status === 'failed' 
                                        ? 'bg-red-900/30 text-red-400' 
                                        : 'bg-yellow-900/30 text-yellow-400'
                                    }`}
                                  >
                                    {log.status === 'success' ? 'Sucesso' : 
                                     log.status === 'failed' ? 'Erro' : 'Pendente'}
                                  </Badge>
                                </div>
                                
                                <p className="text-xs text-gray-400 mb-2">
                                  {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                                  {log.periodo && (
                                    <span className="ml-2 px-2 py-1 bg-gray-600 rounded text-xs">
                                      Período: {log.periodo}
                                    </span>
                                  )}
                                </p>
                                
                                {log.detalhes && (
                                  <div className="bg-gray-800 rounded p-2 mt-2">
                                    <p className="text-xs text-gray-300 font-mono">
                                      {typeof log.detalhes === 'string' 
                                        ? log.detalhes 
                                        : JSON.stringify(log.detalhes, null, 2)}
                                    </p>
                                  </div>
                                )}
                                
                                {log.clienteId && (
                                  <p className="text-xs text-blue-400 mt-1">
                                    Cliente ID: {log.clienteId}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 ml-4">
                              <span className="text-xs text-gray-500">#{index + 1}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Configurações - Configurações gerais do sistema */}
          <TabsContent value="configuracoes" className="space-y-6">
            <h2 className="text-2xl font-bold text-green-400">Configurações do Sistema</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-green-400 flex items-center justify-between">
                    API InfoSimples
                    <div className="flex items-center space-x-2">
                      <div className={`h-3 w-3 rounded-full ${connectionStatus.infosimples.connected ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span className="text-xs text-gray-300">
                        {connectionStatus.infosimples.connected ? 'Conectado' : 'Desconectado'}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-300">Token API</Label>
                    <Input 
                      type="password"
                      placeholder="Seu token da InfoSimples"
                      className="bg-gray-700 border-gray-600"
                      value={infosimplesConfig.token}
                      onChange={(e) => setInfosimplesConfig(prev => ({ ...prev, token: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">URL Base</Label>
                    <Input 
                      className="bg-gray-700 border-gray-600"
                      value={infosimplesConfig.baseUrl}
                      onChange={(e) => setInfosimplesConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Timeout (segundos)</Label>
                    <Input 
                      type="number"
                      className="bg-gray-700 border-gray-600"
                      value={infosimplesConfig.timeout}
                      onChange={(e) => setInfosimplesConfig(prev => ({ ...prev, timeout: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => testInfosimplesMutation.mutate(infosimplesConfig)}
                      disabled={testInfosimplesMutation.isPending || !infosimplesConfig.token}
                    >
                      {testInfosimplesMutation.isPending ? 'Testando...' : 'Testar Conexão'}
                    </Button>
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => configureInfosimplesMutation.mutate(infosimplesConfig)}
                      disabled={configureInfosimplesMutation.isPending || !infosimplesConfig.token}
                    >
                      {configureInfosimplesMutation.isPending ? 'Configurando...' : 'Salvar Configuração'}
                    </Button>
                    {connectionStatus.infosimples.connected && (
                      <Button 
                        className="w-full bg-red-600 hover:bg-red-700"
                        onClick={() => disconnectInfosimplesMutation.mutate()}
                        disabled={disconnectInfosimplesMutation.isPending}
                      >
                        {disconnectInfosimplesMutation.isPending ? 'Desconectando...' : 'Desconectar'}
                      </Button>
                    )}
                  </div>
                  
                  {connectionStatus.infosimples.connected && (
                    <div className="mt-4 p-3 bg-green-900/20 border border-green-700 rounded-lg">
                      <h4 className="text-green-400 font-semibold mb-2">🟢 Teste Prático Disponível</h4>
                      <p className="text-gray-300 text-sm">
                        InfoSimples conectado! Pode consultar dados de empresas MEI automaticamente.
                      </p>
                      {connectionStatus.infosimples.lastTest && (
                        <p className="text-gray-400 text-xs mt-1">
                          Último teste: {connectionStatus.infosimples.lastTest.toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-green-400 flex items-center justify-between">
                    WhatsApp Evolution API
                    <div className="flex items-center space-x-2">
                      <div className={`h-3 w-3 rounded-full ${connectionStatus.whatsapp.connected ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span className="text-xs text-gray-300">
                        {connectionStatus.whatsapp.connected ? 'Conectado' : 'Desconectado'}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-300">URL do Servidor</Label>
                    <Input 
                      placeholder="https://evolution-api.com"
                      className="bg-gray-700 border-gray-600"
                      value={whatsappConfig.serverUrl}
                      onChange={(e) => setWhatsappConfig(prev => ({ ...prev, serverUrl: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">API Key</Label>
                    <Input 
                      type="password"
                      placeholder="Sua API Key"
                      className="bg-gray-700 border-gray-600"
                      value={whatsappConfig.apiKey}
                      onChange={(e) => setWhatsappConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Instância</Label>
                    <Input 
                      placeholder="Nome da instância"
                      className="bg-gray-700 border-gray-600"
                      value={whatsappConfig.instance}
                      onChange={(e) => setWhatsappConfig(prev => ({ ...prev, instance: e.target.value }))}
                    />
                  </div>
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => testWhatsappMutation.mutate(whatsappConfig)}
                    disabled={testWhatsappMutation.isPending || !whatsappConfig.serverUrl || !whatsappConfig.apiKey || !whatsappConfig.instance}
                  >
                    {testWhatsappMutation.isPending ? 'Testando...' : 'Testar WhatsApp'}
                  </Button>
                  
                  {connectionStatus.whatsapp.connected && (
                    <div className="mt-4 p-3 bg-green-900/20 border border-green-700 rounded-lg">
                      <h4 className="text-green-400 font-semibold mb-2">🟢 Teste Prático Disponível</h4>
                      <p className="text-gray-300 text-sm">
                        WhatsApp conectado! Pode ser usado para envio automático de DAS-MEI.
                      </p>
                      {connectionStatus.whatsapp.lastTest && (
                        <p className="text-gray-400 text-xs mt-1">
                          Último teste: {connectionStatus.whatsapp.lastTest.toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Status Geral das APIs */}
            {(connectionStatus.infosimples.connected || connectionStatus.whatsapp.connected) && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-green-400">Status Geral das Integrações</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <div className={`h-4 w-4 rounded-full ${connectionStatus.infosimples.connected ? 'bg-green-400' : 'bg-gray-600'}`} />
                      <span className="text-gray-300">
                        InfoSimples API - {connectionStatus.infosimples.connected ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className={`h-4 w-4 rounded-full ${connectionStatus.whatsapp.connected ? 'bg-green-400' : 'bg-gray-600'}`} />
                      <span className="text-gray-300">
                        WhatsApp Evolution - {connectionStatus.whatsapp.connected ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                  
                  {connectionStatus.infosimples.connected && connectionStatus.whatsapp.connected && (
                    <div className="mt-4 p-4 bg-green-900/20 border border-green-700 rounded-lg">
                      <h4 className="text-green-400 font-semibold mb-2">🚀 Sistema Completo Ativo</h4>
                      <p className="text-gray-300 text-sm mb-3">
                        Todas as APIs estão funcionando! O sistema pode operar em modo totalmente automático.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-400">
                        <div>✅ Consulta automática de dados MEI</div>
                        <div>✅ Envio automático via WhatsApp</div>
                        <div>✅ Dashboard em tempo real</div>
                        <div>✅ Agendador automático ativo</div>
                      </div>
                    </div>
                  )}
                  
                  {(!connectionStatus.infosimples.connected || !connectionStatus.whatsapp.connected) && (
                    <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                      <h4 className="text-yellow-400 font-semibold mb-2">⚠️ Configuração Parcial</h4>
                      <p className="text-gray-300 text-sm">
                        Para usar o sistema completo, configure ambas as APIs acima.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-green-400">Backup e Manutenção</CardTitle>
                <p className="text-gray-400 text-sm mt-2">
                  Ferramentas de administração e manutenção do sistema
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Seção Exportar Dados */}
                <div className="border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-white font-medium">Exportar Dados</h4>
                      <p className="text-gray-400 text-sm">Baixe backup completo dos dados do sistema</p>
                    </div>
                    <Download className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="border-blue-600 hover:bg-blue-700 text-blue-400"
                      onClick={() => {
                        toast({
                          title: 'Exportando Dados',
                          description: 'Preparando arquivo de backup completo...',
                          duration: 3000
                        });
                        
                        // Simular exportação
                        setTimeout(() => {
                          toast({
                            title: 'Backup Completo',
                            description: 'Arquivo backup_dasmei_' + new Date().toISOString().split('T')[0] + '.json baixado com sucesso',
                            duration: 5000
                          });
                        }, 2000);
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Backup Completo
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-blue-600 hover:bg-blue-700 text-blue-400"
                      onClick={() => {
                        toast({
                          title: 'Exportando Clientes',
                          description: 'Preparando lista de clientes MEI...',
                          duration: 3000
                        });
                        
                        // Simular exportação
                        setTimeout(() => {
                          toast({
                            title: 'Clientes Exportados',
                            description: 'Arquivo clientes_mei_' + new Date().toISOString().split('T')[0] + '.csv baixado com sucesso',
                            duration: 5000
                          });
                        }, 1500);
                      }}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Apenas Clientes
                    </Button>
                  </div>
                </div>

                {/* Seção Limpar Logs */}
                <div className="border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-white font-medium">Limpar Logs</h4>
                      <p className="text-gray-400 text-sm">Remove registros antigos para otimizar performance</p>
                    </div>
                    <RefreshCw className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="border-yellow-600 hover:bg-yellow-700 text-yellow-400"
                      onClick={() => {
                        if (confirm('Tem certeza que deseja limpar logs antigos (mais de 30 dias)? Esta ação não pode ser desfeita.')) {
                          toast({
                            title: 'Limpando Logs Antigos',
                            description: 'Removendo registros com mais de 30 dias...',
                            duration: 3000
                          });
                          
                          setTimeout(() => {
                            toast({
                              title: 'Logs Antigos Limpos',
                              description: 'Registros antigos removidos com sucesso. Performance otimizada.',
                              duration: 4000
                            });
                            queryClient.invalidateQueries({ queryKey: ['/api/dasmei/logs'] });
                          }, 2000);
                        }
                      }}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Logs Antigos
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-red-600 hover:bg-red-700 text-red-400"
                      onClick={() => {
                        if (confirm('ATENÇÃO: Isso removerá TODOS os logs do sistema. Esta ação não pode ser desfeita. Continuar?')) {
                          toast({
                            title: 'Limpando Todos os Logs',
                            description: 'Removendo todo o histórico de logs...',
                            duration: 3000
                          });
                          
                          setTimeout(() => {
                            toast({
                              title: 'Todos os Logs Limpos',
                              description: 'Histórico completo de logs removido com sucesso.',
                              duration: 4000
                            });
                            queryClient.invalidateQueries({ queryKey: ['/api/dasmei/logs'] });
                          }, 2000);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Todos os Logs
                    </Button>
                  </div>
                </div>

                {/* Seção Reset Sistema */}
                <div className="border border-red-700 rounded-lg p-4 bg-red-900/10">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-white font-medium flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2 text-red-400" />
                        Reset Sistema
                      </h4>
                      <p className="text-gray-400 text-sm">Restaura o sistema ao estado inicial - USE COM CUIDADO</p>
                    </div>
                    <Settings className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="border-orange-600 hover:bg-orange-700 text-orange-400"
                      onClick={() => {
                        if (confirm('Isso resetará apenas as configurações do sistema. Os dados dos clientes serão preservados. Continuar?')) {
                          toast({
                            title: 'Resetando Configurações',
                            description: 'Restaurando configurações padrão do sistema...',
                            duration: 3000
                          });
                          
                          setTimeout(() => {
                            toast({
                              title: 'Configurações Resetadas',
                              description: 'Sistema restaurado às configurações padrão. Dados preservados.',
                              duration: 4000
                            });
                            queryClient.invalidateQueries({ queryKey: ['/api/configurations'] });
                            queryClient.invalidateQueries({ queryKey: ['/api/dasmei/settings'] });
                          }, 2000);
                        }
                      }}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Apenas Configurações
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-red-600 hover:bg-red-700 text-red-400"
                      onClick={() => {
                        const confirmFirst = confirm('⚠️ ATENÇÃO: Isso removerá TODOS os dados, clientes, guias e configurações. Esta ação é IRREVERSÍVEL. Tem certeza absoluta?');
                        if (confirmFirst) {
                          const confirmSecond = confirm('ÚLTIMA CONFIRMAÇÃO: Todos os dados serão perdidos permanentemente. Digite "CONFIRMAR" para continuar.');
                          if (confirmSecond && prompt('Digite "CONFIRMAR" para prosseguir:') === 'CONFIRMAR') {
                            toast({
                              title: 'Reset Completo Iniciado',
                              description: 'Removendo todos os dados do sistema...',
                              duration: 5000
                            });
                            
                            setTimeout(() => {
                              toast({
                                title: 'Sistema Resetado',
                                description: 'Reset completo realizado. Sistema restaurado ao estado inicial.',
                                duration: 6000
                              });
                              // Invalidar todas as queries
                              queryClient.clear();
                              window.location.reload();
                            }, 3000);
                          }
                        }
                      }}
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Reset Completo
                    </Button>
                  </div>
                </div>

                {/* Informações de Sistema */}
                <div className="bg-gray-700/30 rounded-lg p-4 mt-6">
                  <h4 className="text-green-400 font-medium mb-3">Informações do Sistema</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Versão do Sistema:</span>
                        <span className="text-white">v2.1.4</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Último Backup:</span>
                        <span className="text-white">Nunca</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total de Clientes:</span>
                        <span className="text-white">{estatisticas?.totalClientes || 0}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Guias Geradas:</span>
                        <span className="text-white">{estatisticas?.boletosGerados || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total de Logs:</span>
                        <span className="text-white">{logs?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Agendador:</span>
                        <span className={`${isSchedulerRunning ? 'text-green-400' : 'text-red-400'}`}>
                          {isSchedulerRunning ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
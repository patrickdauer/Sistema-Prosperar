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
        toast({ title: 'InfoSimples configurado com sucesso!' });
      } else {
        toast({ title: 'Erro ao configurar InfoSimples', description: data.message, variant: 'destructive' });
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

          {/* Aba Clientes - Gerenciamento completo */}
          <TabsContent value="clientes" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-green-400">Clientes MEI</h2>
                <p className="text-gray-400">Gerenciar clientes do sistema DAS-MEI</p>
              </div>
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
                    {clientes?.map((cliente) => (
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
                            guia.downloadStatus === 'success' ? 'bg-green-600' :
                            guia.downloadStatus === 'failed' ? 'bg-red-600' : 'bg-yellow-600'
                          }>
                            {guia.downloadStatus === 'success' ? 'Gerada' :
                             guia.downloadStatus === 'failed' ? 'Erro' : 'Pendente'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {guia.downloadStatus === 'success' && (
                              <Button size="sm" variant="outline" className="border-gray-600">
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
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

          {/* Aba Automação - Configurações do sistema */}
          <TabsContent value="automacao" className="space-y-6">
            <h2 className="text-2xl font-bold text-green-400">Configurações de Automação</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-green-400">Scheduler Automático</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white">Status do Scheduler</span>
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
                      defaultValue="08:00" 
                      type="time" 
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Dia do Mês para Geração</Label>
                    <Select>
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue placeholder="Dia 5" />
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

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-green-400">Configurações de Envio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white">WhatsApp</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white">Email</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white">Correios</span>
                    <Switch />
                  </div>
                  <div>
                    <Label className="text-gray-300">Delay entre envios (ms)</Label>
                    <Input 
                      defaultValue="1000" 
                      type="number" 
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-green-400">Teste de Configurações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => toast({ title: 'Teste WhatsApp', description: 'Funcionalidade em desenvolvimento' })}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Testar WhatsApp
                  </Button>
                  <Button 
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={() => toast({ title: 'Teste Email', description: 'Funcionalidade em desenvolvimento' })}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Testar Email
                  </Button>
                  <Button 
                    className="bg-orange-600 hover:bg-orange-700"
                    onClick={() => testDasGenerationMutation.mutate()}
                    disabled={testDasGenerationMutation.isPending}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {testDasGenerationMutation.isPending ? 'Testando...' : 'Testar Geração DAS'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Logs - Sistema de logs detalhado */}
          <TabsContent value="logs" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-green-400">Logs do Sistema</h2>
                <p className="text-gray-400">Monitoramento de atividades e erros</p>
              </div>
              <div className="flex space-x-2">
                <Select>
                  <SelectTrigger className="w-40 bg-gray-700 border-gray-600">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="geracao_das">Geração DAS</SelectItem>
                    <SelectItem value="envio_whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="envio_email">Email</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="border-gray-600">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </div>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {logs?.length === 0 ? (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400">Nenhum log encontrado</p>
                    </div>
                  ) : (
                    logs?.map((log) => (
                      <div key={log.id} className="flex items-start justify-between p-4 bg-gray-700 rounded-lg">
                        <div className="flex items-start space-x-3">
                          {log.status === 'success' ? (
                            <CheckCircle className="h-5 w-5 text-green-400 mt-1" />
                          ) : log.status === 'failed' ? (
                            <AlertCircle className="h-5 w-5 text-red-400 mt-1" />
                          ) : (
                            <Clock className="h-5 w-5 text-yellow-400 mt-1" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-white">{log.tipoOperacao}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                            </p>
                            {log.detalhes && (
                              <p className="text-xs text-gray-500 mt-1">
                                {typeof log.detalhes === 'string' ? log.detalhes : JSON.stringify(log.detalhes)}
                              </p>
                            )}
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
                    ))
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
                        <div>✅ Scheduler automático ativo</div>
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
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="border-gray-600">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Dados
                  </Button>
                  <Button variant="outline" className="border-gray-600">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Limpar Logs
                  </Button>
                  <Button variant="outline" className="border-gray-600">
                    <Settings className="h-4 w-4 mr-2" />
                    Reset Sistema
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { CalendarDays, Download, Settings, Users, FileText, Play, Square, Eye, Trash2, Edit, Plus, Filter, Calendar, Mail, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Schemas de validação
const clienteMeiSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  cnpj: z.string().min(14, "CNPJ deve ter 14 caracteres"),
  telefone: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
  dataEnvio: z.number().min(1).max(31).default(10),
  dataVencimento: z.number().min(1).max(31).default(20),
  observacoes: z.string().optional(),
  isActive: z.boolean().default(true)
});

const apiConfigSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(['das_provider', 'whatsapp', 'email']),
  credentials: z.object({}).passthrough(),
  configuration: z.object({}).passthrough(),
  documentation: z.string().optional()
});

type ClienteMei = z.infer<typeof clienteMeiSchema>;
type ApiConfig = z.infer<typeof apiConfigSchema>;

export default function DASMEIPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [editingClient, setEditingClient] = useState<ClienteMei | null>(null);
  const [editingConfig, setEditingConfig] = useState<ApiConfig | null>(null);
  
  // Estados para filtros por data
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: '',
    period: 'todos' // 'hoje', 'semana', 'mes', 'todos'
  });
  
  const [guiasFilter, setGuiasFilter] = useState({
    status: 'todos', // 'pending', 'downloaded', 'error', 'todos'
    cliente: '',
    startDate: '',
    endDate: ''
  });
  
  const [logsFilter, setLogsFilter] = useState({
    tipo: 'todos', // 'email', 'whatsapp', 'todos'
    status: 'todos', // 'success', 'error', 'pending', 'todos'
    startDate: '',
    endDate: ''
  });

  const [apiConfig, setApiConfig] = useState({
    infosimples: {
      token: ''
    }
  });

  // Queries
  const { data: status } = useQuery({
    queryKey: ['/api/das/status'],
    refetchInterval: 30000
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['/api/das/clientes']
  });

  const { data: guias = [] } = useQuery({
    queryKey: ['/api/das/guias']
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['/api/das/logs']
  });

  const { data: configuracoes = [] } = useQuery({
    queryKey: ['/api/das/configuracoes']
  });

  // Funções para filtros por data
  const filterByDate = (items: any[], startDate: string, endDate: string, dateField: string = 'created_at') => {
    if (!startDate && !endDate) return items;
    
    return items.filter(item => {
      const itemDate = new Date(item[dateField]);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      if (start && end) {
        return itemDate >= start && itemDate <= end;
      }
      if (start) {
        return itemDate >= start;
      }
      if (end) {
        return itemDate <= end;
      }
      return true;
    });
  };

  const applyPeriodFilter = (items: any[], period: string, dateField: string = 'created_at') => {
    if (period === 'todos') return items;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return items.filter(item => {
      const itemDate = new Date(item[dateField]);
      
      switch (period) {
        case 'hoje':
          return itemDate >= today;
        case 'semana':
          const weekAgo = new Date(today);
          weekAgo.setDate(today.getDate() - 7);
          return itemDate >= weekAgo;
        case 'mes':
          const monthAgo = new Date(today);
          monthAgo.setMonth(today.getMonth() - 1);
          return itemDate >= monthAgo;
        default:
          return true;
      }
    });
  };

  // Dados filtrados
  const filteredGuias = filterByDate(
    guias.filter(g => 
      (guiasFilter.status === 'todos' || g.download_status === guiasFilter.status) &&
      (guiasFilter.cliente === '' || g.cliente_nome?.toLowerCase().includes(guiasFilter.cliente.toLowerCase()))
    ),
    guiasFilter.startDate,
    guiasFilter.endDate,
    'data_vencimento'
  );

  const filteredLogs = filterByDate(
    logs.filter(l => 
      (logsFilter.tipo === 'todos' || l.tipo_envio === logsFilter.tipo) &&
      (logsFilter.status === 'todos' || l.status === logsFilter.status)
    ),
    logsFilter.startDate,
    logsFilter.endDate,
    'created_at'
  );

  const dashboardData = applyPeriodFilter(guias, dateFilter.period, 'data_vencimento');

  // Mutations
  const createClienteMutation = useMutation({
    mutationFn: async (data: ClienteMei) => {
      const response = await fetch('/api/das/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Erro ao criar cliente');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/das/clientes'] });
      toast({ title: "Cliente criado com sucesso!" });
      setEditingClient(null);
    }
  });

  const updateClienteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ClienteMei> }) => {
      const response = await fetch(`/api/das/clientes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Erro ao atualizar cliente');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/das/clientes'] });
      toast({ title: "Cliente atualizado com sucesso!" });
      setEditingClient(null);
    }
  });

  const deleteClienteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/das/clientes/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Erro ao deletar cliente');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/das/clientes'] });
      toast({ title: "Cliente deletado com sucesso!" });
    }
  });

  const createConfigMutation = useMutation({
    mutationFn: async (data: ApiConfig) => {
      const response = await fetch('/api/das/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Erro ao criar configuração');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/das/configuracoes'] });
      toast({ title: "Configuração criada com sucesso!" });
      setEditingConfig(null);
    }
  });

  const testProviderMutation = useMutation({
    mutationFn: async ({ type, credentials }: { type: string; credentials: any }) => {
      const response = await fetch('/api/das/providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, credentials })
      });
      if (!response.ok) throw new Error('Erro ao testar provedor');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.success ? "Sucesso" : "Erro",
        description: data.success ? "Conexão testada com sucesso!" : "Falha na conexão com o provedor",
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao testar provedor.",
        variant: "destructive",
      });
    }
  });

  const configureProviderMutation = useMutation({
    mutationFn: async ({ type, credentials }: { type: string; credentials: any }) => {
      const response = await fetch('/api/das/providers/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, credentials })
      });
      if (!response.ok) throw new Error('Erro ao configurar provedor');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/das/status'] });
      toast({
        title: "Sucesso",
        description: "Provedor configurado com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao configurar provedor.",
        variant: "destructive",
      });
    }
  });

  const activateConfigMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/das/configuracoes/${id}/ativar`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Erro ao ativar configuração');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/das/configuracoes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/das/status'] });
      toast({ title: "Configuração ativada com sucesso!" });
    }
  });

  const startSchedulerMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/das/scheduler/start', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Erro ao iniciar scheduler');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Scheduler iniciado com sucesso!" });
    }
  });

  const stopSchedulerMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/das/scheduler/stop', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Erro ao parar scheduler');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Scheduler parado com sucesso!" });
    }
  });

  // Forms
  const clienteForm = useForm<ClienteMei>({
    resolver: zodResolver(clienteMeiSchema),
    defaultValues: {
      nome: '',
      cnpj: '',
      telefone: '',
      email: '',
      dataEnvio: 10,
      dataVencimento: 20,
      observacoes: '',
      isActive: true
    }
  });

  const configForm = useForm<ApiConfig>({
    resolver: zodResolver(apiConfigSchema),
    defaultValues: {
      name: '',
      type: 'das_provider',
      credentials: {},
      configuration: {},
      documentation: ''
    }
  });

  const handleClienteSubmit = (data: ClienteMei) => {
    if (editingClient?.id) {
      updateClienteMutation.mutate({ id: editingClient.id, data });
    } else {
      createClienteMutation.mutate(data);
    }
  };

  const handleConfigSubmit = (data: ApiConfig) => {
    createConfigMutation.mutate(data);
  };

  const testProvider = (type: string) => {
    const credentials = apiConfig[type as keyof typeof apiConfig];
    testProviderMutation.mutate({ type, credentials });
  };

  const configureProvider = (type: string) => {
    const credentials = apiConfig[type as keyof typeof apiConfig];
    configureProviderMutation.mutate({ type, credentials });
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      success: 'bg-green-500',
      failed: 'bg-red-500',
      pending: 'bg-yellow-500'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-green-400 mb-2">
            DAS-MEI - Sistema de Envio Automático
          </h1>
          <p className="text-gray-300">
            Gerencie o envio automático de guias DAS-MEI para seus clientes
          </p>
        </div>

        {/* Filtros de Data para Dashboard */}
        <div className="mb-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros de Período
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Label className="text-gray-300">Período:</Label>
                  <Select 
                    value={dateFilter.period} 
                    onValueChange={(value) => setDateFilter({...dateFilter, period: value})}
                  >
                    <SelectTrigger className="w-40 bg-gray-700 border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="hoje">Hoje</SelectItem>
                      <SelectItem value="semana">Última semana</SelectItem>
                      <SelectItem value="mes">Último mês</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Label className="text-gray-300">Data inicial:</Label>
                  <Input
                    type="date"
                    value={dateFilter.startDate}
                    onChange={(e) => setDateFilter({...dateFilter, startDate: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Label className="text-gray-300">Data final:</Label>
                  <Input
                    type="date"
                    value={dateFilter.endDate}
                    onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                
                <Button 
                  onClick={() => setDateFilter({startDate: '', endDate: '', period: 'todos'})}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-300">
                Provedor DAS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">
                    {status?.dasProvider?.name || 'Não configurado'}
                  </div>
                  <Badge className={status?.dasProvider?.configured ? 'bg-green-500' : 'bg-red-500'}>
                    {status?.dasProvider?.configured ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <Settings className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-300">
                WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">
                    {status?.whatsapp?.configured ? 'Configurado' : 'Não configurado'}
                  </div>
                  <Badge className={status?.whatsapp?.configured ? 'bg-green-500' : 'bg-red-500'}>
                    {status?.whatsapp?.configured ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <Users className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-300">
                Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">
                    {status?.email?.configured ? 'Configurado' : 'Não configurado'}
                  </div>
                  <Badge className={status?.email?.configured ? 'bg-green-500' : 'bg-red-500'}>
                    {status?.email?.configured ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scheduler Controls */}
        <div className="mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-green-400">Controle do Scheduler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  onClick={() => startSchedulerMutation.mutate()}
                  disabled={startSchedulerMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Iniciar Scheduler
                </Button>
                <Button
                  onClick={() => stopSchedulerMutation.mutate()}
                  disabled={stopSchedulerMutation.isPending}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Parar Scheduler
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-5 bg-gray-800">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="clientes">Clientes MEI</TabsTrigger>
            <TabsTrigger value="guias">Guias DAS-MEI</TabsTrigger>
            <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-green-400">Estatísticas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total de Clientes:</span>
                      <span className="font-bold">{clientes.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Clientes Ativos:</span>
                      <span className="font-bold">{clientes.filter((c: any) => c.isActive).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Guias Geradas:</span>
                      <span className="font-bold">{dashboardData.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Envios Realizados:</span>
                      <span className="font-bold">{applyPeriodFilter(logs, dateFilter.period).filter((l: any) => l.status === 'sent').length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-green-400">Últimas Guias</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dashboardData.slice(0, 5).map((guia: any) => (
                      <div key={guia.id} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                        <div>
                          <div className="font-medium">{guia.mesAno}</div>
                          <div className="text-sm text-gray-400">{guia.valor}</div>
                        </div>
                        <Badge className={getStatusBadge(guia.downloadStatus)}>
                          {guia.downloadStatus}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="clientes">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-green-400">Clientes MEI</CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Cliente
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-800 border-gray-700">
                      <DialogHeader>
                        <DialogTitle className="text-green-400">
                          {editingClient ? 'Editar Cliente' : 'Novo Cliente MEI'}
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={clienteForm.handleSubmit(handleClienteSubmit)} className="space-y-4">
                        <div>
                          <Label htmlFor="nome">Nome</Label>
                          <Input
                            id="nome"
                            {...clienteForm.register('nome')}
                            className="bg-gray-700 border-gray-600"
                          />
                          {clienteForm.formState.errors.nome && (
                            <span className="text-red-400 text-sm">{clienteForm.formState.errors.nome.message}</span>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="cnpj">CNPJ</Label>
                          <Input
                            id="cnpj"
                            {...clienteForm.register('cnpj')}
                            className="bg-gray-700 border-gray-600"
                          />
                          {clienteForm.formState.errors.cnpj && (
                            <span className="text-red-400 text-sm">{clienteForm.formState.errors.cnpj.message}</span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="telefone">Telefone</Label>
                            <Input
                              id="telefone"
                              {...clienteForm.register('telefone')}
                              className="bg-gray-700 border-gray-600"
                            />
                          </div>
                          <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              {...clienteForm.register('email')}
                              className="bg-gray-700 border-gray-600"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="dataEnvio">Dia do Envio</Label>
                            <Input
                              id="dataEnvio"
                              type="number"
                              min="1"
                              max="31"
                              {...clienteForm.register('dataEnvio', { valueAsNumber: true })}
                              className="bg-gray-700 border-gray-600"
                            />
                          </div>
                          <div>
                            <Label htmlFor="dataVencimento">Dia do Vencimento</Label>
                            <Input
                              id="dataVencimento"
                              type="number"
                              min="1"
                              max="31"
                              {...clienteForm.register('dataVencimento', { valueAsNumber: true })}
                              className="bg-gray-700 border-gray-600"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="observacoes">Observações</Label>
                          <Textarea
                            id="observacoes"
                            {...clienteForm.register('observacoes')}
                            className="bg-gray-700 border-gray-600"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="isActive"
                            checked={clienteForm.watch('isActive')}
                            onCheckedChange={(checked) => clienteForm.setValue('isActive', checked)}
                          />
                          <Label htmlFor="isActive">Cliente Ativo</Label>
                        </div>

                        <Button
                          type="submit"
                          disabled={createClienteMutation.isPending || updateClienteMutation.isPending}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          {editingClient ? 'Atualizar' : 'Criar'} Cliente
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Envio</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientes.map((cliente: any) => (
                      <TableRow key={cliente.id}>
                        <TableCell className="font-medium">{cliente.nome}</TableCell>
                        <TableCell>{cliente.cnpj}</TableCell>
                        <TableCell>{cliente.telefone}</TableCell>
                        <TableCell>{cliente.email}</TableCell>
                        <TableCell>Dia {cliente.dataEnvio}</TableCell>
                        <TableCell>Dia {cliente.dataVencimento}</TableCell>
                        <TableCell>
                          <Badge className={cliente.isActive ? 'bg-green-500' : 'bg-red-500'}>
                            {cliente.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingClient(cliente);
                                clienteForm.reset(cliente);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteClienteMutation.mutate(cliente.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
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

          <TabsContent value="configuracoes">
            <div className="space-y-6">
              {/* Configuração de Provedores de API */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-green-400">Provedores de API</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label className="text-gray-300">Provedor Atual:</Label>
                        <p className="text-white font-medium">{status?.dasProvider?.name || 'Nenhum'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${status?.dasProvider?.configured ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className={status?.dasProvider?.configured ? 'text-green-400' : 'text-red-400'}>
                          {status?.dasProvider?.configured ? 'Configurado' : 'Não configurado'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-600 pt-4">
                      <h4 className="text-white font-medium mb-3">Configurar InfoSimples</h4>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-gray-300">Token da API:</Label>
                          <Input
                            type="password"
                            placeholder="Digite o token da InfoSimples..."
                            value={apiConfig.infosimples.token}
                            onChange={(e) => setApiConfig({
                              ...apiConfig,
                              infosimples: { ...apiConfig.infosimples, token: e.target.value }
                            })}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => testProvider('infosimples')}
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                            disabled={!apiConfig.infosimples.token || testProviderMutation.isPending}
                          >
                            {testProviderMutation.isPending ? 'Testando...' : 'Testar Conexão'}
                          </Button>
                          <Button 
                            onClick={() => configureProvider('infosimples')}
                            className="bg-green-600 hover:bg-green-700"
                            disabled={!apiConfig.infosimples.token || configureProviderMutation.isPending}
                          >
                            {configureProviderMutation.isPending ? 'Configurando...' : 'Configurar'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-600 pt-4">
                      <h4 className="text-white font-medium mb-3">Outros Provedores</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-700 rounded-lg">
                          <h5 className="text-white font-medium">Receita Federal</h5>
                          <p className="text-gray-400 text-sm">Integração direta com APIs da Receita Federal</p>
                          <Button 
                            variant="outline" 
                            disabled
                            className="mt-2 border-gray-600 text-gray-500"
                          >
                            Em breve
                          </Button>
                        </div>
                        <div className="p-3 bg-gray-700 rounded-lg">
                          <h5 className="text-white font-medium">SERPRO</h5>
                          <p className="text-gray-400 text-sm">Integração com APIs do SERPRO</p>
                          <Button 
                            variant="outline" 
                            disabled
                            className="mt-2 border-gray-600 text-gray-500"
                          >
                            Em breve
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Configurações de Envio */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-green-400">Configurações de Envio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="w-5 h-5 text-blue-400" />
                          <h4 className="text-white font-medium">Email</h4>
                          <div className={`w-3 h-3 rounded-full ${status?.email?.configured ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        </div>
                        <p className="text-gray-300 text-sm mb-3">Envio automático de guias DAS via email</p>
                        <Button 
                          variant="outline" 
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          Configurar Email
                        </Button>
                      </div>
                      
                      <div className="p-4 bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="w-5 h-5 text-green-400" />
                          <h4 className="text-white font-medium">WhatsApp</h4>
                          <div className={`w-3 h-3 rounded-full ${status?.whatsapp?.configured ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        </div>
                        <p className="text-gray-300 text-sm mb-3">Notificações via WhatsApp</p>
                        <Button 
                          variant="outline" 
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          Configurar WhatsApp
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Configurações de API - Tabela existente */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-green-400">Configurações de API</CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Configuração
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-800 border-gray-700">
                      <DialogHeader>
                        <DialogTitle className="text-green-400">Nova Configuração de API</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={configForm.handleSubmit(handleConfigSubmit)} className="space-y-4">
                        <div>
                          <Label htmlFor="configName">Nome</Label>
                          <Input
                            id="configName"
                            {...configForm.register('name')}
                            className="bg-gray-700 border-gray-600"
                          />
                        </div>

                        <div>
                          <Label htmlFor="configType">Tipo</Label>
                          <Select
                            value={configForm.watch('type')}
                            onValueChange={(value) => configForm.setValue('type', value as any)}
                          >
                            <SelectTrigger className="bg-gray-700 border-gray-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="das_provider">Provedor DAS</SelectItem>
                              <SelectItem value="whatsapp">WhatsApp</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="documentation">Documentação (URL)</Label>
                          <Input
                            id="documentation"
                            {...configForm.register('documentation')}
                            className="bg-gray-700 border-gray-600"
                          />
                        </div>

                        <Button
                          type="submit"
                          disabled={createConfigMutation.isPending}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          Criar Configuração
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Último Uso</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {configuracoes.map((config: any) => (
                      <TableRow key={config.id}>
                        <TableCell className="font-medium">{config.name}</TableCell>
                        <TableCell>{config.type}</TableCell>
                        <TableCell>
                          <Badge className={config.isActive ? 'bg-green-500' : 'bg-gray-500'}>
                            {config.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {config.lastUsed ? 
                            format(new Date(config.lastUsed), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 
                            'Nunca'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => activateConfigMutation.mutate(config.id)}
                              disabled={config.isActive}
                            >
                              Ativar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            </div>
          </TabsContent>

          <TabsContent value="guias">
            {/* Filtros para Guias DAS-MEI */}
            <Card className="bg-gray-800 border-gray-700 mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros de Guias DAS-MEI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Label className="text-gray-300">Cliente:</Label>
                    <Input
                      placeholder="Buscar por cliente..."
                      value={guiasFilter.cliente}
                      onChange={(e) => setGuiasFilter({...guiasFilter, cliente: e.target.value})}
                      className="w-48 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label className="text-gray-300">Status:</Label>
                    <Select 
                      value={guiasFilter.status} 
                      onValueChange={(value) => setGuiasFilter({...guiasFilter, status: value})}
                    >
                      <SelectTrigger className="w-40 bg-gray-700 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="downloaded">Baixado</SelectItem>
                        <SelectItem value="error">Erro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label className="text-gray-300">Data inicial:</Label>
                    <Input
                      type="date"
                      value={guiasFilter.startDate}
                      onChange={(e) => setGuiasFilter({...guiasFilter, startDate: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label className="text-gray-300">Data final:</Label>
                    <Input
                      type="date"
                      value={guiasFilter.endDate}
                      onChange={(e) => setGuiasFilter({...guiasFilter, endDate: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  
                  <Button 
                    onClick={() => setGuiasFilter({status: 'todos', cliente: '', startDate: '', endDate: ''})}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Tabela de Guias DAS-MEI */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-green-400">Guias DAS-MEI</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Mês/Ano</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGuias.map((guia: any) => (
                      <TableRow key={guia.id}>
                        <TableCell className="font-medium">
                          {guia.cliente_nome || 'Cliente não identificado'}
                        </TableCell>
                        <TableCell>{guia.mes_ano}</TableCell>
                        <TableCell>
                          {guia.data_vencimento ? format(new Date(guia.data_vencimento), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                        </TableCell>
                        <TableCell>{guia.valor || '-'}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(guia.download_status)}>
                            {guia.download_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" title="Visualizar">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" title="Baixar">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredGuias.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                          Nenhuma guia encontrada com os filtros aplicados
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            {/* Filtros para Logs */}
            <Card className="bg-gray-800 border-gray-700 mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros de Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Label className="text-gray-300">Tipo:</Label>
                    <Select 
                      value={logsFilter.tipo} 
                      onValueChange={(value) => setLogsFilter({...logsFilter, tipo: value})}
                    >
                      <SelectTrigger className="w-40 bg-gray-700 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label className="text-gray-300">Status:</Label>
                    <Select 
                      value={logsFilter.status} 
                      onValueChange={(value) => setLogsFilter({...logsFilter, status: value})}
                    >
                      <SelectTrigger className="w-40 bg-gray-700 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="success">Sucesso</SelectItem>
                        <SelectItem value="error">Erro</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label className="text-gray-300">Data inicial:</Label>
                    <Input
                      type="date"
                      value={logsFilter.startDate}
                      onChange={(e) => setLogsFilter({...logsFilter, startDate: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label className="text-gray-300">Data final:</Label>
                    <Input
                      type="date"
                      value={logsFilter.endDate}
                      onChange={(e) => setLogsFilter({...logsFilter, endDate: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  
                  <Button 
                    onClick={() => setLogsFilter({tipo: 'todos', status: 'todos', startDate: '', endDate: ''})}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-green-400">Logs de Envio</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Mensagem</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </TableCell>
                        <TableCell>{log.tipoEnvio}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(log.status)}>
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{log.mensagem}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Search, Eye, Users, Building2, Plus, MoreVertical, Copy, Phone, MessageCircle, Filter, X, Edit, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { BackToHomeButton } from '@/components/back-to-home-button';
import { useLocation, Link } from 'wouter';

// Definindo os tipos baseados no schema real
interface Cliente {
  id: number;
  razao_social: string | null;
  nome_fantasia: string | null;
  cnpj: string | null;
  email_empresa: string | null;
  telefone_empresa: string | null;
  contato: string | null;
  celular: string | null;
  status: string | null;
  created_at: string;
}

type DasStatusMap = Record<string, { disponivel: boolean; mesAno?: string; fileName?: string }>;

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [dasStatus, setDasStatus] = useState<DasStatusMap>({});
  const [, setLocation] = useLocation();
  
  // Estados para modal de adicionar tarefa
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDepartment, setTaskDepartment] = useState('DEPTO SOCIETARIO');
  
  // Estados para filtros avançados
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    cidade: '',
    regimeTributario: '',
    dataAberturaInicio: '',
    dataAberturaFim: '',
    clienteDesdeInicio: '',
    clienteDesdeFim: '',
    possuiFuncionarios: '',
    possuiProLabore: '',
    status: '' // Adicionado filtro de status
  });
  
  const [quickFilter, setQuickFilter] = useState(''); // Estado para filtro rápido

  // Função para buscar clientes
  const fetchClientes = async () => {
    try {
      setLoading(true);
      
      // Construir URL com filtros
      const params = new URLSearchParams();
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (filters.cidade) {
        params.append('cidade', filters.cidade);
      }
      
      if (filters.regimeTributario) {
        params.append('regimeTributario', filters.regimeTributario);
      }
      
      if (filters.dataAberturaInicio) {
        params.append('dataAberturaInicio', filters.dataAberturaInicio);
      }
      
      if (filters.dataAberturaFim) {
        params.append('dataAberturaFim', filters.dataAberturaFim);
      }
      
      if (filters.clienteDesdeInicio) {
        params.append('clienteDesdeInicio', filters.clienteDesdeInicio);
      }
      
      if (filters.clienteDesdeFim) {
        params.append('clienteDesdeFim', filters.clienteDesdeFim);
      }
      
      if (filters.possuiFuncionarios) {
        params.append('possuiFuncionarios', filters.possuiFuncionarios);
      }
      
      if (filters.possuiProLabore) {
        params.append('possuiProLabore', filters.possuiProLabore);
      }
      
      if (filters.status) {
        params.append('status', filters.status);
      }
      
      // Usar quickFilter se definido, caso contrário usar filtro normal
      if (quickFilter) {
        params.append('status', quickFilter);
      }
      
      const url = `/api/clientes${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setClientes(data);
        // Buscar status DAS por CNPJ em lote, baseado apenas no banco (sem APIs externas)
        const cnpjs = (data || []).map((c: any) => c.cnpj).filter((v: any) => !!v);
        if (cnpjs.length > 0) {
          try {
            console.log('🔍 Buscando status DAS para CNPJs:', cnpjs);
            // calcular mesAnterior (YYYY-MM)
            const now = new Date();
            const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
            const month = now.getMonth() === 0 ? 12 : now.getMonth();
            const mesAno = `${year}-${String(month).padStart(2, '0')}`;

            const statusResp = await fetch('/api/dasmei/status-db', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ cnpjs, mesAno })
            });
            
            if (statusResp.ok) {
              const statusData = await statusResp.json();
              console.log('✅ Status DAS recebido:', statusData);
              setDasStatus(statusData);
            } else {
              console.error('❌ Erro ao buscar status DAS:', statusResp.status, statusResp.statusText);
              setDasStatus({});
            }
          } catch (e) {
            console.error('❌ Erro na requisição de status DAS:', e);
            setDasStatus({});
          }
        } else {
          setDasStatus({});
        }
      } else {
        console.error('Erro ao buscar clientes');
        setClientes([]);
        setDasStatus({});
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  // Buscar clientes ao carregar e quando searchTerm ou filtros mudarem
  useEffect(() => {
    fetchClientes();
  }, [searchTerm, filters, quickFilter]);

  // Função para alternar status: ativo -> bloqueado -> inativo -> baixado -> ativo
  const toggleClienteStatus = async (id: number, currentStatus: string | null) => {
    try {
      let newStatus;
      if (currentStatus === 'ativo') {
        newStatus = 'bloqueado';
      } else if (currentStatus === 'bloqueado') {
        newStatus = 'inativo';
      } else if (currentStatus === 'inativo') {
        newStatus = 'baixado';
      } else {
        newStatus = 'ativo';
      }
      
      const response = await fetch(`/api/clientes/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        fetchClientes(); // Recarregar lista
      } else {
        alert('Erro ao atualizar status do cliente');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status do cliente');
    }
  };

  // Função para ver detalhes completos
  const handleViewDetails = (cliente: Cliente) => {
    setLocation(`/clientes/${cliente.id}`);
  };

  // Função para copiar texto para a área de transferência
  const { toast } = useToast();
  
  const copyToClipboard = async (text: string | null, label: string) => {
    if (!text) {
      toast({
        title: "Erro",
        description: `${label} não disponível`,
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado!",
        description: `${label} copiado para a área de transferência`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: `Não foi possível copiar o ${label}`,
        variant: "destructive",
      });
    }
  };

  // Função para abrir WhatsApp
  const openWhatsApp = (celular: string | null) => {
    if (!celular) {
      toast({
        title: "Erro",
        description: "Número de celular não disponível",
        variant: "destructive",
      });
      return;
    }

    // Remove caracteres não numéricos
    const numeroLimpo = celular.replace(/\D/g, '');
    
    // Verifica se tem DDD (se começa com 55 para Brasil, ou adiciona)
    let numeroFormatado = numeroLimpo;
    if (!numeroFormatado.startsWith('55') && numeroFormatado.length >= 10) {
      numeroFormatado = '55' + numeroFormatado;
    }

    const whatsappUrl = `https://wa.me/${numeroFormatado}`;
    window.open(whatsappUrl, '_blank');
  };

  const clientesAtivos = clientes.filter(c => c.status === 'ativo').length;
  const clientesBloqueados = clientes.filter(c => c.status === 'bloqueado').length;
  const clientesInativos = clientes.filter(c => c.status === 'inativo').length;
  const clientesBaixados = clientes.filter(c => c.status === 'baixado').length;

  // Função para editar cliente
  const handleEditCliente = (cliente: Cliente) => {
    setLocation(`/clientes/${cliente.id}`);
  };

  // Função para adicionar tarefa
  const handleAddTask = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setShowAddTaskModal(true);
  };

  // Função para ver tarefas do cliente
  const handleViewTasks = (cliente: Cliente) => {
    // Redirecionar para página de controle de tarefas com filtro específico do cliente
    setLocation(`/interno?cliente=${cliente.id}`);
  };

  // Função para fechar modal de adicionar tarefa
  const handleCloseAddTaskModal = () => {
    setShowAddTaskModal(false);
    setSelectedCliente(null);
    setTaskTitle('');
    setTaskDescription('');
    setTaskDepartment('DEPTO SOCIETARIO');
  };

  // Função para salvar tarefa
  const handleSaveTask = async () => {
    if (!selectedCliente || !taskTitle.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha pelo menos o título da tarefa.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Obter token do localStorage
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/clientes/${selectedCliente.id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: taskTitle.trim(),
          description: taskDescription.trim() || null,
          department: taskDepartment,
          status: 'pending',
          priority: 'medium',
          order: 1
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar tarefa');
      }

      toast({
        title: "Sucesso",
        description: `Tarefa adicionada para ${selectedCliente.razao_social || 'o cliente'}`,
      });

      handleCloseAddTaskModal();
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar tarefa. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Função para deletar cliente
  const handleDeleteCliente = async (cliente: Cliente) => {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja deletar o cliente "${cliente.razao_social || 'Sem nome'}"? Esta ação não pode ser desfeita.`
    );
    
    if (!confirmDelete) return;

    try {
      const response = await fetch(`/api/clientes/${cliente.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast({
          title: "Cliente deletado",
          description: "Cliente foi removido com sucesso",
        });
        fetchClientes(); // Recarregar lista
      } else {
        throw new Error('Erro ao deletar cliente');
      }
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível deletar o cliente",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <header style={{ 
        background: '#1a1a1a', 
        borderBottom: '1px solid #333'
      }}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">
            Gerenciamento de Clientes
          </h1>
          <BackToHomeButton />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Header com estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total</p>
                  <p className="text-xl font-bold text-white">{clientes.length}</p>
                </div>
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Ativos</p>
                  <p className="text-xl font-bold text-green-500">{clientesAtivos}</p>
                </div>
                <Building2 className="h-6 w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Bloqueados</p>
                  <p className="text-xl font-bold text-red-500">{clientesBloqueados}</p>
                </div>
                <Building2 className="h-6 w-6 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Inativos</p>
                  <p className="text-xl font-bold text-gray-500">{clientesInativos}</p>
                </div>
                <Building2 className="h-6 w-6 text-gray-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Baixados</p>
                  <p className="text-xl font-bold text-orange-500">{clientesBaixados}</p>
                </div>
                <Building2 className="h-6 w-6 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controles */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar clientes por nome, CNPJ, email ou contato..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button
            onClick={() => setLocation('/novo-cliente')}
            style={{ 
              backgroundColor: '#22c55e', 
              color: 'white',
              border: '1px solid #22c55e'
            }}
            className="hover:bg-green-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>

        {/* Filtros Rápidos por Status */}
        <Card style={{ background: '#1f2937', border: '1px solid #374151' }} className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-300">Filtro Rápido por Status</h3>
              {quickFilter && (
                <Button
                  onClick={() => setQuickFilter('')}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white h-6 px-2"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpar
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setQuickFilter('')}
                variant={quickFilter === '' ? 'default' : 'outline'}
                size="sm"
                className={`${
                  quickFilter === ''
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Users className="h-4 w-4 mr-1" />
                Todos
              </Button>
              
              <Button
                onClick={() => setQuickFilter('ativo')}
                variant={quickFilter === 'ativo' ? 'default' : 'outline'}
                size="sm"
                className={`${
                  quickFilter === 'ativo'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <div className="h-2 w-2 rounded-full bg-green-400 mr-2"></div>
                Ativos
              </Button>
              
              <Button
                onClick={() => setQuickFilter('bloqueado')}
                variant={quickFilter === 'bloqueado' ? 'default' : 'outline'}
                size="sm"
                className={`${
                  quickFilter === 'bloqueado'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <div className="h-2 w-2 rounded-full bg-red-400 mr-2"></div>
                Bloqueados
              </Button>
              
              <Button
                onClick={() => setQuickFilter('inativo')}
                variant={quickFilter === 'inativo' ? 'default' : 'outline'}
                size="sm"
                className={`${
                  quickFilter === 'inativo'
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    : 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <div className="h-2 w-2 rounded-full bg-yellow-400 mr-2"></div>
                Inativos
              </Button>
              
              <Button
                onClick={() => setQuickFilter('baixado')}
                variant={quickFilter === 'baixado' ? 'default' : 'outline'}
                size="sm"
                className={`${
                  quickFilter === 'baixado'
                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                    : 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <div className="h-2 w-2 rounded-full bg-gray-400 mr-2"></div>
                Baixados
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filtros Avançados */}
        {showFilters && (
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }} className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Filtros Avançados</h3>
                <Button
                  onClick={() => {
                    setFilters({
                      cidade: '',
                      regimeTributario: '',
                      dataAberturaInicio: '',
                      dataAberturaFim: '',
                      clienteDesdeInicio: '',
                      clienteDesdeFim: '',
                      possuiFuncionarios: '',
                      possuiProLabore: '',
                      status: ''
                    });
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Filtro por Cidade */}
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Cidade</label>
                  <Input
                    placeholder="Ex: Itajaí"
                    value={filters.cidade}
                    onChange={(e) => setFilters(prev => ({ ...prev, cidade: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>

                {/* Filtro por Regime Tributário */}
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Regime Tributário</label>
                  <Select
                    value={filters.regimeTributario}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, regimeTributario: value }))}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Selecione o regime" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="SIMPLES">Simples Nacional</SelectItem>
                      <SelectItem value="LUCRO_REAL">Lucro Real</SelectItem>
                      <SelectItem value="LUCRO_PRESUMIDO">Lucro Presumido</SelectItem>
                      <SelectItem value="MEI">MEI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Data de Abertura - Início */}
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Data Abertura (De)</label>
                  <Input
                    type="date"
                    value={filters.dataAberturaInicio}
                    onChange={(e) => setFilters(prev => ({ ...prev, dataAberturaInicio: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                {/* Data de Abertura - Fim */}
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Data Abertura (Até)</label>
                  <Input
                    type="date"
                    value={filters.dataAberturaFim}
                    onChange={(e) => setFilters(prev => ({ ...prev, dataAberturaFim: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                {/* Cliente Desde - Início */}
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Cliente Desde (De)</label>
                  <Input
                    type="date"
                    value={filters.clienteDesdeInicio}
                    onChange={(e) => setFilters(prev => ({ ...prev, clienteDesdeInicio: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                {/* Cliente Desde - Fim */}
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Cliente Desde (Até)</label>
                  <Input
                    type="date"
                    value={filters.clienteDesdeFim}
                    onChange={(e) => setFilters(prev => ({ ...prev, clienteDesdeFim: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                {/* Filtro por Funcionários */}
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Possui Funcionários</label>
                  <Select
                    value={filters.possuiFuncionarios}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, possuiFuncionarios: value }))}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="true">Sim</SelectItem>
                      <SelectItem value="false">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Pró-labore */}
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Possui Pró-labore</label>
                  <Select
                    value={filters.possuiProLabore}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, possuiProLabore: value }))}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="true">Sim</SelectItem>
                      <SelectItem value="false">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contador de resultados */}
        {!loading && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold text-white">Resultados</h3>
              <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                {clientes.length} {clientes.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}
              </div>
            </div>
            {(searchTerm || quickFilter || Object.values(filters).some(value => value !== '')) && (
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setQuickFilter('');
                  setFilters({
                    cidade: '',
                    regimeTributario: '',
                    dataAberturaInicio: '',
                    dataAberturaFim: '',
                    clienteDesdeInicio: '',
                    clienteDesdeFim: '',
                    possuiFuncionarios: '',
                    possuiProLabore: '',
                    status: ''
                  });
                }}
                variant="outline"
                size="sm"
                className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
              >
                <X className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            )}
          </div>
        )}

        {/* Lista simplificada de clientes */}
        {loading ? (
          <div className="text-center py-8">
            <p className="text-white">Carregando clientes...</p>
          </div>
        ) : clientes.length === 0 ? (
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <CardContent className="text-center py-8">
              <p className="text-gray-400">Nenhum cliente encontrado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {/* Cabeçalho da tabela */}
            <div className="grid grid-cols-12 gap-4 p-4 text-sm font-medium text-gray-400 border-b border-gray-600">
              <div className="col-span-3">Nome do Cliente</div>
              <div className="col-span-2">CNPJ</div>
              <div className="col-span-1">Contato</div>
              <div className="col-span-2">Celular</div>
              <div className="col-span-1 text-center">DAS Disponível?</div>
              <div className="col-span-1 text-center">Status</div>
              <div className="col-span-2">Ações</div>
            </div>

            {/* Linhas de clientes */}
            {clientes.map((cliente) => (
              <Card 
                key={cliente.id} 
                style={{ background: '#1f2937', border: '1px solid #374151' }}
                className="hover:border-green-500 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Nome do Cliente */}
                    <div className="col-span-3">
                      <Link href={`/clientes/${cliente.id}`}>
                        <div className="text-white font-medium hover:text-green-400 cursor-pointer transition-colors underline decoration-transparent hover:decoration-green-400">
                          {cliente.razao_social || 'Sem nome'}
                        </div>
                      </Link>
                      <div className="text-sm text-gray-400">
                        {cliente.nome_fantasia || 'N/A'}
                      </div>
                    </div>

                    {/* CNPJ */}
                    <div className="col-span-2 text-sm text-gray-300">
                      {cliente.cnpj || 'N/A'}
                    </div>

                    {/* Contato */}
                    <div className="col-span-1 text-sm text-gray-300">
                      {cliente.contato || 'N/A'}
                    </div>
                    {/* DAS Disponível? */}
                    <div className="col-span-1 flex justify-center">
                      {(() => {
                        const cnpj = cliente.cnpj || '';
                        const status = dasStatus[cnpj];
                        const ok = status?.disponivel;
                        return (
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-3 w-3 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`}
                              title={ok ? 'Guia com PDF salva' : 'Sem PDF salvo'}
                            />
                          </div>
                        );
                      })()}
                    </div>

                    {/* Celular */}
                    <div className="col-span-2 text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        <span>{cliente.celular || 'N/A'}</span>
                        {cliente.celular && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => copyToClipboard(cliente.celular, 'Celular')}
                              className="p-1 rounded hover:bg-gray-600 transition-colors"
                              title="Copiar celular"
                            >
                              <Copy className="h-3 w-3 text-gray-400 hover:text-white" />
                            </button>
                            <button
                              onClick={() => openWhatsApp(cliente.celular)}
                              className="p-1 rounded hover:bg-gray-600 transition-colors"
                              title="Abrir WhatsApp"
                            >
                              <MessageCircle className="h-3 w-3 text-green-400 hover:text-green-300" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-1 flex justify-center items-center pr-4">
                      <button
                        data-status={cliente.status || 'inativo'}
                        onClick={() => toggleClienteStatus(cliente.id, cliente.status)}
                        style={{
                          padding: '4px 12px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          border: 'none',
                          minWidth: '85px',
                          outline: 'none',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          textAlign: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {cliente.status === 'ativo' ? 'ATIVO' : 
                         cliente.status === 'bloqueado' ? 'BLOQUEADO' : 
                         cliente.status === 'inativo' ? 'INATIVO' : 
                         cliente.status === 'baixado' ? 'BAIXADO' : 'N/A'}
                      </button>
                    </div>

                    {/* Ações */}
                    <div className="col-span-2 flex gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-600 text-white hover:bg-gray-700"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          className="bg-gray-800 border-gray-600" 
                          align="end"
                        >
                          <DropdownMenuItem 
                            onClick={() => handleViewDetails(cliente)}
                            className="text-white hover:bg-gray-700 cursor-pointer"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => handleEditCliente(cliente)}
                            className="text-blue-400 hover:bg-gray-700 cursor-pointer"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar Cliente
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => handleAddTask(cliente)}
                            className="text-yellow-400 hover:bg-gray-700 cursor-pointer"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Adicionar Tarefa
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => handleViewTasks(cliente)}
                            className="text-purple-400 hover:bg-gray-700 cursor-pointer"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Tarefas
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => copyToClipboard(cliente.cnpj, 'CNPJ')}
                            className="text-white hover:bg-gray-700 cursor-pointer"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar CNPJ
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => copyToClipboard(cliente.celular, 'Celular')}
                            className="text-white hover:bg-gray-700 cursor-pointer"
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Copiar Celular
                          </DropdownMenuItem>
                          
                          {cliente.celular && (
                            <DropdownMenuItem 
                              onClick={() => openWhatsApp(cliente.celular)}
                              className="text-green-400 hover:bg-gray-700 cursor-pointer"
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              WhatsApp
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem 
                            onClick={() => handleDeleteCliente(cliente)}
                            className="text-red-400 hover:bg-gray-700 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Deletar Cliente
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Modal para adicionar tarefa */}
      <Dialog open={showAddTaskModal} onOpenChange={setShowAddTaskModal}>
        <DialogContent className="bg-gray-800 border-gray-600 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-white">
              Adicionar Tarefa para {selectedCliente?.razao_social || 'Cliente'}
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Crie uma nova tarefa que será enviada para o sistema de tarefas.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="task-title" className="text-white">
                Título da Tarefa *
              </Label>
              <Input
                id="task-title"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Ex: Abertura de empresa, Alteração contratual..."
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="task-description" className="text-white">
                Descrição (opcional)
              </Label>
              <Textarea
                id="task-description"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Detalhes sobre a tarefa..."
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 min-h-[100px]"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="task-department" className="text-white">
                Departamento
              </Label>
              <Select value={taskDepartment} onValueChange={setTaskDepartment}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="DEPTO SOCIETARIO">DEPTO SOCIETARIO</SelectItem>
                  <SelectItem value="DEPTO FISCAL">DEPTO FISCAL</SelectItem>
                  <SelectItem value="DEPTO CONTABIL">DEPTO CONTABIL</SelectItem>
                  <SelectItem value="DEPTO PESSOAL">DEPTO PESSOAL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleCloseAddTaskModal}
              className="border-gray-600 text-white hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveTask}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Criar Tarefa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
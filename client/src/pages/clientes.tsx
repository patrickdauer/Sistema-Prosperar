import React, { useState, useEffect } from 'react';
import { Search, Eye, Users, Building2, Plus, ToggleLeft, ToggleRight, MoreVertical, Copy, Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { BackToHomeButton } from '@/components/back-to-home-button';
import { useLocation } from 'wouter';

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

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  // Função para buscar clientes
  const fetchClientes = async () => {
    try {
      setLoading(true);
      const url = searchTerm 
        ? `/api/clientes?search=${encodeURIComponent(searchTerm)}`
        : '/api/clientes';
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setClientes(data);
      } else {
        console.error('Erro ao buscar clientes');
        setClientes([]);
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  // Buscar clientes ao carregar e quando searchTerm mudar
  useEffect(() => {
    fetchClientes();
  }, [searchTerm]);

  // Função para alternar status ativo/inativo
  const toggleClienteStatus = async (id: number, currentStatus: string | null) => {
    try {
      const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';
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
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total de Clientes</p>
                  <p className="text-2xl font-bold text-white">{clientes.length}</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Clientes Ativos</p>
                  <p className="text-2xl font-bold text-white">{clientesAtivos}</p>
                </div>
                <Building2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Taxa de Retenção</p>
                  <p className="text-2xl font-bold text-white">95%</p>
                </div>
                <Building2 className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controles */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar clientes por nome, CNPJ ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
          <Button
            onClick={() => setLocation('/business-registration')}
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
              <div className="col-span-2">Contato</div>
              <div className="col-span-2">Celular</div>
              <div className="col-span-1">Status</div>
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
                      <div className="text-white font-medium">
                        {cliente.razao_social || 'Sem nome'}
                      </div>
                      <div className="text-sm text-gray-400">
                        {cliente.nome_fantasia || 'N/A'}
                      </div>
                    </div>

                    {/* CNPJ */}
                    <div className="col-span-2 text-sm text-gray-300">
                      {cliente.cnpj || 'N/A'}
                    </div>

                    {/* Contato */}
                    <div className="col-span-2 text-sm text-gray-300">
                      {cliente.contato || 'N/A'}
                    </div>

                    {/* Celular */}
                    <div className="col-span-2 text-sm text-gray-300">
                      {cliente.celular || 'N/A'}
                    </div>

                    {/* Status Ativo/Inativo */}
                    <div className="col-span-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleClienteStatus(cliente.id, cliente.status)}
                        className="p-1 hover:bg-gray-700"
                      >
                        {cliente.status === 'ativo' ? (
                          <ToggleRight className="h-6 w-6 text-green-500" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-red-500" />
                        )}
                      </Button>
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
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Building2, Plus, Search, Edit, Trash2, Eye, Users, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BackToHomeButton } from '@/components/back-to-home-button';

// Definindo os tipos localmente para simplificar
interface Cliente {
  id: number;
  razaoSocial: string | null;
  nomeFantasia: string | null;
  cnpj: string | null;
  email: string | null;
  telefoneComercial: string | null;
  endereco: string | null;
  status: string | null;
  atividadePrincipal: string | null;
  atividadesSecundarias: string | null;
  socios: any;
  site: string | null;
  createdAt: string | null;
}

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Função para deletar cliente
  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja deletar este cliente?')) {
      try {
        const response = await fetch(`/api/clientes/${id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          fetchClientes(); // Recarregar lista
        } else {
          alert('Erro ao deletar cliente');
        }
      } catch (error) {
        console.error('Erro ao deletar cliente:', error);
        alert('Erro ao deletar cliente');
      }
    }
  };

  const handleView = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setShowDetails(true);
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'ativo': return 'bg-green-500';
      case 'inativo': return 'bg-red-500';
      case 'suspenso': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const clientesAtivos = clientes.filter(c => c.status === 'ativo').length;
  const clientesNovos = clientes.filter(c => {
    if (!c.createdAt) return false;
    const created = new Date(c.createdAt);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

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
        <div className="grid md:grid-cols-4 gap-6 mb-8">
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
                  <p className="text-sm text-gray-400">Novos Este Mês</p>
                  <p className="text-2xl font-bold text-white">{clientesNovos}</p>
                </div>
                <Plus className="h-8 w-8 text-orange-500" />
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
                <Users className="h-8 w-8 text-green-500" />
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
            onClick={() => window.location.href = '/business-registration'}
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

        {/* Lista de clientes */}
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
          <div className="grid gap-4">
            {clientes.map((cliente) => (
              <Card 
                key={cliente.id} 
                style={{ background: '#1f2937', border: '1px solid #374151' }}
                className="hover:border-green-500 transition-colors"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {cliente.razaoSocial || 'Sem nome'}
                        </h3>
                        <Badge className={`${getStatusColor(cliente.status)} text-white`}>
                          {cliente.status || 'ativo'}
                        </Badge>
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-300">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-orange-500" />
                          <span>{cliente.nomeFantasia || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-orange-500" />
                          <span>{cliente.telefoneComercial || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-orange-500" />
                          <span>{cliente.email || 'N/A'}</span>
                        </div>
                      </div>
                      
                      {cliente.endereco && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                          <MapPin className="h-4 w-4 text-orange-500" />
                          <span>{cliente.endereco}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(cliente)}
                        className="border-gray-600 text-white hover:bg-gray-700"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/clientes/${cliente.id}/edit`}
                        className="border-gray-600 text-white hover:bg-gray-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(cliente.id)}
                        className="border-red-600 text-red-400 hover:bg-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de detalhes */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-gray-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-green-500">
                Detalhes do Cliente
              </DialogTitle>
            </DialogHeader>
            
            {selectedCliente && (
              <div className="space-y-6">
                {/* Informações básicas */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold text-green-500 mb-3">Informações da Empresa</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-400">Razão Social:</span> {selectedCliente.razaoSocial || 'N/A'}</p>
                      <p><span className="text-gray-400">Nome Fantasia:</span> {selectedCliente.nomeFantasia || 'N/A'}</p>
                      <p><span className="text-gray-400">CNPJ:</span> {selectedCliente.cnpj || 'N/A'}</p>
                      <p><span className="text-gray-400">Status:</span> 
                        <Badge className={`ml-2 ${getStatusColor(selectedCliente.status)} text-white`}>
                          {selectedCliente.status || 'ativo'}
                        </Badge>
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold text-green-500 mb-3">Contato</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-400">Email:</span> {selectedCliente.email || 'N/A'}</p>
                      <p><span className="text-gray-400">Telefone:</span> {selectedCliente.telefoneComercial || 'N/A'}</p>
                      <p><span className="text-gray-400">Site:</span> {selectedCliente.site || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Endereço */}
                {selectedCliente.endereco && (
                  <div>
                    <h4 className="text-lg font-semibold text-green-500 mb-3">Endereço</h4>
                    <p className="text-sm text-gray-300">{selectedCliente.endereco}</p>
                  </div>
                )}

                {/* Atividades */}
                {selectedCliente.atividadePrincipal && (
                  <div>
                    <h4 className="text-lg font-semibold text-green-500 mb-3">Atividades</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-400">Principal:</span> {selectedCliente.atividadePrincipal}</p>
                      {selectedCliente.atividadesSecundarias && (
                        <p><span className="text-gray-400">Secundárias:</span> {selectedCliente.atividadesSecundarias}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Sócios */}
                {selectedCliente.socios && Array.isArray(selectedCliente.socios) && selectedCliente.socios.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-green-500 mb-3">Sócios</h4>
                    <div className="space-y-3">
                      {selectedCliente.socios.map((socio: any, index: number) => (
                        <div key={index} className="bg-gray-700 p-3 rounded">
                          <p className="font-medium">{socio.nomeCompleto || 'Nome não informado'}</p>
                          <div className="text-sm text-gray-400 mt-1">
                            <p>CPF: {socio.cpf || 'N/A'}</p>
                            <p>Participação: {socio.participacao || 'N/A'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
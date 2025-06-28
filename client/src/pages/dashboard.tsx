import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Building, 
  Users, 
  Calendar, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Download,
  Eye,
  Search,
  Filter,
  CheckCircle,
  Clock,
  ArrowRight,
  AlertCircle,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ThemeToggle } from '@/components/theme-toggle';
import { BackToHomeButton } from '@/components/back-to-home-button';
import type { BusinessRegistration } from '@shared/schema';

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRegistration, setSelectedRegistration] = useState<BusinessRegistration | null>(null);
  const [editingRegistration, setEditingRegistration] = useState<BusinessRegistration | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: registrations, isLoading } = useQuery({
    queryKey: ['/api/business-registrations'],
    queryFn: async () => {
      const response = await fetch('/api/business-registrations');
      if (!response.ok) throw new Error('Failed to fetch registrations');
      return response.json() as Promise<BusinessRegistration[]>;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/api/business-registration/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-registrations'] });
    },
  });

  const deleteRegistrationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/business-registration/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete registration');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-registrations'] });
    },
  });

  const updateRegistrationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<BusinessRegistration> }) => {
      const response = await fetch(`/api/business-registration/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update registration');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-registrations'] });
      setEditingRegistration(null);
    },
  });

  const filteredRegistrations = registrations?.filter(reg => {
    const matchesSearch = reg.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reg.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const downloadPDF = async (id: number) => {
    try {
      const response = await fetch(`/api/business-registration/${id}/pdf`);
      if (!response.ok) throw new Error('Failed to generate PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `empresa-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  const updateStatus = (id: number, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const deleteRegistration = (id: number) => {
    if (window.confirm('Tem certeza que deseja deletar esta empresa? Esta ação não pode ser desfeita.')) {
      deleteRegistrationMutation.mutate(id);
    }
  };

  const updateRegistration = (id: number, data: Partial<BusinessRegistration>) => {
    updateRegistrationMutation.mutate({ id, data });
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'pending':
        return (
          <Badge 
            style={{ 
              background: '#dc2626', 
              color: '#ffffff',
              fontSize: '11px',
              padding: '4px 8px',
              height: '28px',
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            PENDENTE
          </Badge>
        );
      case 'processing':
        return (
          <Badge 
            style={{ 
              background: '#ca8a04', 
              color: '#ffffff',
              fontSize: '11px',
              padding: '4px 8px',
              height: '28px',
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            EM PROCESSAMENTO
          </Badge>
        );
      case 'completed':
        return (
          <Badge 
            style={{ 
              background: '#16a34a', 
              color: '#ffffff',
              fontSize: '11px',
              padding: '4px 8px',
              height: '28px',
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            CONCLUÍDO
          </Badge>
        );
      default:
        return (
          <Badge 
            style={{ 
              background: '#dc2626', 
              color: '#ffffff',
              fontSize: '11px',
              padding: '4px 8px',
              height: '28px',
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            PENDENTE
          </Badge>
        );
    }
  };

  if (selectedRegistration) {
    return <RegistrationDetails 
      registration={selectedRegistration} 
      onBack={() => setSelectedRegistration(null)}
      onDownloadPDF={() => downloadPDF(selectedRegistration.id)}
    />;
  }

  if (editingRegistration) {
    return <EditRegistrationForm 
      registration={editingRegistration}
      onSave={updateRegistration}
      onCancel={() => setEditingRegistration(null)}
      isLoading={updateRegistrationMutation.isPending}
    />;
  }

  if (showCreateForm) {
    return <CreateRegistrationForm 
      onSave={(data) => {
        // Redirecionar para o formulário público de cadastro
        window.open('/', '_blank');
        setShowCreateForm(false);
      }}
      onCancel={() => setShowCreateForm(false)}
    />;
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <header style={{ background: '#1a1a1a', borderBottom: '1px solid #333' }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#22c55e' }}>
                <Building className="text-lg" style={{ color: '#ffffff' }} />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: '#22c55e' }}>Dashboard Geral</h1>
                <p className="text-sm" style={{ color: '#888' }}>Prosperar Contabilidade</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowCreateForm(true)}
                style={{ background: '#22c55e', border: '1px solid #22c55e', color: '#ffffff' }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Nova Empresa
              </Button>
              <BackToHomeButton />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card style={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" style={{ color: '#22c55e' }}>Total de Solicitações</CardTitle>
              <Building className="h-4 w-4" style={{ color: '#ff8c42' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: '#ffffff' }}>{registrations?.length || 0}</div>
            </CardContent>
          </Card>

          <Card style={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" style={{ color: '#22c55e' }}>Pendentes</CardTitle>
              <FileText className="h-4 w-4" style={{ color: '#ff8c42' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: '#ffffff' }}>
                {registrations?.filter(r => r.status === 'pending' || !r.status).length || 0}
              </div>
            </CardContent>
          </Card>

          <Card style={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" style={{ color: '#22c55e' }}>Em Processamento</CardTitle>
              <Users className="h-4 w-4" style={{ color: '#ff8c42' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: '#ffffff' }}>
                {registrations?.filter(r => r.status === 'processing').length || 0}
              </div>
            </CardContent>
          </Card>

          <Card style={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" style={{ color: '#22c55e' }}>Concluídas</CardTitle>
              <Calendar className="h-4 w-4" style={{ color: '#ff8c42' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: '#ffffff' }}>
                {registrations?.filter(r => r.status === 'completed').length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6" style={{ background: '#1a1a1a', border: '1px solid #333' }}>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: '#ff8c42' }} />
                  <Input
                    placeholder="Buscar por razão social ou nome fantasia..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 placeholder:text-gray-400"
                    style={{ 
                      background: '#0a0a0a', 
                      border: '1px solid #333', 
                      color: '#ffffff'
                    }}
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48" style={{ background: '#0a0a0a', border: '1px solid #333', color: '#ffffff' }}>
                  <Filter className="h-4 w-4 mr-2" style={{ color: '#ff8c42' }} />
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent style={{ background: '#1a1a1a', border: '1px solid #333' }}>
                  <SelectItem value="all" style={{ color: '#ffffff' }}>Todos os Status</SelectItem>
                  <SelectItem value="pending" style={{ color: '#ffffff' }}>Pendente</SelectItem>
                  <SelectItem value="processing" style={{ color: '#ffffff' }}>Em Processamento</SelectItem>
                  <SelectItem value="completed" style={{ color: '#ffffff' }}>Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Registrations Table */}
        <Card style={{ background: '#1a1a1a', border: '1px solid #333' }}>
          <CardHeader style={{ borderBottom: '1px solid #333' }}>
            <CardTitle style={{ color: '#22c55e' }}>Solicitações de Abertura de Empresa</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div style={{ color: '#888' }}>Carregando...</div>
              </div>
            ) : filteredRegistrations.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div style={{ color: '#888' }}>Nenhuma solicitação encontrada</div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRegistrations.map((registration) => {
                  const socios = registration.socios as any[];
                  return (
                    <div key={registration.id} className="rounded-lg p-4 transition-colors" style={{ border: '1px solid #333', background: '#0a0a0a' }}>
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold" style={{ color: '#ffffff' }}>{registration.razaoSocial}</h3>
                            {getStatusBadge(registration.status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm" style={{ color: '#888' }}>
                            <span className="flex items-center gap-1">
                              <Building className="h-3 w-3" style={{ color: '#ff8c42' }} />
                              {registration.nomeFantasia}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" style={{ color: '#ff8c42' }} />
                              {socios.length} sócio{socios.length !== 1 ? 's' : ''}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" style={{ color: '#ff8c42' }} />
                              {registration.createdAt ? format(new Date(registration.createdAt), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm" style={{ color: '#888' }}>
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" style={{ color: '#ff8c42' }} />
                              {registration.emailEmpresa}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" style={{ color: '#ff8c42' }} />
                              {registration.telefoneEmpresa}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Status change buttons */}
                          <div className="flex items-center gap-1">
                            {/* Pendente button - show for processing and completed */}
                            {(registration.status === 'processing' || registration.status === 'completed') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateStatus(registration.id, 'pending')}
                                disabled={updateStatusMutation.isPending}
                                style={{ 
                                  background: '#dc2626', 
                                  border: '1px solid #dc2626', 
                                  color: '#ffffff',
                                  fontSize: '11px',
                                  padding: '4px 8px',
                                  height: '28px'
                                }}
                                title="Marcar como Pendente"
                              >
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Pendente
                              </Button>
                            )}
                            
                            {/* Em Processamento button - show for pending and completed */}
                            {(registration.status === 'pending' || !registration.status || registration.status === 'completed') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateStatus(registration.id, 'processing')}
                                disabled={updateStatusMutation.isPending}
                                style={{ 
                                  background: '#ca8a04', 
                                  border: '1px solid #ca8a04', 
                                  color: '#ffffff',
                                  fontSize: '11px',
                                  padding: '4px 8px',
                                  height: '28px'
                                }}
                                title="Marcar como Em Processamento"
                              >
                                <Clock className="h-3 w-3 mr-1" />
                                Processamento
                              </Button>
                            )}
                            
                            {/* Concluída button - show for pending and processing */}
                            {(registration.status === 'pending' || !registration.status || registration.status === 'processing') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateStatus(registration.id, 'completed')}
                                disabled={updateStatusMutation.isPending}
                                style={{ 
                                  background: '#16a34a', 
                                  border: '1px solid #16a34a', 
                                  color: '#ffffff',
                                  fontSize: '11px',
                                  padding: '4px 8px',
                                  height: '28px'
                                }}
                                title="Marcar como Concluída"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Concluída
                              </Button>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingRegistration(registration)}
                              style={{ background: '#3b82f6', border: '1px solid #3b82f6', color: '#ffffff' }}
                              title="Editar Empresa"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteRegistration(registration.id)}
                              disabled={deleteRegistrationMutation.isPending}
                              style={{ background: '#ef4444', border: '1px solid #ef4444', color: '#ffffff' }}
                              title="Deletar Empresa"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Deletar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedRegistration(registration)}
                              style={{ background: '#22c55e', border: '1px solid #22c55e', color: '#ffffff' }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver Detalhes
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadPDF(registration.id)}
                              style={{ background: '#ff8c42', border: '1px solid #ff8c42', color: '#ffffff' }}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              PDF
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function RegistrationDetails({ 
  registration, 
  onBack, 
  onDownloadPDF 
}: { 
  registration: BusinessRegistration; 
  onBack: () => void;
  onDownloadPDF: () => void;
}) {
  const socios = registration.socios as any[];
  
  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      <header style={{ background: '#1a1a1a', borderBottom: '1px solid #333' }}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Button variant="ghost" onClick={onBack} className="mb-2" style={{ color: '#22c55e' }}>
                ← Voltar para Dashboard
              </Button>
              <h1 className="text-xl font-bold" style={{ color: '#22c55e' }}>{registration.razaoSocial}</h1>
              <p className="text-sm" style={{ color: '#888' }}>Detalhes da Solicitação #{registration.id}</p>
            </div>
            <div className="flex items-center gap-2">
              {/* {getStatusBadge(registration.status)} */}
              <Button onClick={onDownloadPDF} style={{ background: '#ff8c42', border: '1px solid #ff8c42', color: '#ffffff' }}>
                <Download className="h-4 w-4 mr-2" />
                Baixar PDF
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Company Information */}
        <Card style={{ background: '#1a1a1a', border: '1px solid #333' }}>
          <CardHeader style={{ borderBottom: '1px solid #333' }}>
            <CardTitle className="flex items-center gap-2" style={{ color: '#22c55e' }}>
              <Building className="h-5 w-5" style={{ color: '#ff8c42' }} />
              Dados da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium" style={{ color: '#888' }}>Razão Social</label>
                <p style={{ color: '#ffffff' }}>{registration.razaoSocial}</p>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: '#888' }}>Nome Fantasia</label>
                <p style={{ color: '#ffffff' }}>{registration.nomeFantasia}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium" style={{ color: '#888' }}>Endereço</label>
                <p style={{ color: '#ffffff' }}>{registration.endereco}</p>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: '#888' }}>Telefone</label>
                <p style={{ color: '#ffffff' }}>{registration.telefoneEmpresa}</p>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: '#888' }}>E-mail</label>
                <p style={{ color: '#ffffff' }}>{registration.emailEmpresa}</p>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: '#888' }}>Capital Social</label>
                <p style={{ color: '#ffffff' }}>R$ {registration.capitalSocial}</p>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: '#888' }}>Metragem</label>
                <p style={{ color: '#ffffff' }}>{registration.metragem}m²</p>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: '#888' }}>CNPJ</label>
                <p style={{ color: '#ffffff' }}>{registration.cnpj || 'Não informado'}</p>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: '#888' }}>Inscrição Imobiliária</label>
                <p style={{ color: '#ffffff' }}>{registration.inscricaoImobiliaria || 'Não informado'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium" style={{ color: '#888' }}>Atividade Principal</label>
                <p style={{ color: '#ffffff' }}>{registration.atividadePrincipal}</p>
              </div>
              {registration.atividadesSecundarias && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium" style={{ color: '#888' }}>Atividades Secundárias</label>
                  <p style={{ color: '#ffffff' }}>{registration.atividadesSecundarias}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium" style={{ color: '#888' }}>Data de Cadastro</label>
                <p style={{ color: '#ffffff' }}>
                  {registration.createdAt ? format(new Date(registration.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: '#888' }}>Status</label>
                <div style={{ marginTop: '4px' }}>
                  {(() => {
                    switch (registration.status) {
                      case 'pending':
                        return <Badge variant="secondary" style={{ background: '#fbbf24', color: '#000' }}>Pendente</Badge>;
                      case 'processing':
                        return <Badge variant="default" style={{ background: '#3b82f6', color: '#fff' }}>Em Processamento</Badge>;
                      case 'completed':
                        return <Badge variant="destructive" style={{ background: '#10b981', color: '#fff' }}>Concluído</Badge>;
                      default:
                        return <Badge variant="outline" style={{ background: '#6b7280', color: '#fff' }}>Pendente</Badge>;
                    }
                  })()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Partners Information */}
        <Card style={{ background: '#1a1a1a', border: '1px solid #333' }}>
          <CardHeader style={{ borderBottom: '1px solid #333' }}>
            <CardTitle className="flex items-center gap-2" style={{ color: '#22c55e' }}>
              <Users className="h-5 w-5" style={{ color: '#ff8c42' }} />
              Sócios ({socios.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {socios.map((socio, index) => (
              <div key={index} className="rounded-lg p-4" style={{ border: '1px solid #333', background: '#0a0a0a' }}>
                <h4 className="font-semibold mb-3" style={{ color: '#22c55e' }}>Sócio {index + 1}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium" style={{ color: '#888' }}>Nome Completo</label>
                    <p style={{ color: '#ffffff' }}>{socio.nomeCompleto}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: '#888' }}>CPF</label>
                    <p style={{ color: '#ffffff' }}>{socio.cpf}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: '#888' }}>RG</label>
                    <p style={{ color: '#ffffff' }}>{socio.rg}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: '#888' }}>Data de Nascimento</label>
                    <p style={{ color: '#ffffff' }}>{socio.dataNascimento}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: '#888' }}>Estado Civil</label>
                    <p style={{ color: '#ffffff' }}>{socio.estadoCivil}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: '#888' }}>Nacionalidade</label>
                    <p style={{ color: '#ffffff' }}>{socio.nacionalidade}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: '#888' }}>Profissão</label>
                    <p style={{ color: '#ffffff' }}>{socio.profissao}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium" style={{ color: '#888' }}>Endereço Completo</label>
                    <p style={{ color: '#ffffff' }}>{socio.endereco}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: '#888' }}>Telefone</label>
                    <p style={{ color: '#ffffff' }}>{socio.telefonePessoal}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: '#888' }}>E-mail</label>
                    <p style={{ color: '#ffffff' }}>{socio.emailPessoal}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: '#888' }}>Participação (%)</label>
                    <p style={{ color: '#ffffff' }}>{socio.participacao}%</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: '#888' }}>Tipo de Participação</label>
                    <p style={{ color: '#ffffff' }}>{socio.tipoParticipacao}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Contact Information Summary */}
        <Card style={{ background: '#1a1a1a', border: '1px solid #333' }}>
          <CardHeader style={{ borderBottom: '1px solid #333' }}>
            <CardTitle className="flex items-center gap-2" style={{ color: '#22c55e' }}>
              <Phone className="h-5 w-5" style={{ color: '#ff8c42' }} />
              Resumo de Contatos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium" style={{ color: '#888' }}>Empresa</label>
                <div className="space-y-1">
                  <p style={{ color: '#ffffff' }}>📧 {registration.emailEmpresa}</p>
                  <p style={{ color: '#ffffff' }}>📞 {registration.telefoneEmpresa}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: '#888' }}>Sócios</label>
                <div className="space-y-1">
                  {socios.map((socio, index) => (
                    <div key={index} style={{ color: '#ffffff' }}>
                      <p className="text-sm">{socio.nomeCompleto}</p>
                      <p className="text-xs" style={{ color: '#888' }}>
                        📧 {socio.emailPessoal} | 📞 {socio.telefonePessoal}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
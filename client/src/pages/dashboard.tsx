import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ThemeToggle } from '@/components/theme-toggle';
import type { BusinessRegistration } from '@shared/schema';

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRegistration, setSelectedRegistration] = useState<BusinessRegistration | null>(null);

  const { data: registrations, isLoading } = useQuery({
    queryKey: ['/api/business-registrations'],
    queryFn: async () => {
      const response = await fetch('/api/business-registrations');
      if (!response.ok) throw new Error('Failed to fetch registrations');
      return response.json() as Promise<BusinessRegistration[]>;
    }
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

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'processing':
        return <Badge variant="default">Em Processamento</Badge>;
      case 'completed':
        return <Badge variant="destructive">Concluído</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  if (selectedRegistration) {
    return <RegistrationDetails 
      registration={selectedRegistration} 
      onBack={() => setSelectedRegistration(null)}
      onDownloadPDF={() => downloadPDF(selectedRegistration.id)}
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
            <ThemeToggle />
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
                        <div className="flex items-center gap-2">
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
              <div className="md:col-span-2">
                <label className="text-sm font-medium" style={{ color: '#888' }}>Atividade Principal</label>
                <p style={{ color: '#ffffff' }}>{registration.atividadePrincipal}</p>
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
                    <label className="text-sm font-medium text-muted-foreground">Estado Civil</label>
                    <p className="text-foreground">{socio.estadoCivil}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                    <p className="text-foreground">{socio.telefonePessoal}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">E-mail</label>
                    <p className="text-foreground">{socio.emailPessoal}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
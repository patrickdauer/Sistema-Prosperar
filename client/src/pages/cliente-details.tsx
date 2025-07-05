import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Save, X, Building2, User, Phone, Mail, FileText, Calendar, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

// Interface baseada na estrutura real da tabela
interface ClienteCompleto {
  id: number;
  razao_social: string | null;
  nome_fantasia: string | null;
  cnpj: string | null;
  inscricao_estadual: string | null;
  email_empresa: string | null;
  telefone_empresa: string | null;
  contato: string | null;
  celular: string | null;
  endereco: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
  // Campos adicionais da tabela real
  tipo_empresa: string | null;
  optante_simples: string | null;
  possui_mei: string | null;
  possui_certificado_digital: string | null;
  tem_dividas_fiscais: string | null;
  observacoes: string | null;
}

interface ClienteDetailsProps {
  params: { id: string };
}

export default function ClienteDetails({ params }: ClienteDetailsProps) {
  const [cliente, setCliente] = useState<ClienteCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<ClienteCompleto>>({});
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    fetchClienteDetails();
  }, [params.id]);

  const fetchClienteDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/clientes/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setCliente(data);
        setFormData(data);
      } else {
        toast({
          title: "Erro",
          description: "Cliente não encontrado",
          variant: "destructive",
        });
        setLocation('/clientes');
      }
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do cliente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/clientes/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedCliente = await response.json();
        setCliente(updatedCliente);
        setEditing(false);
        toast({
          title: "Sucesso",
          description: "Dados do cliente atualizados com sucesso",
        });
      } else {
        throw new Error('Erro ao salvar');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar alterações",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setFormData(cliente || {});
    setEditing(false);
  };

  const handleInputChange = (field: keyof ClienteCompleto, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <p className="text-white">Carregando dados do cliente...</p>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <p className="text-white">Cliente não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <header style={{ 
        background: '#1a1a1a', 
        borderBottom: '1px solid #333'
      }}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation('/clientes')}
              className="text-white hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold text-white">
              {cliente.razao_social || 'Cliente sem nome'}
            </h1>
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button
                  onClick={handleSave}
                  style={{ 
                    backgroundColor: '#22c55e', 
                    color: 'white'
                  }}
                  className="hover:bg-green-600"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="border-gray-600 text-white hover:bg-gray-700"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setEditing(true)}
                style={{ 
                  backgroundColor: '#ff8c42', 
                  color: 'white'
                }}
                className="hover:bg-orange-600"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Informações Básicas */}
        <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Building2 className="h-5 w-5 text-green-500" />
              Informações da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Razão Social</Label>
              {editing ? (
                <Input
                  value={formData.razao_social || ''}
                  onChange={(e) => handleInputChange('razao_social', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.razao_social || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Nome Fantasia</Label>
              {editing ? (
                <Input
                  value={formData.nome_fantasia || ''}
                  onChange={(e) => handleInputChange('nome_fantasia', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.nome_fantasia || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">CNPJ</Label>
              {editing ? (
                <Input
                  value={formData.cnpj || ''}
                  onChange={(e) => handleInputChange('cnpj', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.cnpj || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Inscrição Estadual</Label>
              {editing ? (
                <Input
                  value={formData.inscricao_estadual || ''}
                  onChange={(e) => handleInputChange('inscricao_estadual', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.inscricao_estadual || 'N/A'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <User className="h-5 w-5 text-green-500" />
              Informações de Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Pessoa de Contato</Label>
              {editing ? (
                <Input
                  value={formData.contato || ''}
                  onChange={(e) => handleInputChange('contato', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.contato || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Celular</Label>
              {editing ? (
                <Input
                  value={formData.celular || ''}
                  onChange={(e) => handleInputChange('celular', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.celular || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Email da Empresa</Label>
              {editing ? (
                <Input
                  value={formData.email_empresa || ''}
                  onChange={(e) => handleInputChange('email_empresa', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.email_empresa || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Telefone da Empresa</Label>
              {editing ? (
                <Input
                  value={formData.telefone_empresa || ''}
                  onChange={(e) => handleInputChange('telefone_empresa', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.telefone_empresa || 'N/A'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <MapPin className="h-5 w-5 text-green-500" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label className="text-gray-300">Endereço Completo</Label>
              {editing ? (
                <Textarea
                  value={formData.endereco || ''}
                  onChange={(e) => handleInputChange('endereco', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={3}
                />
              ) : (
                <p className="text-white py-2">{cliente.endereco || 'N/A'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informações Adicionais */}
        <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <FileText className="h-5 w-5 text-green-500" />
              Informações Adicionais
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Tipo de Empresa</Label>
              {editing ? (
                <Input
                  value={formData.tipo_empresa || ''}
                  onChange={(e) => handleInputChange('tipo_empresa', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.tipo_empresa || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Status</Label>
              <p className="text-white py-2">
                <span className={`px-2 py-1 rounded text-sm ${
                  cliente.status === 'ativo' ? 'bg-green-600' : 'bg-red-600'
                }`}>
                  {cliente.status === 'ativo' ? 'Ativo' : 'Inativo'}
                </span>
              </p>
            </div>
            <div className="col-span-2">
              <Label className="text-gray-300">Observações</Label>
              {editing ? (
                <Textarea
                  value={formData.observacoes || ''}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={4}
                />
              ) : (
                <p className="text-white py-2">{cliente.observacoes || 'Nenhuma observação'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Datas */}
        <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Calendar className="h-5 w-5 text-green-500" />
              Histórico
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Data de Cadastro</Label>
              <p className="text-white py-2">
                {cliente.created_at ? new Date(cliente.created_at).toLocaleDateString('pt-BR') : 'N/A'}
              </p>
            </div>
            <div>
              <Label className="text-gray-300">Última Atualização</Label>
              <p className="text-white py-2">
                {cliente.updated_at ? new Date(cliente.updated_at).toLocaleDateString('pt-BR') : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
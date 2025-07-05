import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Save, X, Building2, User, Phone, Mail, FileText, Calendar, MapPin, CreditCard, Users, DollarSign, Shield, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

// Interface baseada na estrutura COMPLETA da tabela + campos customizados
interface ClienteCompleto {
  id: number;
  // Informações básicas da empresa
  razaoSocial: string | null;
  nomeFantasia: string | null;
  cnpj: string | null;
  inscricaoEstadual: string | null;
  inscricaoMunicipal: string | null;
  
  // Endereço
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  bairro: string | null;
  complemento: string | null;
  
  // Contato
  telefoneComercial: string | null;
  telefoneAlternativo: string | null;
  email: string | null;
  emailAlternativo: string | null;
  site: string | null;
  
  // Informações fiscais
  regimeTributario: string | null;
  atividadePrincipal: string | null;
  atividadesSecundarias: string | null;
  capitalSocial: string | null;
  
  // Dados bancários
  banco: string | null;
  agencia: string | null;
  conta: string | null;
  tipoConta: string | null;
  
  // Informações do responsável
  responsavelNome: string | null;
  responsavelCpf: string | null;
  responsavelRg: string | null;
  responsavelTelefone: string | null;
  responsavelEmail: string | null;
  
  // Informações contratuais
  dataInicioContrato: string | null;
  dataFimContrato: string | null;
  valorMensalidade: string | null;
  diaVencimento: number | null;
  
  // Status e observações
  status: string | null;
  observacoes: string | null;
  
  // Sócios
  socios: any[] | null;
  
  // Metadados
  createdAt: string;
  updatedAt: string;
  
  // Informações adicionais
  certificadoDigital: boolean | null;
  eCommerce: boolean | null;
  funcionarios: number | null;
  
  // Serviços contratados
  contabilidade: boolean | null;
  departamentoPessoal: boolean | null;
  consultoriaFiscal: boolean | null;
  auditoria: boolean | null;
  aberturaMei: boolean | null;
  
  // Documentos
  documentos: any[] | null;
  
  // Origem do cliente
  origem: string | null;
  indicadoPor: string | null;
  
  // Para suportar campos customizados adicionais
  [key: string]: any;
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

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addCustomField = () => {
    const fieldName = prompt('Digite o nome do novo campo:');
    if (fieldName) {
      setFormData(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }
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
              {cliente.razaoSocial || 'Cliente sem nome'}
            </h1>
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button
                  onClick={addCustomField}
                  style={{ 
                    backgroundColor: '#3b82f6', 
                    color: 'white'
                  }}
                  className="hover:bg-blue-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Campo
                </Button>
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
        {/* Informações Básicas da Empresa */}
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
                  value={formData.razaoSocial || ''}
                  onChange={(e) => handleInputChange('razaoSocial', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.razaoSocial || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Nome Fantasia</Label>
              {editing ? (
                <Input
                  value={formData.nomeFantasia || ''}
                  onChange={(e) => handleInputChange('nomeFantasia', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.nomeFantasia || 'N/A'}</p>
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
                  value={formData.inscricaoEstadual || ''}
                  onChange={(e) => handleInputChange('inscricaoEstadual', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.inscricaoEstadual || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Inscrição Municipal</Label>
              {editing ? (
                <Input
                  value={formData.inscricaoMunicipal || ''}
                  onChange={(e) => handleInputChange('inscricaoMunicipal', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.inscricaoMunicipal || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Website</Label>
              {editing ? (
                <Input
                  value={formData.site || ''}
                  onChange={(e) => handleInputChange('site', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.site || 'N/A'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Endereço Completo */}
        <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <MapPin className="h-5 w-5 text-green-500" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="text-gray-300">Endereço</Label>
              {editing ? (
                <Textarea
                  value={formData.endereco || ''}
                  onChange={(e) => handleInputChange('endereco', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={2}
                />
              ) : (
                <p className="text-white py-2">{cliente.endereco || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Cidade</Label>
              {editing ? (
                <Input
                  value={formData.cidade || ''}
                  onChange={(e) => handleInputChange('cidade', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.cidade || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Estado</Label>
              {editing ? (
                <Input
                  value={formData.estado || ''}
                  onChange={(e) => handleInputChange('estado', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.estado || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">CEP</Label>
              {editing ? (
                <Input
                  value={formData.cep || ''}
                  onChange={(e) => handleInputChange('cep', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.cep || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Bairro</Label>
              {editing ? (
                <Input
                  value={formData.bairro || ''}
                  onChange={(e) => handleInputChange('bairro', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.bairro || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Complemento</Label>
              {editing ? (
                <Input
                  value={formData.complemento || ''}
                  onChange={(e) => handleInputChange('complemento', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.complemento || 'N/A'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informações de Contato */}
        <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Phone className="h-5 w-5 text-green-500" />
              Informações de Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Telefone Comercial</Label>
              {editing ? (
                <Input
                  value={formData.telefoneComercial || ''}
                  onChange={(e) => handleInputChange('telefoneComercial', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.telefoneComercial || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Telefone Alternativo</Label>
              {editing ? (
                <Input
                  value={formData.telefoneAlternativo || ''}
                  onChange={(e) => handleInputChange('telefoneAlternativo', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.telefoneAlternativo || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Email Principal</Label>
              {editing ? (
                <Input
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.email || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Email Alternativo</Label>
              {editing ? (
                <Input
                  value={formData.emailAlternativo || ''}
                  onChange={(e) => handleInputChange('emailAlternativo', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.emailAlternativo || 'N/A'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informações Fiscais */}
        <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <FileText className="h-5 w-5 text-green-500" />
              Informações Fiscais
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Regime Tributário</Label>
              {editing ? (
                <Select value={formData.regimeTributario || ''} onValueChange={(value) => handleInputChange('regimeTributario', value)}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Selecione o regime" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simples">Simples Nacional</SelectItem>
                    <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                    <SelectItem value="lucro_real">Lucro Real</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-white py-2">{cliente.regimeTributario || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Capital Social</Label>
              {editing ? (
                <Input
                  value={formData.capitalSocial || ''}
                  onChange={(e) => handleInputChange('capitalSocial', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="R$ 0,00"
                />
              ) : (
                <p className="text-white py-2">{cliente.capitalSocial || 'N/A'}</p>
              )}
            </div>
            <div className="col-span-2">
              <Label className="text-gray-300">Atividade Principal</Label>
              {editing ? (
                <Textarea
                  value={formData.atividadePrincipal || ''}
                  onChange={(e) => handleInputChange('atividadePrincipal', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={2}
                />
              ) : (
                <p className="text-white py-2">{cliente.atividadePrincipal || 'N/A'}</p>
              )}
            </div>
            <div className="col-span-2">
              <Label className="text-gray-300">Atividades Secundárias</Label>
              {editing ? (
                <Textarea
                  value={formData.atividadesSecundarias || ''}
                  onChange={(e) => handleInputChange('atividadesSecundarias', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={2}
                />
              ) : (
                <p className="text-white py-2">{cliente.atividadesSecundarias || 'N/A'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dados Bancários */}
        <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <CreditCard className="h-5 w-5 text-green-500" />
              Dados Bancários
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Banco</Label>
              {editing ? (
                <Input
                  value={formData.banco || ''}
                  onChange={(e) => handleInputChange('banco', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.banco || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Agência</Label>
              {editing ? (
                <Input
                  value={formData.agencia || ''}
                  onChange={(e) => handleInputChange('agencia', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.agencia || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Conta</Label>
              {editing ? (
                <Input
                  value={formData.conta || ''}
                  onChange={(e) => handleInputChange('conta', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.conta || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Tipo de Conta</Label>
              {editing ? (
                <Select value={formData.tipoConta || ''} onValueChange={(value) => handleInputChange('tipoConta', value)}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corrente">Corrente</SelectItem>
                    <SelectItem value="poupanca">Poupança</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-white py-2">{cliente.tipoConta || 'N/A'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informações do Responsável */}
        <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <User className="h-5 w-5 text-green-500" />
              Informações do Responsável
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Nome do Responsável</Label>
              {editing ? (
                <Input
                  value={formData.responsavelNome || ''}
                  onChange={(e) => handleInputChange('responsavelNome', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.responsavelNome || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">CPF do Responsável</Label>
              {editing ? (
                <Input
                  value={formData.responsavelCpf || ''}
                  onChange={(e) => handleInputChange('responsavelCpf', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.responsavelCpf || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">RG do Responsável</Label>
              {editing ? (
                <Input
                  value={formData.responsavelRg || ''}
                  onChange={(e) => handleInputChange('responsavelRg', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.responsavelRg || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Telefone do Responsável</Label>
              {editing ? (
                <Input
                  value={formData.responsavelTelefone || ''}
                  onChange={(e) => handleInputChange('responsavelTelefone', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.responsavelTelefone || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Email do Responsável</Label>
              {editing ? (
                <Input
                  value={formData.responsavelEmail || ''}
                  onChange={(e) => handleInputChange('responsavelEmail', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.responsavelEmail || 'N/A'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informações Contratuais */}
        <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <DollarSign className="h-5 w-5 text-green-500" />
              Informações Contratuais
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Data Início do Contrato</Label>
              {editing ? (
                <Input
                  type="date"
                  value={formData.dataInicioContrato || ''}
                  onChange={(e) => handleInputChange('dataInicioContrato', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.dataInicioContrato || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Data Fim do Contrato</Label>
              {editing ? (
                <Input
                  type="date"
                  value={formData.dataFimContrato || ''}
                  onChange={(e) => handleInputChange('dataFimContrato', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.dataFimContrato || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Valor da Mensalidade</Label>
              {editing ? (
                <Input
                  value={formData.valorMensalidade || ''}
                  onChange={(e) => handleInputChange('valorMensalidade', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="R$ 0,00"
                />
              ) : (
                <p className="text-white py-2">{cliente.valorMensalidade || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Dia do Vencimento</Label>
              {editing ? (
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.diaVencimento || ''}
                  onChange={(e) => handleInputChange('diaVencimento', parseInt(e.target.value))}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.diaVencimento || 'N/A'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informações Adicionais */}
        <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="h-5 w-5 text-green-500" />
              Informações Adicionais
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Número de Funcionários</Label>
              {editing ? (
                <Input
                  type="number"
                  min="0"
                  value={formData.funcionarios || ''}
                  onChange={(e) => handleInputChange('funcionarios', parseInt(e.target.value))}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.funcionarios || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Status</Label>
              {editing ? (
                <Select value={formData.status || ''} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="suspenso">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-white py-2">
                  <span className={`px-2 py-1 rounded text-sm ${
                    cliente.status === 'ativo' ? 'bg-green-600' : 
                    cliente.status === 'suspenso' ? 'bg-yellow-600' : 'bg-red-600'
                  }`}>
                    {cliente.status === 'ativo' ? 'Ativo' : 
                     cliente.status === 'suspenso' ? 'Suspenso' : 'Inativo'}
                  </span>
                </p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Origem do Cliente</Label>
              {editing ? (
                <Input
                  value={formData.origem || ''}
                  onChange={(e) => handleInputChange('origem', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.origem || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Indicado Por</Label>
              {editing ? (
                <Input
                  value={formData.indicadoPor || ''}
                  onChange={(e) => handleInputChange('indicadoPor', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.indicadoPor || 'N/A'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Serviços Contratados */}
        <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="h-5 w-5 text-green-500" />
              Serviços Contratados
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label className="text-gray-300">Contabilidade</Label>
              {editing ? (
                <Switch
                  checked={formData.contabilidade || false}
                  onCheckedChange={(checked) => handleInputChange('contabilidade', checked)}
                />
              ) : (
                <span className={`px-2 py-1 rounded text-sm ${cliente.contabilidade ? 'bg-green-600' : 'bg-gray-600'}`}>
                  {cliente.contabilidade ? 'Sim' : 'Não'}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-gray-300">Departamento Pessoal</Label>
              {editing ? (
                <Switch
                  checked={formData.departamentoPessoal || false}
                  onCheckedChange={(checked) => handleInputChange('departamentoPessoal', checked)}
                />
              ) : (
                <span className={`px-2 py-1 rounded text-sm ${cliente.departamentoPessoal ? 'bg-green-600' : 'bg-gray-600'}`}>
                  {cliente.departamentoPessoal ? 'Sim' : 'Não'}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-gray-300">Consultoria Fiscal</Label>
              {editing ? (
                <Switch
                  checked={formData.consultoriaFiscal || false}
                  onCheckedChange={(checked) => handleInputChange('consultoriaFiscal', checked)}
                />
              ) : (
                <span className={`px-2 py-1 rounded text-sm ${cliente.consultoriaFiscal ? 'bg-green-600' : 'bg-gray-600'}`}>
                  {cliente.consultoriaFiscal ? 'Sim' : 'Não'}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-gray-300">Auditoria</Label>
              {editing ? (
                <Switch
                  checked={formData.auditoria || false}
                  onCheckedChange={(checked) => handleInputChange('auditoria', checked)}
                />
              ) : (
                <span className={`px-2 py-1 rounded text-sm ${cliente.auditoria ? 'bg-green-600' : 'bg-gray-600'}`}>
                  {cliente.auditoria ? 'Sim' : 'Não'}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-gray-300">Abertura MEI</Label>
              {editing ? (
                <Switch
                  checked={formData.aberturaMei || false}
                  onCheckedChange={(checked) => handleInputChange('aberturaMei', checked)}
                />
              ) : (
                <span className={`px-2 py-1 rounded text-sm ${cliente.aberturaMei ? 'bg-green-600' : 'bg-gray-600'}`}>
                  {cliente.aberturaMei ? 'Sim' : 'Não'}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-gray-300">Certificado Digital</Label>
              {editing ? (
                <Switch
                  checked={formData.certificadoDigital || false}
                  onCheckedChange={(checked) => handleInputChange('certificadoDigital', checked)}
                />
              ) : (
                <span className={`px-2 py-1 rounded text-sm ${cliente.certificadoDigital ? 'bg-green-600' : 'bg-gray-600'}`}>
                  {cliente.certificadoDigital ? 'Sim' : 'Não'}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-gray-300">E-Commerce</Label>
              {editing ? (
                <Switch
                  checked={formData.eCommerce || false}
                  onCheckedChange={(checked) => handleInputChange('eCommerce', checked)}
                />
              ) : (
                <span className={`px-2 py-1 rounded text-sm ${cliente.eCommerce ? 'bg-green-600' : 'bg-gray-600'}`}>
                  {cliente.eCommerce ? 'Sim' : 'Não'}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <FileText className="h-5 w-5 text-green-500" />
              Observações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label className="text-gray-300">Observações Gerais</Label>
              {editing ? (
                <Textarea
                  value={formData.observacoes || ''}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={4}
                  placeholder="Digite suas observações aqui..."
                />
              ) : (
                <p className="text-white py-2">{cliente.observacoes || 'Nenhuma observação cadastrada'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Campos Customizados */}
        {Object.keys(formData || {}).some(key => 
          !['id', 'razaoSocial', 'nomeFantasia', 'cnpj', 'inscricaoEstadual', 'inscricaoMunicipal', 
            'endereco', 'cidade', 'estado', 'cep', 'bairro', 'complemento', 
            'telefoneComercial', 'telefoneAlternativo', 'email', 'emailAlternativo', 'site',
            'regimeTributario', 'atividadePrincipal', 'atividadesSecundarias', 'capitalSocial',
            'banco', 'agencia', 'conta', 'tipoConta',
            'responsavelNome', 'responsavelCpf', 'responsavelRg', 'responsavelTelefone', 'responsavelEmail',
            'dataInicioContrato', 'dataFimContrato', 'valorMensalidade', 'diaVencimento',
            'status', 'observacoes', 'socios', 'createdAt', 'updatedAt',
            'certificadoDigital', 'eCommerce', 'funcionarios',
            'contabilidade', 'departamentoPessoal', 'consultoriaFiscal', 'auditoria', 'aberturaMei',
            'documentos', 'origem', 'indicadoPor'].includes(key)
        ) && (
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Plus className="h-5 w-5 text-green-500" />
                Campos Personalizados
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              {Object.entries(formData || {}).map(([key, value]) => {
                // Só mostra campos que não estão na lista de campos padrão
                const standardFields = ['id', 'razaoSocial', 'nomeFantasia', 'cnpj', 'inscricaoEstadual', 'inscricaoMunicipal', 
                  'endereco', 'cidade', 'estado', 'cep', 'bairro', 'complemento', 
                  'telefoneComercial', 'telefoneAlternativo', 'email', 'emailAlternativo', 'site',
                  'regimeTributario', 'atividadePrincipal', 'atividadesSecundarias', 'capitalSocial',
                  'banco', 'agencia', 'conta', 'tipoConta',
                  'responsavelNome', 'responsavelCpf', 'responsavelRg', 'responsavelTelefone', 'responsavelEmail',
                  'dataInicioContrato', 'dataFimContrato', 'valorMensalidade', 'diaVencimento',
                  'status', 'observacoes', 'socios', 'createdAt', 'updatedAt',
                  'certificadoDigital', 'eCommerce', 'funcionarios',
                  'contabilidade', 'departamentoPessoal', 'consultoriaFiscal', 'auditoria', 'aberturaMei',
                  'documentos', 'origem', 'indicadoPor'];
                
                if (standardFields.includes(key)) return null;
                
                return (
                  <div key={key} className="flex items-center gap-2">
                    <div className="flex-1">
                      <Label className="text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                      {editing ? (
                        <Input
                          value={String(value || '')}
                          onChange={(e) => handleInputChange(key, e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      ) : (
                        <p className="text-white py-2">{String(value || 'N/A')}</p>
                      )}
                    </div>
                    {editing && (
                      <Button
                        onClick={() => {
                          const newFormData = { ...formData };
                          delete newFormData[key];
                          setFormData(newFormData);
                        }}
                        variant="outline"
                        size="sm"
                        className="border-red-600 text-red-400 hover:bg-red-700 mt-6"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Histórico */}
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
                {cliente.createdAt ? new Date(cliente.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
              </p>
            </div>
            <div>
              <Label className="text-gray-300">Última Atualização</Label>
              <p className="text-white py-2">
                {cliente.updatedAt ? new Date(cliente.updatedAt).toLocaleDateString('pt-BR') : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
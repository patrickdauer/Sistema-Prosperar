import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Building, MapPin, Phone, Mail, CreditCard, DollarSign, User, Calendar, Plus, Edit, Save, X, Trash2, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { useState } from 'react';

// Interface baseada na estrutura REAL do banco de dados
interface ClienteCompleto {
  id: number;
  data_abertura: string | null;
  cliente_desde: string | null;
  razao_social: string | null;
  nome_fantasia: string | null;
  imposto_renda: string | null;
  cnpj: string | null;
  regime_tributario: string | null;
  nire: string | null;
  inscricao_estadual: string | null;
  inscricao_municipal: string | null;
  telefone_empresa: string | null;
  email_empresa: string | null;
  contato: string | null;
  celular: string | null;
  contato_2: string | null;
  celular_2: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  nota_servico: string | null;
  nota_venda: string | null;
  metragem_ocupada: string | null;
  capital_social: string | null;
  atividade_principal: string | null;
  atividades_secundarias: string | null;
  certificado_digital_empresa: string | null;
  senha_certificado_digital_empresa: string | null;
  validade_certificado_digital_empresa: string | null;
  procuracao_cnpj_contabilidade: string | null;
  procuracao_cnpj_cpf: string | null;
  socio_1: string | null;
  cpf_socio_1: string | null;
  senha_gov_socio_1: string | null;
  certificado_socio_1: string | null;
  senha_certificado_socio_1: string | null;
  validade_certificado_socio_1: string | null;
  procuracao_socio_1: string | null;
  nacionalidade_socio_1: string | null;
  nascimento_socio_1: string | null;
  filiacao_socio_1: string | null;
  profissao_socio_1: string | null;
  estado_civil_socio_1: string | null;
  endereco_socio_1: string | null;
  telefone_socio_1: string | null;
  email_socio_1: string | null;
  cnh_socio_1: string | null;
  rg_socio_1: string | null;
  certidao_casamento_socio_1: string | null;
  tem_debitos: string | null;
  tem_parcelamento: string | null;
  tem_divida_ativa: string | null;
  mensalidade_com_faturamento: string | null;
  mensalidade_sem_faturamento: string | null;
  certificado_empresa: string | null;
  senha_certificado_empresa: string | null;
  valor_mensalidade: string | null;
  data_vencimento: string | null;
  status_das: string | null;
  status_envio: string | null;
  link_mei: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  email: string | null;
  telefone_comercial: string | null;
  socios: any[];
  
  // Para suportar campos customizados adicionais
  [key: string]: any;
}

export default function ClienteDetailsFix() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<ClienteCompleto | null>(null);
  const [showCustomFieldModal, setShowCustomFieldModal] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');

  const { data: cliente, isLoading } = useQuery({
    queryKey: ['/api/clientes', id],
    queryFn: () => fetch(`/api/clientes/${id}`).then(res => res.json()),
    enabled: !!id
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<ClienteCompleto>) =>
      fetch(`/api/clientes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clientes'] });
      setEditing(false);
      toast({
        title: "Cliente atualizado",
        description: "As informações foram salvas com sucesso."
      });
    }
  });

  const handleSave = () => {
    if (formData) {
      updateMutation.mutate(formData);
    }
  };

  const handleCancel = () => {
    setFormData(cliente || null);
    setEditing(false);
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev!,
      [field]: value
    }));
  };

  const addCustomField = () => {
    if (newFieldName && formData) {
      // Limpar o nome do campo e converter para snake_case
      const cleanFieldName = newFieldName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .trim();
      
      if (cleanFieldName && !standardFields.includes(cleanFieldName)) {
        setFormData(prev => ({
          ...prev!,
          [cleanFieldName]: newFieldValue
        }));
        
        setShowCustomFieldModal(false);
        setNewFieldName('');
        setNewFieldValue('');
        
        toast({
          title: "Campo personalizado adicionado",
          description: `Campo "${newFieldName}" foi adicionado ao formulário.`
        });
      } else {
        toast({
          title: "Erro",
          description: "Nome de campo inválido ou já existe.",
          variant: "destructive"
        });
      }
    }
  };

  // Inicializar formData quando cliente carregar
  if (cliente && !formData) {
    setFormData(cliente);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-white text-center py-8">Carregando...</div>
        </div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-white text-center py-8">Cliente não encontrado</div>
        </div>
      </div>
    );
  }

  const standardFields = [
    'id', 'data_abertura', 'cliente_desde', 'razao_social', 'nome_fantasia', 'cnpj', 'regime_tributario', 
    'inscricao_estadual', 'inscricao_municipal', 'endereco', 'numero', 'cidade', 'estado', 'cep', 'bairro', 
    'complemento', 'telefone_empresa', 'email_empresa', 'contato', 'celular', 'contato_2', 'celular_2',
    'atividade_principal', 'atividades_secundarias', 'capital_social', 'metragem_ocupada',
    'certificado_digital_empresa', 'senha_certificado_digital_empresa', 'validade_certificado_digital_empresa',
    'procuracao_cnpj_contabilidade', 'procuracao_cnpj_cpf', 'valor_mensalidade', 'data_vencimento',
    'status', 'socios', 'created_at', 'updated_at', 'email', 'telefone_comercial',
    'socio_1', 'cpf_socio_1', 'senha_gov_socio_1', 'certificado_socio_1', 'senha_certificado_socio_1',
    'validade_certificado_socio_1', 'procuracao_socio_1', 'nacionalidade_socio_1', 'nascimento_socio_1',
    'filiacao_socio_1', 'profissao_socio_1', 'estado_civil_socio_1', 'endereco_socio_1',
    'telefone_socio_1', 'email_socio_1', 'cnh_socio_1', 'rg_socio_1', 'certidao_casamento_socio_1',
    'tem_debitos', 'tem_parcelamento', 'tem_divida_ativa', 'mensalidade_com_faturamento', 'mensalidade_sem_faturamento',
    'certificado_empresa', 'senha_certificado_empresa', 'status_das', 'status_envio', 'link_mei',
    // Novos campos do certificado digital
    'tem_certificado_digital', 'data_vencimento_certificado', 'emissor_certificado', 'observacoes_certificado',
    // Novos campos das procurações
    'tem_procuracao_pj', 'data_vencimento_procuracao_pj', 'observacoes_procuracao_pj',
    'tem_procuracao_pf', 'data_vencimento_procuracao_pf', 'observacoes_procuracao_pf',
    // Campo do Google Drive
    'link_google_drive',
    // Novos campos do sócio
    'regime_tributario_socio_1', 'senha_gov_socio_1', 'filiacao_socio_1', 'observacao_socio_1'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div 
          className="flex items-center justify-between p-6 rounded-lg"
          style={{ background: '#1f2937', border: '1px solid #374151' }}
        >
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">
              {cliente.razao_social || 'Cliente sem nome'}
            </h1>
          </div>
          <div className="flex gap-2">
            {!editing && (
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

        {/* Link da Pasta Google Drive */}
        <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <CreditCard className="h-5 w-5 text-green-500" />
              Link da Pasta no Google Drive
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-300">URL da Pasta no Google Drive</Label>
              {editing ? (
                <div className="space-y-2">
                  <Input
                    value={formData?.link_google_drive || ''}
                    onChange={(e) => handleInputChange('link_google_drive', e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <p className="text-xs text-gray-400">
                    Cole aqui o link da pasta do Google Drive onde estão armazenados os documentos do cliente
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {formData?.link_google_drive ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={formData.link_google_drive}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline py-2 break-all"
                      >
                        {formData.link_google_drive}
                      </a>
                      <Button
                        onClick={() => window.open(formData.link_google_drive, '_blank')}
                        size="sm"
                        style={{ backgroundColor: '#3b82f6', color: 'white' }}
                        className="hover:bg-blue-600 shrink-0"
                      >
                        Abrir Pasta
                      </Button>
                    </div>
                  ) : (
                    <p className="text-gray-400 py-2">Nenhuma pasta do Google Drive vinculada</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informações Básicas da Empresa */}
        <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Building className="h-5 w-5 text-green-500" />
              Informações da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Razão Social</Label>
              {editing ? (
                <Input
                  value={formData?.razao_social || ''}
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
                  value={formData?.nome_fantasia || ''}
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
                  value={formData?.cnpj || ''}
                  onChange={(e) => handleInputChange('cnpj', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.cnpj || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Regime Tributário</Label>
              {editing ? (
                <Select value={formData?.regime_tributario || ''} onValueChange={(value) => handleInputChange('regime_tributario', value)}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Selecione o regime" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEI">MEI</SelectItem>
                    <SelectItem value="SIMPLES">Simples Nacional</SelectItem>
                    <SelectItem value="LUCRO_PRESUMIDO">Lucro Presumido</SelectItem>
                    <SelectItem value="LUCRO_REAL">Lucro Real</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-white py-2">{cliente.regime_tributario || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Inscrição Estadual</Label>
              {editing ? (
                <Input
                  value={formData?.inscricao_estadual || ''}
                  onChange={(e) => handleInputChange('inscricao_estadual', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.inscricao_estadual || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Inscrição Municipal</Label>
              {editing ? (
                <Input
                  value={formData?.inscricao_municipal || ''}
                  onChange={(e) => handleInputChange('inscricao_municipal', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.inscricao_municipal || 'N/A'}</p>
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
          <CardContent className="grid md:grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label className="text-gray-300">Endereço</Label>
              {editing ? (
                <Input
                  value={formData?.endereco || ''}
                  onChange={(e) => handleInputChange('endereco', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.endereco || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Número</Label>
              {editing ? (
                <Input
                  value={formData?.numero || ''}
                  onChange={(e) => handleInputChange('numero', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.numero || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Cidade</Label>
              {editing ? (
                <Input
                  value={formData?.cidade || ''}
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
                  value={formData?.estado || ''}
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
                  value={formData?.cep || ''}
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
                  value={formData?.bairro || ''}
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
                  value={formData?.complemento || ''}
                  onChange={(e) => handleInputChange('complemento', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.complemento || 'N/A'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Phone className="h-5 w-5 text-green-500" />
              Informações de Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Email da Empresa</Label>
              {editing ? (
                <Input
                  value={formData?.email_empresa || ''}
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
                  value={formData?.telefone_empresa || ''}
                  onChange={(e) => handleInputChange('telefone_empresa', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.telefone_empresa || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Contato Principal</Label>
              {editing ? (
                <Input
                  value={formData?.contato || ''}
                  onChange={(e) => handleInputChange('contato', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.contato || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Celular Principal</Label>
              {editing ? (
                <Input
                  value={formData?.celular || ''}
                  onChange={(e) => handleInputChange('celular', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.celular || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Contato 2</Label>
              {editing ? (
                <Input
                  value={formData?.contato_2 || ''}
                  onChange={(e) => handleInputChange('contato_2', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.contato_2 || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Celular 2</Label>
              {editing ? (
                <Input
                  value={formData?.celular_2 || ''}
                  onChange={(e) => handleInputChange('celular_2', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.celular_2 || 'N/A'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informações Fiscais */}
        <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <CreditCard className="h-5 w-5 text-green-500" />
              Informações Fiscais
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Capital Social</Label>
              {editing ? (
                <Input
                  value={formData?.capital_social || ''}
                  onChange={(e) => handleInputChange('capital_social', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.capital_social || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Metragem Ocupada</Label>
              {editing ? (
                <Input
                  value={formData?.metragem_ocupada || ''}
                  onChange={(e) => handleInputChange('metragem_ocupada', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.metragem_ocupada || 'N/A'}</p>
              )}
            </div>
            <div className="col-span-2">
              <Label className="text-gray-300">Atividade Principal</Label>
              {editing ? (
                <Textarea
                  value={formData?.atividade_principal || ''}
                  onChange={(e) => handleInputChange('atividade_principal', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={2}
                />
              ) : (
                <p className="text-white py-2">{cliente.atividade_principal || 'N/A'}</p>
              )}
            </div>
            <div className="col-span-2">
              <Label className="text-gray-300">Atividades Secundárias</Label>
              {editing ? (
                <Textarea
                  value={formData?.atividades_secundarias || ''}
                  onChange={(e) => handleInputChange('atividades_secundarias', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={3}
                />
              ) : (
                <p className="text-white py-2">{cliente.atividades_secundarias || 'N/A'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informações do Sócio Principal */}
        <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="h-5 w-5 text-green-500" />
                Sócio Principal
              </CardTitle>
              {editing && (
                <Button
                  onClick={() => {
                    // Função para adicionar novo sócio
                    const newSocioNumber = 2; // Por enquanto, vamos começar com sócio 2
                    handleInputChange(`socio_${newSocioNumber}`, '');
                    handleInputChange(`cpf_socio_${newSocioNumber}`, '');
                    handleInputChange(`rg_socio_${newSocioNumber}`, '');
                    handleInputChange(`nacionalidade_socio_${newSocioNumber}`, '');
                    handleInputChange(`nascimento_socio_${newSocioNumber}`, '');
                    handleInputChange(`estado_civil_socio_${newSocioNumber}`, '');
                    handleInputChange(`profissao_socio_${newSocioNumber}`, '');
                    handleInputChange(`telefone_socio_${newSocioNumber}`, '');
                    handleInputChange(`email_socio_${newSocioNumber}`, '');
                    handleInputChange(`endereco_socio_${newSocioNumber}`, '');
                    handleInputChange(`senha_gov_socio_${newSocioNumber}`, '');
                    handleInputChange(`filiacao_socio_${newSocioNumber}`, '');
                    handleInputChange(`observacao_socio_${newSocioNumber}`, '');
                  }}
                  size="sm"
                  style={{ backgroundColor: '#3b82f6', color: 'white' }}
                  className="hover:bg-blue-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Sócio
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Nome Completo</Label>
              {editing ? (
                <Input
                  value={formData?.socio_1 || ''}
                  onChange={(e) => handleInputChange('socio_1', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.socio_1 || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">CPF</Label>
              {editing ? (
                <Input
                  value={formData?.cpf_socio_1 || ''}
                  onChange={(e) => handleInputChange('cpf_socio_1', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.cpf_socio_1 || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">RG</Label>
              {editing ? (
                <Input
                  value={formData?.rg_socio_1 || ''}
                  onChange={(e) => handleInputChange('rg_socio_1', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.rg_socio_1 || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Nacionalidade</Label>
              {editing ? (
                <Input
                  value={formData?.nacionalidade_socio_1 || ''}
                  onChange={(e) => handleInputChange('nacionalidade_socio_1', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.nacionalidade_socio_1 || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Data de Nascimento</Label>
              {editing ? (
                <Input
                  type="date"
                  value={formData?.nascimento_socio_1 || ''}
                  onChange={(e) => handleInputChange('nascimento_socio_1', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.nascimento_socio_1 || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Estado Civil</Label>
              {editing ? (
                <Select value={formData?.estado_civil_socio_1 || ''} onValueChange={(value) => handleInputChange('estado_civil_socio_1', value)}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Selecione o estado civil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SOLTEIRO">Solteiro(a)</SelectItem>
                    <SelectItem value="CASADO">Casado(a)</SelectItem>
                    <SelectItem value="DIVORCIADO">Divorciado(a)</SelectItem>
                    <SelectItem value="VIUVO">Viúvo(a)</SelectItem>
                    <SelectItem value="SEPARADO">Separado(a)</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-white py-2">{cliente.estado_civil_socio_1 || 'N/A'}</p>
              )}
            </div>
            {/* Regime Tributário - só aparece se casado */}
            {(formData?.estado_civil_socio_1 === 'CASADO' || cliente.estado_civil_socio_1 === 'CASADO') && (
              <div>
                <Label className="text-gray-300">Regime Tributário</Label>
                {editing ? (
                  <Select value={formData?.regime_tributario_socio_1 || ''} onValueChange={(value) => handleInputChange('regime_tributario_socio_1', value)}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Selecione o regime tributário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COMUNHAO_PARCIAL">Comunhão Parcial de Bens</SelectItem>
                      <SelectItem value="COMUNHAO_TOTAL">Comunhão Total de Bens</SelectItem>
                      <SelectItem value="SEPARACAO_BENS">Separação de Bens</SelectItem>
                      <SelectItem value="PARTICIPACAO_FINAL">Participação Final dos Aquestos</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-white py-2">{cliente.regime_tributario_socio_1 || 'N/A'}</p>
                )}
              </div>
            )}
            <div>
              <Label className="text-gray-300">Senha do Gov</Label>
              {editing ? (
                <Input
                  type="password"
                  value={formData?.senha_gov_socio_1 || ''}
                  onChange={(e) => handleInputChange('senha_gov_socio_1', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Digite a senha do Gov.br"
                />
              ) : (
                <p className="text-white py-2">{cliente.senha_gov_socio_1 ? '••••••••' : 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Filiação</Label>
              {editing ? (
                <Input
                  value={formData?.filiacao_socio_1 || ''}
                  onChange={(e) => handleInputChange('filiacao_socio_1', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Nome dos pais"
                />
              ) : (
                <p className="text-white py-2">{cliente.filiacao_socio_1 || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Profissão</Label>
              {editing ? (
                <Input
                  value={formData?.profissao_socio_1 || ''}
                  onChange={(e) => handleInputChange('profissao_socio_1', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.profissao_socio_1 || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Telefone</Label>
              {editing ? (
                <Input
                  value={formData?.telefone_socio_1 || ''}
                  onChange={(e) => handleInputChange('telefone_socio_1', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.telefone_socio_1 || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Email</Label>
              {editing ? (
                <Input
                  value={formData?.email_socio_1 || ''}
                  onChange={(e) => handleInputChange('email_socio_1', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.email_socio_1 || 'N/A'}</p>
              )}
            </div>
            <div className="col-span-2">
              <Label className="text-gray-300">Endereço</Label>
              {editing ? (
                <Textarea
                  value={formData?.endereco_socio_1 || ''}
                  onChange={(e) => handleInputChange('endereco_socio_1', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={2}
                />
              ) : (
                <p className="text-white py-2">{cliente.endereco_socio_1 || 'N/A'}</p>
              )}
            </div>
            <div className="col-span-2">
              <Label className="text-gray-300">Observação</Label>
              {editing ? (
                <Textarea
                  value={formData?.observacao_socio_1 || ''}
                  onChange={(e) => handleInputChange('observacao_socio_1', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={3}
                  placeholder="Observações adicionais sobre o sócio"
                />
              ) : (
                <p className="text-white py-2">{cliente.observacao_socio_1 || 'N/A'}</p>
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
              <Label className="text-gray-300">Valor da Mensalidade</Label>
              {editing ? (
                <Input
                  value={formData?.valor_mensalidade || ''}
                  onChange={(e) => handleInputChange('valor_mensalidade', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.valor_mensalidade || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Data de Vencimento</Label>
              {editing ? (
                <Input
                  value={formData?.data_vencimento || ''}
                  onChange={(e) => handleInputChange('data_vencimento', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.data_vencimento || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Data de Abertura</Label>
              {editing ? (
                <Input
                  type="date"
                  value={formData?.data_abertura || ''}
                  onChange={(e) => handleInputChange('data_abertura', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.data_abertura || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Cliente Desde</Label>
              {editing ? (
                <Input
                  type="date"
                  value={formData?.cliente_desde || ''}
                  onChange={(e) => handleInputChange('cliente_desde', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{cliente.cliente_desde || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Status</Label>
              {editing ? (
                <Select value={formData?.status || ''} onValueChange={(value) => handleInputChange('status', value)}>
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
                <p className="text-white py-2">{cliente.status || 'N/A'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Certificado Digital */}
        <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <CreditCard className="h-5 w-5 text-green-500" />
              Certificado Digital
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Possui Certificado Digital</Label>
              {editing ? (
                <div className="flex items-center gap-2 mt-2">
                  <Switch
                    checked={formData?.tem_certificado_digital === 'sim' || formData?.tem_certificado_digital === true}
                    onCheckedChange={(checked) => handleInputChange('tem_certificado_digital', checked ? 'sim' : 'nao')}
                    className={`${
                      formData?.tem_certificado_digital === 'sim' || formData?.tem_certificado_digital === true
                        ? 'data-[state=checked]:bg-green-500'
                        : 'bg-red-500'
                    }`}
                  />
                  <span className={`text-sm font-medium ${
                    formData?.tem_certificado_digital === 'sim' || formData?.tem_certificado_digital === true
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}>
                    {formData?.tem_certificado_digital === 'sim' || formData?.tem_certificado_digital === true ? 'Sim' : 'Não'}
                  </span>
                </div>
              ) : (
                <p className="text-white py-2">
                  {formData?.tem_certificado_digital === 'sim' || formData?.tem_certificado_digital === true ? 'Sim' : 'Não'}
                </p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Data de Vencimento</Label>
              {editing ? (
                <Input
                  type="date"
                  value={formData?.data_vencimento_certificado || ''}
                  onChange={(e) => handleInputChange('data_vencimento_certificado', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">
                  {formData?.data_vencimento_certificado ? 
                    new Date(formData.data_vencimento_certificado).toLocaleDateString('pt-BR') : 'N/A'}
                </p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Quem Fez o Certificado</Label>
              {editing ? (
                <Input
                  value={formData?.emissor_certificado || ''}
                  onChange={(e) => handleInputChange('emissor_certificado', e.target.value)}
                  placeholder="Ex: Serasa, AC Certisign, etc."
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{formData?.emissor_certificado || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Observações do Certificado</Label>
              {editing ? (
                <Textarea
                  value={formData?.observacoes_certificado || ''}
                  onChange={(e) => handleInputChange('observacoes_certificado', e.target.value)}
                  placeholder="Observações sobre o certificado..."
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white py-2">{formData?.observacoes_certificado || 'N/A'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Procurações */}
        <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <User className="h-5 w-5 text-green-500" />
              Procurações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Procuração Pessoa Jurídica */}
            <div className="border border-gray-600 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-4">Procuração Pessoa Jurídica</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Possui Procuração PJ</Label>
                  {editing ? (
                    <div className="flex items-center gap-2 mt-2">
                      <Switch
                        checked={formData?.tem_procuracao_pj === 'sim' || formData?.tem_procuracao_pj === true}
                        onCheckedChange={(checked) => handleInputChange('tem_procuracao_pj', checked ? 'sim' : 'nao')}
                        className={`${
                          formData?.tem_procuracao_pj === 'sim' || formData?.tem_procuracao_pj === true
                            ? 'data-[state=checked]:bg-green-500'
                            : 'bg-red-500'
                        }`}
                      />
                      <span className={`text-sm font-medium ${
                        formData?.tem_procuracao_pj === 'sim' || formData?.tem_procuracao_pj === true
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}>
                        {formData?.tem_procuracao_pj === 'sim' || formData?.tem_procuracao_pj === true ? 'Sim' : 'Não'}
                      </span>
                    </div>
                  ) : (
                    <p className="text-white py-2">
                      {formData?.tem_procuracao_pj === 'sim' || formData?.tem_procuracao_pj === true ? 'Sim' : 'Não'}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-gray-300">Data de Vencimento PJ</Label>
                  {editing ? (
                    <Input
                      type="date"
                      value={formData?.data_vencimento_procuracao_pj || ''}
                      onChange={(e) => handleInputChange('data_vencimento_procuracao_pj', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  ) : (
                    <p className="text-white py-2">
                      {formData?.data_vencimento_procuracao_pj ? 
                        new Date(formData.data_vencimento_procuracao_pj).toLocaleDateString('pt-BR') : 'N/A'}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Label className="text-gray-300">Observações Procuração PJ</Label>
                  {editing ? (
                    <Textarea
                      value={formData?.observacoes_procuracao_pj || ''}
                      onChange={(e) => handleInputChange('observacoes_procuracao_pj', e.target.value)}
                      placeholder="Observações sobre a procuração pessoa jurídica..."
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  ) : (
                    <p className="text-white py-2">{formData?.observacoes_procuracao_pj || 'N/A'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Procuração Pessoa Física */}
            <div className="border border-gray-600 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-4">Procuração Pessoa Física</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Possui Procuração PF</Label>
                  {editing ? (
                    <div className="flex items-center gap-2 mt-2">
                      <Switch
                        checked={formData?.tem_procuracao_pf === 'sim' || formData?.tem_procuracao_pf === true}
                        onCheckedChange={(checked) => handleInputChange('tem_procuracao_pf', checked ? 'sim' : 'nao')}
                        className={`${
                          formData?.tem_procuracao_pf === 'sim' || formData?.tem_procuracao_pf === true
                            ? 'data-[state=checked]:bg-green-500'
                            : 'bg-red-500'
                        }`}
                      />
                      <span className={`text-sm font-medium ${
                        formData?.tem_procuracao_pf === 'sim' || formData?.tem_procuracao_pf === true
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}>
                        {formData?.tem_procuracao_pf === 'sim' || formData?.tem_procuracao_pf === true ? 'Sim' : 'Não'}
                      </span>
                    </div>
                  ) : (
                    <p className="text-white py-2">
                      {formData?.tem_procuracao_pf === 'sim' || formData?.tem_procuracao_pf === true ? 'Sim' : 'Não'}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-gray-300">Data de Vencimento PF</Label>
                  {editing ? (
                    <Input
                      type="date"
                      value={formData?.data_vencimento_procuracao_pf || ''}
                      onChange={(e) => handleInputChange('data_vencimento_procuracao_pf', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  ) : (
                    <p className="text-white py-2">
                      {formData?.data_vencimento_procuracao_pf ? 
                        new Date(formData.data_vencimento_procuracao_pf).toLocaleDateString('pt-BR') : 'N/A'}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Label className="text-gray-300">Observações Procuração PF</Label>
                  {editing ? (
                    <Textarea
                      value={formData?.observacoes_procuracao_pf || ''}
                      onChange={(e) => handleInputChange('observacoes_procuracao_pf', e.target.value)}
                      placeholder="Observações sobre a procuração pessoa física..."
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  ) : (
                    <p className="text-white py-2">{formData?.observacoes_procuracao_pf || 'N/A'}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Campos Customizados */}
        {Object.keys(formData || {}).some(key => !standardFields.includes(key)) && (
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Settings className="h-5 w-5 text-green-500" />
                Campos Personalizados
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              {Object.entries(formData || {}).map(([key, value]) => {
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

        {/* Botões de Ação */}
        <div className="flex gap-4 justify-center pt-6 border-t border-gray-700">
          <Button
            variant="outline"
            onClick={() => setLocation('/clientes')}
            className="border-gray-600 text-white hover:bg-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          {editing && (
            <>
              <Dialog open={showCustomFieldModal} onOpenChange={setShowCustomFieldModal}>
                <DialogTrigger asChild>
                  <Button
                    style={{ 
                      backgroundColor: '#3b82f6', 
                      color: 'white'
                    }}
                    className="hover:bg-blue-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Campo
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Adicionar Campo Personalizado</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fieldName" className="text-gray-200">Nome do Campo</Label>
                      <Input
                        id="fieldName"
                        value={newFieldName}
                        onChange={(e) => setNewFieldName(e.target.value)}
                        placeholder="Ex: observacoes_especiais"
                        className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        O nome será convertido automaticamente para formato de banco de dados
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="fieldValue" className="text-gray-200">Valor Inicial (opcional)</Label>
                      <Input
                        id="fieldValue"
                        value={newFieldValue}
                        onChange={(e) => setNewFieldValue(e.target.value)}
                        placeholder="Valor inicial do campo"
                        className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowCustomFieldModal(false);
                          setNewFieldName('');
                          setNewFieldValue('');
                        }}
                        className="border-gray-600 text-gray-300 hover:bg-gray-800"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={addCustomField}
                        disabled={!newFieldName.trim()}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Adicionar Campo
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                onClick={handleSave}
                style={{ 
                  backgroundColor: '#22c55e', 
                  color: 'white'
                }}
                className="hover:bg-green-600"
                disabled={updateMutation.isPending}
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
          )}
        </div>
      </div>
    </div>
  );
}
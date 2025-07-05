import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Save, ArrowLeft, Plus, Trash2, Copy } from 'lucide-react';
import { BackToHomeButton } from '@/components/back-to-home-button';

interface Socio {
  nome_completo: string;
  cpf: string;
  senha_gov: string;
  rg: string;
  data_nascimento: string;
  nacionalidade: string;
  estado_civil: string;
  regime_casamento: string;
  profissao: string;
  endereco_pessoal: string;
  telefone_pessoal: string;
  email_pessoal: string;
  participacao_sociedade: string;
  responsabilidades: string;
  observacoes_socio: string;
}

export default function NovoCliente() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para dados do cliente - TODOS os campos do banco
  const [formData, setFormData] = useState({
    // Dados básicos
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    nire: '',
    inscricao_estadual: '',
    inscricao_municipal: '',
    data_abertura: '',
    cliente_desde: '',
    imposto_renda: '',
    ir_ano_referencia: '',
    ir_status: '',
    ir_data_entrega: '',
    ir_valor_pagar: '',
    ir_valor_restituir: '',
    ir_observacoes: '',
    
    // Endereço completo
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    
    // Contato
    telefone_empresa: '',
    telefone_comercial: '',
    email_empresa: '',
    email: '',
    contato: '',
    celular: '',
    contato_2: '',
    celular_2: '',
    
    // Informações tributárias e empresariais
    regime_tributario: '',
    atividade_principal: '',
    atividades_secundarias: '',
    capital_social: '',
    nota_servico: '',
    nota_venda: '',
    metragem_ocupada: '',
    
    // Certificados digitais empresa
    certificado_digital_empresa: '',
    senha_certificado_digital_empresa: '',
    validade_certificado_digital_empresa: '',
    certificado_empresa: '',
    senha_certificado_empresa: '',
    
    // Procurações
    procuracao_cnpj_contabilidade: '',
    procuracao_cnpj_cpf: '',
    
    // Informações sócio 1 (campos específicos)
    socio_1: '',
    cpf_socio_1: '',
    senha_gov_socio_1: '',
    certificado_socio_1: '',
    senha_certificado_socio_1: '',
    validade_certificado_socio_1: '',
    procuracao_socio_1: '',
    nacionalidade_socio_1: '',
    nascimento_socio_1: '',
    filiacao_socio_1: '',
    profissao_socio_1: '',
    estado_civil_socio_1: '',
    endereco_socio_1: '',
    telefone_socio_1: '',
    email_socio_1: '',
    cnh_socio_1: '',
    rg_socio_1: '',
    certidao_casamento_socio_1: '',
    
    // Status financeiro
    tem_debitos: '',
    tem_parcelamento: '',
    tem_divida_ativa: '',
    mensalidade_com_faturamento: '',
    mensalidade_sem_faturamento: '',
    valor_mensalidade: '',
    data_vencimento: '',
    observacoes_mensalidade: '',
    
    // Status Dívidas Tributárias
    observacoes_debitos: '',
    tem_parcelamentos: '',
    observacoes_parcelamentos: '',
    observacoes_divida_ativa: '',
    
    // Status operacional
    status_das: '',
    status_envio: '',
    link_mei: '',
    
    // Status geral
    status: 'ativo',
    
    // Observações gerais
    observacoes: '',
    
    // Link Google Drive
    link_google_drive: '',
    
    // Certificado Digital
    tem_certificado_digital: 'nao',
    data_vencimento_certificado: '',
    emissor_certificado: '',
    observacoes_certificado: '',
    
    // Procurações
    tem_procuracao_pj: 'nao',
    data_vencimento_procuracao_pj: '',
    observacoes_procuracao_pj: '',
    tem_procuracao_pf: 'nao',
    data_vencimento_procuracao_pf: '',
    observacoes_procuracao_pf: '',
  });

  const [socios, setSocios] = useState<Socio[]>([]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddSocio = () => {
    const novoSocio: Socio = {
      nome_completo: '',
      cpf: '',
      senha_gov: '',
      rg: '',
      data_nascimento: '',
      nacionalidade: '',
      estado_civil: '',
      regime_casamento: '',
      profissao: '',
      endereco_pessoal: '',
      telefone_pessoal: '',
      email_pessoal: '',
      participacao_sociedade: '',
      responsabilidades: '',
      observacoes_socio: '',
    };
    setSocios([...socios, novoSocio]);
  };

  const handleRemoveSocio = (index: number) => {
    setSocios(socios.filter((_, i) => i !== index));
  };

  const handleSocioChange = (index: number, field: string, value: string) => {
    setSocios(socios.map((socio, i) => 
      i === index ? { ...socio, [field]: value } : socio
    ));
  };

  const copyToClipboard = async (text: string, label: string) => {
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
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const clienteData = {
        ...formData,
        socios: socios
      };

      const response = await fetch('/api/clientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clienteData),
      });

      if (response.ok) {
        toast({
          title: "Cliente criado",
          description: "Cliente foi adicionado com sucesso!",
        });
        setLocation('/clientes');
      } else {
        throw new Error('Erro ao criar cliente');
      }
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o cliente",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)' }}>
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">
            Novo Cliente
          </h1>
          <BackToHomeButton />
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Link Google Drive */}
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <CardHeader>
              <CardTitle className="text-white">Link da Pasta no Google Drive</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-gray-200">URL da Pasta no Google Drive</Label>
                <Input
                  value={formData.link_google_drive}
                  onChange={(e) => handleInputChange('link_google_drive', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  placeholder="https://drive.google.com/drive/folders/..."
                />
                <p className="text-xs text-gray-400 mt-1">
                  Cole aqui o link da pasta do Google Drive onde estão armazenados os documentos do cliente
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Dados Básicos */}
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <CardHeader>
              <CardTitle className="text-white">Dados Básicos da Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-200">Razão Social *</Label>
                  <Input
                    value={formData.razao_social}
                    onChange={(e) => handleInputChange('razao_social', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Nome da empresa"
                    required
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Nome Fantasia</Label>
                  <Input
                    value={formData.nome_fantasia}
                    onChange={(e) => handleInputChange('nome_fantasia', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Nome fantasia"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">CNPJ *</Label>
                  <Input
                    value={formData.cnpj}
                    onChange={(e) => handleInputChange('cnpj', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="00.000.000/0001-00"
                    required
                  />
                </div>
                <div>
                  <Label className="text-gray-200">NIRE</Label>
                  <Input
                    value={formData.nire}
                    onChange={(e) => handleInputChange('nire', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="NIRE"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Inscrição Estadual</Label>
                  <Input
                    value={formData.inscricao_estadual}
                    onChange={(e) => handleInputChange('inscricao_estadual', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Inscrição estadual"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Inscrição Municipal</Label>
                  <Input
                    value={formData.inscricao_municipal}
                    onChange={(e) => handleInputChange('inscricao_municipal', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Inscrição municipal"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Data de Abertura</Label>
                  <Input
                    type="date"
                    value={formData.data_abertura}
                    onChange={(e) => handleInputChange('data_abertura', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Cliente Desde</Label>
                  <Input
                    type="date"
                    value={formData.cliente_desde}
                    onChange={(e) => handleInputChange('cliente_desde', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <Label className="text-gray-200">Nota de Serviço</Label>
                  <Input
                    value={formData.nota_servico}
                    onChange={(e) => handleInputChange('nota_servico', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Informações de nota de serviço"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Nota de Venda</Label>
                  <Input
                    value={formData.nota_venda}
                    onChange={(e) => handleInputChange('nota_venda', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Informações de nota de venda"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-gray-200">Observações</Label>
                  <Textarea
                    value={formData.observacoes}
                    onChange={(e) => handleInputChange('observacoes', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Observações gerais sobre a empresa..."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Atividades da Empresa */}
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <CardHeader>
              <CardTitle className="text-white">Atividades da Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-200">Regime Tributário</Label>
                  <Select value={formData.regime_tributario} onValueChange={(value) => handleInputChange('regime_tributario', value)}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Selecione o regime" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="MEI">MEI</SelectItem>
                      <SelectItem value="SIMPLES">Simples Nacional</SelectItem>
                      <SelectItem value="LUCRO_PRESUMIDO">Lucro Presumido</SelectItem>
                      <SelectItem value="LUCRO_REAL">Lucro Real</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-200">Capital Social</Label>
                  <Input
                    value={formData.capital_social}
                    onChange={(e) => handleInputChange('capital_social', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="R$ 0,00"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-gray-200">Atividade Principal</Label>
                  <Textarea
                    value={formData.atividade_principal}
                    onChange={(e) => handleInputChange('atividade_principal', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Atividade principal da empresa"
                    rows={2}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-gray-200">Atividades Secundárias</Label>
                  <Textarea
                    value={formData.atividades_secundarias}
                    onChange={(e) => handleInputChange('atividades_secundarias', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Atividades secundárias da empresa"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Endereço Completo */}
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <CardHeader>
              <CardTitle className="text-white">Endereço da Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-200">Endereço</Label>
                  <Input
                    value={formData.endereco}
                    onChange={(e) => handleInputChange('endereco', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Rua, avenida..."
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Número</Label>
                  <Input
                    value={formData.numero}
                    onChange={(e) => handleInputChange('numero', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Número"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Complemento</Label>
                  <Input
                    value={formData.complemento}
                    onChange={(e) => handleInputChange('complemento', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Sala, andar..."
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Bairro</Label>
                  <Input
                    value={formData.bairro}
                    onChange={(e) => handleInputChange('bairro', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Bairro"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Cidade</Label>
                  <Input
                    value={formData.cidade}
                    onChange={(e) => handleInputChange('cidade', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Cidade"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Estado</Label>
                  <Input
                    value={formData.estado}
                    onChange={(e) => handleInputChange('estado', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Estado"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">CEP</Label>
                  <Input
                    value={formData.cep}
                    onChange={(e) => handleInputChange('cep', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações de Contato */}
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <CardHeader>
              <CardTitle className="text-white">Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-200">Telefone da Empresa</Label>
                  <Input
                    value={formData.telefone_empresa}
                    onChange={(e) => handleInputChange('telefone_empresa', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="(11) 1234-5678"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Telefone Comercial</Label>
                  <Input
                    value={formData.telefone_comercial}
                    onChange={(e) => handleInputChange('telefone_comercial', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="(11) 1234-5678"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Email da Empresa</Label>
                  <Input
                    type="email"
                    value={formData.email_empresa}
                    onChange={(e) => handleInputChange('email_empresa', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="contato@empresa.com"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="email@empresa.com"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Contato Responsável</Label>
                  <Input
                    value={formData.contato}
                    onChange={(e) => handleInputChange('contato', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Nome do responsável"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Celular</Label>
                  <Input
                    value={formData.celular}
                    onChange={(e) => handleInputChange('celular', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="(11) 91234-5678"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Contato 2</Label>
                  <Input
                    value={formData.contato_2}
                    onChange={(e) => handleInputChange('contato_2', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Nome do segundo contato"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Celular 2</Label>
                  <Input
                    value={formData.celular_2}
                    onChange={(e) => handleInputChange('celular_2', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="(11) 91234-5678"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Imposto de Renda Pessoa Física */}
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <CardHeader>
              <CardTitle className="text-white">Imposto de Renda Pessoa Física</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-200">Imposto de Renda</Label>
                  <Input
                    value={formData.imposto_renda}
                    onChange={(e) => handleInputChange('imposto_renda', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Status do IR"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Ano de Referência</Label>
                  <Input
                    value={formData.ir_ano_referencia}
                    onChange={(e) => handleInputChange('ir_ano_referencia', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="2024"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Status do IR</Label>
                  <Input
                    value={formData.ir_status}
                    onChange={(e) => handleInputChange('ir_status', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Status atual"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Data de Entrega</Label>
                  <Input
                    type="date"
                    value={formData.ir_data_entrega}
                    onChange={(e) => handleInputChange('ir_data_entrega', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Valor a Pagar</Label>
                  <Input
                    value={formData.ir_valor_pagar}
                    onChange={(e) => handleInputChange('ir_valor_pagar', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="R$ 0,00"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Valor a Restituir</Label>
                  <Input
                    value={formData.ir_valor_restituir}
                    onChange={(e) => handleInputChange('ir_valor_restituir', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="R$ 0,00"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-gray-200">Observações sobre IR</Label>
                  <Textarea
                    value={formData.ir_observacoes}
                    onChange={(e) => handleInputChange('ir_observacoes', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Observações sobre o Imposto de Renda..."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Tributárias e Empresariais */}
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <CardHeader>
              <CardTitle className="text-white">Informações Tributárias e Empresariais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-200">Regime Tributário</Label>
                  <Select value={formData.regime_tributario} onValueChange={(value) => handleInputChange('regime_tributario', value)}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Selecione o regime" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="simples">Simples Nacional</SelectItem>
                      <SelectItem value="presumido">Lucro Presumido</SelectItem>
                      <SelectItem value="real">Lucro Real</SelectItem>
                      <SelectItem value="mei">MEI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-200">Atividade Principal</Label>
                  <Input
                    value={formData.atividade_principal}
                    onChange={(e) => handleInputChange('atividade_principal', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Atividade principal"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Atividades Secundárias</Label>
                  <Input
                    value={formData.atividades_secundarias}
                    onChange={(e) => handleInputChange('atividades_secundarias', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Atividades secundárias"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Capital Social</Label>
                  <Input
                    value={formData.capital_social}
                    onChange={(e) => handleInputChange('capital_social', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="R$ 0,00"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Metragem Ocupada</Label>
                  <Input
                    value={formData.metragem_ocupada}
                    onChange={(e) => handleInputChange('metragem_ocupada', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Metragem em m²"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Certificados Digitais da Empresa */}
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <CardHeader>
              <CardTitle className="text-white">Certificados Digitais da Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-200">Certificado Digital Empresa</Label>
                  <Input
                    value={formData.certificado_digital_empresa}
                    onChange={(e) => handleInputChange('certificado_digital_empresa', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Certificado digital da empresa"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Senha Certificado Digital Empresa</Label>
                  <Input
                    type="password"
                    value={formData.senha_certificado_digital_empresa}
                    onChange={(e) => handleInputChange('senha_certificado_digital_empresa', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Senha do certificado"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Validade Certificado Digital Empresa</Label>
                  <Input
                    type="date"
                    value={formData.validade_certificado_digital_empresa}
                    onChange={(e) => handleInputChange('validade_certificado_digital_empresa', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Certificado Empresa</Label>
                  <Input
                    value={formData.certificado_empresa}
                    onChange={(e) => handleInputChange('certificado_empresa', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Certificado da empresa"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Senha Certificado Empresa</Label>
                  <Input
                    type="password"
                    value={formData.senha_certificado_empresa}
                    onChange={(e) => handleInputChange('senha_certificado_empresa', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Senha do certificado"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Procurações */}
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <CardHeader>
              <CardTitle className="text-white">Procurações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-200">Procuração CNPJ Contabilidade</Label>
                  <Input
                    value={formData.procuracao_cnpj_contabilidade}
                    onChange={(e) => handleInputChange('procuracao_cnpj_contabilidade', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Procuração CNPJ contabilidade"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Procuração CNPJ CPF</Label>
                  <Input
                    value={formData.procuracao_cnpj_cpf}
                    onChange={(e) => handleInputChange('procuracao_cnpj_cpf', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Procuração CNPJ CPF"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Sócio Principal */}
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <CardHeader>
              <CardTitle className="text-white">Sócio Principal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-200">Nome do Sócio 1</Label>
                  <Input
                    value={formData.socio_1}
                    onChange={(e) => handleInputChange('socio_1', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">CPF Sócio 1</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.cpf_socio_1}
                      onChange={(e) => handleInputChange('cpf_socio_1', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      placeholder="000.000.000-00"
                    />
                    <Button
                      type="button"
                      onClick={() => copyToClipboard(formData.cpf_socio_1, 'CPF')}
                      size="sm"
                      variant="outline"
                      className="border-gray-600 text-white hover:bg-gray-700"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-200">Senha Gov Sócio 1</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.senha_gov_socio_1}
                      onChange={(e) => handleInputChange('senha_gov_socio_1', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      placeholder="Senha gov.br"
                    />
                    <Button
                      type="button"
                      onClick={() => copyToClipboard(formData.senha_gov_socio_1, 'Senha Gov')}
                      size="sm"
                      variant="outline"
                      className="border-gray-600 text-white hover:bg-gray-700"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-200">RG Sócio 1</Label>
                  <Input
                    value={formData.rg_socio_1}
                    onChange={(e) => handleInputChange('rg_socio_1', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="RG"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">CNH Sócio 1</Label>
                  <Input
                    value={formData.cnh_socio_1}
                    onChange={(e) => handleInputChange('cnh_socio_1', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="CNH"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Nacionalidade Sócio 1</Label>
                  <Input
                    value={formData.nacionalidade_socio_1}
                    onChange={(e) => handleInputChange('nacionalidade_socio_1', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Brasileiro"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Data Nascimento Sócio 1</Label>
                  <Input
                    type="date"
                    value={formData.nascimento_socio_1}
                    onChange={(e) => handleInputChange('nascimento_socio_1', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Filiação Sócio 1</Label>
                  <Input
                    value={formData.filiacao_socio_1}
                    onChange={(e) => handleInputChange('filiacao_socio_1', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Nome dos pais"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Profissão Sócio 1</Label>
                  <Input
                    value={formData.profissao_socio_1}
                    onChange={(e) => handleInputChange('profissao_socio_1', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Profissão"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Estado Civil Sócio 1</Label>
                  <Input
                    value={formData.estado_civil_socio_1}
                    onChange={(e) => handleInputChange('estado_civil_socio_1', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Estado civil"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Endereço Sócio 1</Label>
                  <Input
                    value={formData.endereco_socio_1}
                    onChange={(e) => handleInputChange('endereco_socio_1', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Endereço completo"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Telefone Sócio 1</Label>
                  <Input
                    value={formData.telefone_socio_1}
                    onChange={(e) => handleInputChange('telefone_socio_1', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="(11) 91234-5678"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Email Sócio 1</Label>
                  <Input
                    value={formData.email_socio_1}
                    onChange={(e) => handleInputChange('email_socio_1', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Certidão Casamento Sócio 1</Label>
                  <Input
                    value={formData.certidao_casamento_socio_1}
                    onChange={(e) => handleInputChange('certidao_casamento_socio_1', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Número da certidão"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Certificado Digital */}
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <CardHeader>
              <CardTitle className="text-white">Certificado Digital</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-200">Possui Certificado Digital</Label>
                <Select value={formData.tem_certificado_digital} onValueChange={(value) => handleInputChange('tem_certificado_digital', value)}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="sim">Sim</SelectItem>
                    <SelectItem value="nao">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-200">Data de Vencimento</Label>
                <Input
                  type="date"
                  value={formData.data_vencimento_certificado}
                  onChange={(e) => handleInputChange('data_vencimento_certificado', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              <div>
                <Label className="text-gray-200">Quem Fez o Certificado</Label>
                <Input
                  value={formData.emissor_certificado}
                  onChange={(e) => handleInputChange('emissor_certificado', e.target.value)}
                  placeholder="Ex: Serasa, AC Certisign, etc."
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              <div>
                <Label className="text-gray-200">Observações do Certificado</Label>
                <Textarea
                  value={formData.observacoes_certificado}
                  onChange={(e) => handleInputChange('observacoes_certificado', e.target.value)}
                  placeholder="Observações sobre o certificado..."
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Procurações */}
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <CardHeader>
              <CardTitle className="text-white">Procurações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Procuração Pessoa Jurídica */}
              <div className="border border-gray-600 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-4">Procuração Pessoa Jurídica</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-200">Possui Procuração PJ</Label>
                    <Select value={formData.tem_procuracao_pj} onValueChange={(value) => handleInputChange('tem_procuracao_pj', value)}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="sim">Sim</SelectItem>
                        <SelectItem value="nao">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-200">Data de Vencimento PJ</Label>
                    <Input
                      type="date"
                      value={formData.data_vencimento_procuracao_pj}
                      onChange={(e) => handleInputChange('data_vencimento_procuracao_pj', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-gray-200">Observações Procuração PJ</Label>
                    <Textarea
                      value={formData.observacoes_procuracao_pj}
                      onChange={(e) => handleInputChange('observacoes_procuracao_pj', e.target.value)}
                      placeholder="Observações sobre a procuração pessoa jurídica..."
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* Procuração Pessoa Física */}
              <div className="border border-gray-600 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-4">Procuração Pessoa Física</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-200">Possui Procuração PF</Label>
                    <Select value={formData.tem_procuracao_pf} onValueChange={(value) => handleInputChange('tem_procuracao_pf', value)}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="sim">Sim</SelectItem>
                        <SelectItem value="nao">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-200">Data de Vencimento PF</Label>
                    <Input
                      type="date"
                      value={formData.data_vencimento_procuracao_pf}
                      onChange={(e) => handleInputChange('data_vencimento_procuracao_pf', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-gray-200">Observações Procuração PF</Label>
                    <Textarea
                      value={formData.observacoes_procuracao_pf}
                      onChange={(e) => handleInputChange('observacoes_procuracao_pf', e.target.value)}
                      placeholder="Observações sobre a procuração pessoa física..."
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Dívidas Tributárias */}
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <CardHeader>
              <CardTitle className="text-white">Status Dívidas Tributárias</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Débitos */}
              <div className="border border-gray-600 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-4">Débitos</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-200">Possui Débitos</Label>
                    <Select value={formData.tem_debitos} onValueChange={(value) => handleInputChange('tem_debitos', value)}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="sim">Sim</SelectItem>
                        <SelectItem value="nao">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-gray-200">Observações sobre Débitos</Label>
                    <Textarea
                      value={formData.observacoes_debitos}
                      onChange={(e) => handleInputChange('observacoes_debitos', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      placeholder="Observações sobre débitos tributários..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Parcelamentos */}
              <div className="border border-gray-600 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-4">Parcelamentos</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-200">Possui Parcelamentos</Label>
                    <Select value={formData.tem_parcelamentos} onValueChange={(value) => handleInputChange('tem_parcelamentos', value)}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="sim">Sim</SelectItem>
                        <SelectItem value="nao">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-gray-200">Observações sobre Parcelamentos</Label>
                    <Textarea
                      value={formData.observacoes_parcelamentos}
                      onChange={(e) => handleInputChange('observacoes_parcelamentos', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      placeholder="Observações sobre parcelamentos tributários..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Dívida Ativa */}
              <div className="border border-gray-600 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-4">Dívida Ativa</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-200">Possui Dívida Ativa</Label>
                    <Select value={formData.tem_divida_ativa} onValueChange={(value) => handleInputChange('tem_divida_ativa', value)}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="sim">Sim</SelectItem>
                        <SelectItem value="nao">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-gray-200">Observações sobre Dívida Ativa</Label>
                    <Textarea
                      value={formData.observacoes_divida_ativa}
                      onChange={(e) => handleInputChange('observacoes_divida_ativa', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      placeholder="Observações sobre dívida ativa..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Informações de Mensalidade */}
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <CardHeader>
              <CardTitle className="text-white">Mensalidade e Pagamentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-200">Mensalidade com Faturamento</Label>
                  <Input
                    value={formData.mensalidade_com_faturamento}
                    onChange={(e) => handleInputChange('mensalidade_com_faturamento', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="R$ 0,00"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Mensalidade sem Faturamento</Label>
                  <Input
                    value={formData.mensalidade_sem_faturamento}
                    onChange={(e) => handleInputChange('mensalidade_sem_faturamento', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="R$ 0,00"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Valor Mensalidade</Label>
                  <Input
                    value={formData.valor_mensalidade}
                    onChange={(e) => handleInputChange('valor_mensalidade', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="R$ 0,00"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Data Vencimento</Label>
                  <Input
                    value={formData.data_vencimento}
                    onChange={(e) => handleInputChange('data_vencimento', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Dia do vencimento"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-gray-200">Observações sobre Mensalidade e Negociação</Label>
                  <Textarea
                    value={formData.observacoes_mensalidade}
                    onChange={(e) => handleInputChange('observacoes_mensalidade', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Observações sobre negociação do cliente, histórico de pagamentos, acordos especiais..."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>



          {/* Sócios Adicionais */}
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                Sócios Adicionais
                <Button
                  type="button"
                  onClick={handleAddSocio}
                  size="sm"
                  style={{ backgroundColor: '#22c55e', color: 'white' }}
                  className="hover:bg-green-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Sócio
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {socios.map((socio, index) => (
                <div key={index} className="p-4 border border-gray-600 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-white">Sócio {index + 2}</h4>
                    <Button
                      type="button"
                      onClick={() => handleRemoveSocio(index)}
                      size="sm"
                      variant="destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-200">Nome Completo</Label>
                      <Input
                        value={socio.nome_completo}
                        onChange={(e) => handleSocioChange(index, 'nome_completo', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        placeholder="Nome completo"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-200">CPF</Label>
                      <div className="flex gap-2">
                        <Input
                          value={socio.cpf}
                          onChange={(e) => handleSocioChange(index, 'cpf', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          placeholder="000.000.000-00"
                        />
                        <Button
                          type="button"
                          onClick={() => copyToClipboard(socio.cpf, 'CPF')}
                          size="sm"
                          variant="outline"
                          className="border-gray-600 text-white hover:bg-gray-700"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-200">Senha do Gov</Label>
                      <div className="flex gap-2">
                        <Input
                          value={socio.senha_gov}
                          onChange={(e) => handleSocioChange(index, 'senha_gov', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          placeholder="Senha gov.br"
                        />
                        <Button
                          type="button"
                          onClick={() => copyToClipboard(socio.senha_gov, 'Senha Gov')}
                          size="sm"
                          variant="outline"
                          className="border-gray-600 text-white hover:bg-gray-700"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-200">RG</Label>
                      <Input
                        value={socio.rg}
                        onChange={(e) => handleSocioChange(index, 'rg', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        placeholder="RG"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-200">Data de Nascimento</Label>
                      <Input
                        type="date"
                        value={socio.data_nascimento}
                        onChange={(e) => handleSocioChange(index, 'data_nascimento', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-200">Estado Civil</Label>
                      <Select value={socio.estado_civil} onValueChange={(value) => handleSocioChange(index, 'estado_civil', value)}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                          <SelectItem value="casado">Casado(a)</SelectItem>
                          <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                          <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-gray-200">Regime de Casamento</Label>
                      <Select value={socio.regime_casamento} onValueChange={(value) => handleSocioChange(index, 'regime_casamento', value)}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="comunhao_parcial">Comunhão Parcial</SelectItem>
                          <SelectItem value="comunhao_total">Comunhão Total</SelectItem>
                          <SelectItem value="separacao_total">Separação Total</SelectItem>
                          <SelectItem value="participacao_final">Participação Final</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-gray-200">Profissão</Label>
                      <Input
                        value={socio.profissao}
                        onChange={(e) => handleSocioChange(index, 'profissao', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        placeholder="Profissão"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-200">Participação (%)</Label>
                      <Input
                        value={socio.participacao_sociedade}
                        onChange={(e) => handleSocioChange(index, 'participacao_sociedade', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        placeholder="50%"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>



          {/* Imposto de Renda Pessoa Física */}
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <CardHeader>
              <CardTitle className="text-white">Imposto de Renda Pessoa Física</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-200">Declara IR</Label>
                  <Select value={formData.imposto_renda} onValueChange={(value) => handleInputChange('imposto_renda', value)}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="sim">Sim</SelectItem>
                      <SelectItem value="nao">Não</SelectItem>
                      <SelectItem value="isento">Isento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-200">Ano de Referência</Label>
                  <Input
                    value={formData.ir_ano_referencia || new Date().getFullYear()}
                    onChange={(e) => handleInputChange('ir_ano_referencia', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="2024"
                    type="number"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Status da Declaração</Label>
                  <Select value={formData.ir_status} onValueChange={(value) => handleInputChange('ir_status', value)}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="aguardando_informacoes">Aguardando Informações</SelectItem>
                      <SelectItem value="nao_entregue">Não Entregue</SelectItem>
                      <SelectItem value="entregue">Entregue</SelectItem>
                      <SelectItem value="em_processamento">Em Processamento</SelectItem>
                      <SelectItem value="pendente_retificacao">Pendente Retificação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-200">Data de Entrega</Label>
                  <Input
                    type="date"
                    value={formData.ir_data_entrega}
                    onChange={(e) => handleInputChange('ir_data_entrega', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Valor a Pagar</Label>
                  <Input
                    value={formData.ir_valor_pagar}
                    onChange={(e) => handleInputChange('ir_valor_pagar', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="R$ 0,00"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Valor a Restituir</Label>
                  <Input
                    value={formData.ir_valor_restituir}
                    onChange={(e) => handleInputChange('ir_valor_restituir', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="R$ 0,00"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-gray-200">Observações IR</Label>
                  <Textarea
                    value={formData.ir_observacoes}
                    onChange={(e) => handleInputChange('ir_observacoes', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Observações sobre o Imposto de Renda..."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campos Personalizados */}
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <CardHeader>
              <CardTitle className="text-white">Campos Personalizados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <p className="text-gray-400">Nenhum campo personalizado adicionado ainda.</p>
                <p className="text-gray-500 text-sm mt-2">Esta seção ficará disponível para campos customizados no futuro.</p>
              </div>
            </CardContent>
          </Card>

          {/* Status Operacional */}
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <CardHeader>
              <CardTitle className="text-white">Status Operacional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-200">Status DAS</Label>
                  <Input
                    value={formData.status_das}
                    onChange={(e) => handleInputChange('status_das', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Status DAS"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Status Envio</Label>
                  <Input
                    value={formData.status_envio}
                    onChange={(e) => handleInputChange('status_envio', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Status de envio"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-gray-200">Link MEI</Label>
                  <Input
                    value={formData.link_mei}
                    onChange={(e) => handleInputChange('link_mei', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Link MEI"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                console.log('Navegando para /clientes');
                window.location.href = '/clientes';
              }}
              className="border-gray-600 text-white hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Clientes
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              style={{ backgroundColor: '#22c55e', color: 'white' }}
              className="hover:bg-green-600"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Salvando...' : 'Salvar Cliente'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
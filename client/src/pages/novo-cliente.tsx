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

  // Estados para dados do cliente
  const [formData, setFormData] = useState({
    // Dados básicos
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    inscricao_estadual: '',
    inscricao_municipal: '',
    data_abertura: '',
    cliente_desde: '',
    
    // Endereço
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    
    // Contato
    telefone_empresa: '',
    email_empresa: '',
    contato: '',
    celular: '',
    
    // Informações tributárias
    regime_tributario: '',
    atividade_principal: '',
    capital_social: '',
    
    // Informações bancárias
    banco: '',
    agencia: '',
    conta_corrente: '',
    
    // Certificados digitais
    certificado_a1: '',
    certificado_a3: '',
    senha_certificado: '',
    validade_certificado: '',
    
    // Procurações
    procuracao_receita: '',
    procuracao_previdencia: '',
    procuracao_estadual: '',
    procuracao_municipal: '',
    
    // Google Drive
    link_pasta_drive: '',
    
    // Outros
    observacoes: '',
    status: 'ativo',
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
          {/* Dados Básicos */}
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <CardHeader>
              <CardTitle className="text-white">Dados Básicos</CardTitle>
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
                  <Label className="text-gray-200">Inscrição Estadual</Label>
                  <Input
                    value={formData.inscricao_estadual}
                    onChange={(e) => handleInputChange('inscricao_estadual', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Inscrição estadual"
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
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <CardHeader>
              <CardTitle className="text-white">Endereço</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label className="text-gray-200">Endereço Completo</Label>
                  <Input
                    value={formData.endereco}
                    onChange={(e) => handleInputChange('endereco', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Rua, número, bairro"
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

          {/* Contato */}
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
              </div>
            </CardContent>
          </Card>

          {/* Informações Tributárias */}
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <CardHeader>
              <CardTitle className="text-white">Informações Tributárias</CardTitle>
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
                  <Label className="text-gray-200">Capital Social</Label>
                  <Input
                    value={formData.capital_social}
                    onChange={(e) => handleInputChange('capital_social', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="R$ 0,00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sócios */}
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                Sócios
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
                    <h4 className="text-lg font-semibold text-white">Sócio {index + 1}</h4>
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

          {/* Observações */}
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <CardHeader>
              <CardTitle className="text-white">Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                placeholder="Observações adicionais sobre o cliente..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation('/clientes')}
              className="border-gray-600 text-white hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancelar
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
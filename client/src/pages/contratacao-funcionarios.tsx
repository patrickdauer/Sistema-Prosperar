import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Building2, UserPlus, FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

// Schema de validação
const contratacaoSchema = z.object({
  // Dados da Empresa
  razaoSocial: z.string().min(2, "Razão social é obrigatória"),
  cnpj: z.string().min(14, "CNPJ deve ter 14 dígitos").max(18, "CNPJ inválido"),
  endereco: z.string().min(5, "Endereço é obrigatório"),
  telefone: z.string().min(10, "Telefone é obrigatório"),
  email: z.string().email("Email inválido"),
  responsavel: z.string().min(2, "Nome do responsável é obrigatório"),
  
  // Dados do Funcionário
  nomeFuncionario: z.string().min(2, "Nome do funcionário é obrigatório"),
  cpfFuncionario: z.string().min(11, "CPF deve ter 11 dígitos").max(14, "CPF inválido"),
  rgFuncionario: z.string().min(7, "RG é obrigatório"),
  dataNascimento: z.string().min(1, "Data de nascimento é obrigatória"),
  estadoCivil: z.enum(["solteiro", "casado", "divorciado", "viuvo", "uniao_estavel"]),
  escolaridade: z.enum(["fundamental", "medio", "superior", "pos_graduacao", "mestrado", "doutorado"]),
  endereco_funcionario: z.string().min(5, "Endereço do funcionário é obrigatório"),
  telefone_funcionario: z.string().min(10, "Telefone do funcionário é obrigatório"),
  email_funcionario: z.string().email("Email do funcionário inválido"),
  
  // Dados do Cargo
  cargo: z.string().min(2, "Cargo é obrigatório"),
  setor: z.string().min(2, "Setor é obrigatório"),
  salario: z.string().min(1, "Salário é obrigatório"),
  cargaHoraria: z.enum(["20h", "30h", "40h", "44h"]),
  tipoContrato: z.enum(["clt", "pj", "temporario", "estagio", "aprendiz"]),
  dataAdmissao: z.string().min(1, "Data de admissão é obrigatória"),
  
  // Benefícios
  valeTransporte: z.boolean().default(false),
  valeRefeicao: z.boolean().default(false),
  valeAlimentacao: z.boolean().default(false),
  planoSaude: z.boolean().default(false),
  planoDental: z.boolean().default(false),
  seguroVida: z.boolean().default(false),
  
  // Documentos e Observações
  possuiCarteira: z.enum(["sim", "nao"]),
  numeroPis: z.string().optional(),
  observacoes: z.string().optional(),
  
  // Dados Bancários
  banco: z.string().min(1, "Banco é obrigatório"),
  agencia: z.string().min(1, "Agência é obrigatória"),
  conta: z.string().min(1, "Conta é obrigatória"),
  tipoConta: z.enum(["corrente", "poupanca"])
});

type ContratacaoForm = z.infer<typeof contratacaoSchema>;

export default function ContratacaoFuncionarios() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContratacaoForm>({
    resolver: zodResolver(contratacaoSchema),
    defaultValues: {
      valeTransporte: false,
      valeRefeicao: false,
      valeAlimentacao: false,
      planoSaude: false,
      planoDental: false,
      seguroVida: false,
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (data: ContratacaoForm) => {
      const response = await fetch('/api/contratacao-funcionarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar solicitação');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Solicitação enviada com sucesso!",
        description: "Entraremos em contato em breve para finalizar o processo.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar solicitação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContratacaoForm) => {
    setIsSubmitting(true);
    submitMutation.mutate(data);
    setTimeout(() => setIsSubmitting(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4 text-gray-300 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao início
            </Button>
          </Link>
          <div className="text-center">
            <div className="flex justify-center items-center mb-6">
              <div className="bg-blue-600 p-4 rounded-lg mb-4">
                <UserPlus className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              CONTRATAÇÃO DE FUNCIONÁRIOS
            </h1>
            <p className="text-gray-300">
              Prosperar Contabilidade - Formulário de Solicitação
            </p>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Dados da Empresa */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Building2 className="h-5 w-5 mr-2 text-blue-500" />
                Dados da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="razaoSocial" className="text-gray-200">Razão Social *</Label>
                  <Input
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    id="razaoSocial"
                    {...form.register("razaoSocial")}
                    placeholder="Digite a razão social da empresa"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                  {form.formState.errors.razaoSocial && (
                    <p className="text-sm text-red-400 mt-1">
                      {form.formState.errors.razaoSocial.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="cnpj" className="text-gray-200">CNPJ *</Label>
                  <Input
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    id="cnpj"
                    {...form.register("cnpj")}
                    placeholder="00.000.000/0000-00"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                  {form.formState.errors.cnpj && (
                    <p className="text-sm text-red-400 mt-1">
                      {form.formState.errors.cnpj.message}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="endereco" className="text-gray-200">Endereço Completo *</Label>
                  <Input
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    id="endereco"
                    {...form.register("endereco")}
                    placeholder="Rua, número, bairro, cidade, CEP"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                  {form.formState.errors.endereco && (
                    <p className="text-sm text-red-400 mt-1">
                      {form.formState.errors.endereco.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="telefone" className="text-gray-200">Telefone *</Label>
                  <Input
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    id="telefone"
                    {...form.register("telefone")}
                    placeholder="(00) 00000-0000"
                  />
                  {form.formState.errors.telefone && (
                    <p className="text-sm text-red-400 mt-1">
                      {form.formState.errors.telefone.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email" className="text-gray-200">Email *</Label>
                  <Input
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    id="email"
                    type="email"
                    {...form.register("email")}
                    placeholder="empresa@email.com"
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-400 mt-1">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="responsavel" className="text-gray-200">Responsável pela Solicitação *</Label>
                  <Input
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    id="responsavel"
                    {...form.register("responsavel")}
                    placeholder="Nome completo do responsável"
                  />
                  {form.formState.errors.responsavel && (
                    <p className="text-sm text-red-400 mt-1">
                      {form.formState.errors.responsavel.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados do Funcionário */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <UserPlus className="h-5 w-5 mr-2 text-blue-500" />
                Dados do Funcionário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nomeFuncionario" className="text-gray-200">Nome Completo *</Label>
                  <Input
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    id="nomeFuncionario"
                    {...form.register("nomeFuncionario")}
                    placeholder="Nome completo do funcionário"
                  />
                  {form.formState.errors.nomeFuncionario && (
                    <p className="text-sm text-red-400 mt-1">
                      {form.formState.errors.nomeFuncionario.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="cpfFuncionario" className="text-gray-200">CPF *</Label>
                  <Input
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    id="cpfFuncionario"
                    {...form.register("cpfFuncionario")}
                    placeholder="000.000.000-00"
                  />
                  {form.formState.errors.cpfFuncionario && (
                    <p className="text-sm text-red-400 mt-1">
                      {form.formState.errors.cpfFuncionario.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="rgFuncionario" className="text-gray-200">RG *</Label>
                  <Input
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    id="rgFuncionario"
                    {...form.register("rgFuncionario")}
                    placeholder="0.000.000"
                  />
                  {form.formState.errors.rgFuncionario && (
                    <p className="text-sm text-red-400 mt-1">
                      {form.formState.errors.rgFuncionario.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="dataNascimento" className="text-gray-200">Data de Nascimento *</Label>
                  <Input
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    id="dataNascimento"
                    type="date"
                    {...form.register("dataNascimento")}
                  />
                  {form.formState.errors.dataNascimento && (
                    <p className="text-sm text-red-400 mt-1">
                      {form.formState.errors.dataNascimento.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Estado Civil *</Label>
                  <Select onValueChange={(value) => form.setValue("estadoCivil", value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estado civil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                      <SelectItem value="casado">Casado(a)</SelectItem>
                      <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                      <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                      <SelectItem value="uniao_estavel">União Estável</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.estadoCivil && (
                    <p className="text-sm text-red-400 mt-1">
                      {form.formState.errors.estadoCivil.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Escolaridade *</Label>
                  <Select onValueChange={(value) => form.setValue("escolaridade", value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a escolaridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fundamental">Ensino Fundamental</SelectItem>
                      <SelectItem value="medio">Ensino Médio</SelectItem>
                      <SelectItem value="superior">Ensino Superior</SelectItem>
                      <SelectItem value="pos_graduacao">Pós-graduação</SelectItem>
                      <SelectItem value="mestrado">Mestrado</SelectItem>
                      <SelectItem value="doutorado">Doutorado</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.escolaridade && (
                    <p className="text-sm text-red-400 mt-1">
                      {form.formState.errors.escolaridade.message}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="endereco_funcionario" className="text-gray-200">Endereço Completo *</Label>
                  <Input
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    id="endereco_funcionario"
                    {...form.register("endereco_funcionario")}
                    placeholder="Rua, número, bairro, cidade, CEP"
                  />
                  {form.formState.errors.endereco_funcionario && (
                    <p className="text-sm text-red-400 mt-1">
                      {form.formState.errors.endereco_funcionario.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="telefone_funcionario" className="text-gray-200">Telefone *</Label>
                  <Input
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    id="telefone_funcionario"
                    {...form.register("telefone_funcionario")}
                    placeholder="(00) 00000-0000"
                  />
                  {form.formState.errors.telefone_funcionario && (
                    <p className="text-sm text-red-400 mt-1">
                      {form.formState.errors.telefone_funcionario.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email_funcionario" className="text-gray-200">Email *</Label>
                  <Input
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    id="email_funcionario"
                    type="email"
                    {...form.register("email_funcionario")}
                    placeholder="funcionario@email.com"
                  />
                  {form.formState.errors.email_funcionario && (
                    <p className="text-sm text-red-400 mt-1">
                      {form.formState.errors.email_funcionario.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados do Cargo */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <FileText className="h-5 w-5 mr-2 text-blue-500" />
                Dados do Cargo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cargo" className="text-gray-200">Cargo *</Label>
                  <Input
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    id="cargo"
                    {...form.register("cargo")}
                    placeholder="Ex: Analista, Assistente, Gerente"
                  />
                  {form.formState.errors.cargo && (
                    <p className="text-sm text-red-400 mt-1">
                      {form.formState.errors.cargo.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="setor" className="text-gray-200">Setor *</Label>
                  <Input
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    id="setor"
                    {...form.register("setor")}
                    placeholder="Ex: Administrativo, Vendas, Produção"
                  />
                  {form.formState.errors.setor && (
                    <p className="text-sm text-red-400 mt-1">
                      {form.formState.errors.setor.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="salario" className="text-gray-200">Salário *</Label>
                  <Input
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    id="salario"
                    {...form.register("salario")}
                    placeholder="R$ 0,00"
                  />
                  {form.formState.errors.salario && (
                    <p className="text-sm text-red-400 mt-1">
                      {form.formState.errors.salario.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Carga Horária *</Label>
                  <Select onValueChange={(value) => form.setValue("cargaHoraria", value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a carga horária" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20h">20 horas semanais</SelectItem>
                      <SelectItem value="30h">30 horas semanais</SelectItem>
                      <SelectItem value="40h">40 horas semanais</SelectItem>
                      <SelectItem value="44h">44 horas semanais</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.cargaHoraria && (
                    <p className="text-sm text-red-400 mt-1">
                      {form.formState.errors.cargaHoraria.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Tipo de Contrato *</Label>
                  <Select onValueChange={(value) => form.setValue("tipoContrato", value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de contrato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clt">CLT</SelectItem>
                      <SelectItem value="pj">Pessoa Jurídica</SelectItem>
                      <SelectItem value="temporario">Temporário</SelectItem>
                      <SelectItem value="estagio">Estágio</SelectItem>
                      <SelectItem value="aprendiz">Jovem Aprendiz</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.tipoContrato && (
                    <p className="text-sm text-red-400 mt-1">
                      {form.formState.errors.tipoContrato.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="dataAdmissao" className="text-gray-200">Data de Admissão *</Label>
                  <Input
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    id="dataAdmissao"
                    type="date"
                    {...form.register("dataAdmissao")}
                  />
                  {form.formState.errors.dataAdmissao && (
                    <p className="text-sm text-red-400 mt-1">
                      {form.formState.errors.dataAdmissao.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefícios */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Benefícios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { key: 'valeTransporte', label: 'Vale Transporte' },
                  { key: 'valeRefeicao', label: 'Vale Refeição' },
                  { key: 'valeAlimentacao', label: 'Vale Alimentação' },
                  { key: 'planoSaude', label: 'Plano de Saúde' },
                  { key: 'planoDental', label: 'Plano Dental' },
                  { key: 'seguroVida', label: 'Seguro de Vida' }
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={form.watch(key as any)}
                      onCheckedChange={(checked) => form.setValue(key as any, checked)}
                    />
                    <Label htmlFor={key}>{label}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Dados Bancários */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Dados Bancários</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="banco" className="text-gray-200">Banco *</Label>
                  <Input
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    id="banco"
                    {...form.register("banco")}
                    placeholder="Nome do banco"
                  />
                  {form.formState.errors.banco && (
                    <p className="text-sm text-red-400 mt-1">
                      {form.formState.errors.banco.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="agencia" className="text-gray-200">Agência *</Label>
                  <Input
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    id="agencia"
                    {...form.register("agencia")}
                    placeholder="0000"
                  />
                  {form.formState.errors.agencia && (
                    <p className="text-sm text-red-400 mt-1">
                      {form.formState.errors.agencia.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="conta" className="text-gray-200">Conta *</Label>
                  <Input
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    id="conta"
                    {...form.register("conta")}
                    placeholder="00000-0"
                  />
                  {form.formState.errors.conta && (
                    <p className="text-sm text-red-400 mt-1">
                      {form.formState.errors.conta.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Tipo de Conta *</Label>
                  <RadioGroup
                    onValueChange={(value) => form.setValue("tipoConta", value as any)}
                    className="flex space-x-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="corrente" id="corrente" />
                      <Label htmlFor="corrente" className="text-gray-200">Conta Corrente</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="poupanca" id="poupanca" />
                      <Label htmlFor="poupanca" className="text-gray-200">Poupança</Label>
                    </div>
                  </RadioGroup>
                  {form.formState.errors.tipoConta && (
                    <p className="text-sm text-red-400 mt-1">
                      {form.formState.errors.tipoConta.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Adicionais */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Informações Adicionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Possui Carteira de Trabalho? *</Label>
                <RadioGroup
                  onValueChange={(value) => form.setValue("possuiCarteira", value as any)}
                  className="flex space-x-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="sim" />
                    <Label htmlFor="sim" className="text-gray-200">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="nao" />
                    <Label htmlFor="nao" className="text-gray-200">Não</Label>
                  </div>
                </RadioGroup>
                {form.formState.errors.possuiCarteira && (
                  <p className="text-sm text-red-400 mt-1">
                    {form.formState.errors.possuiCarteira.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="numeroPis" className="text-gray-200">Número do PIS</Label>
                <Input
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  id="numeroPis"
                  {...form.register("numeroPis")}
                  placeholder="000.00000.00-0"
                />
              </div>

              <div>
                <Label htmlFor="observacoes" className="text-gray-200">Observações</Label>
                <Textarea
                  id="observacoes"
                  {...form.register("observacoes")}
                  placeholder="Informações adicionais relevantes"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Botão de Envio */}
          <div className="flex justify-center">
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Enviar Solicitação
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-400">
          <p>© 2024 Prosperar Contabilidade - Todos os direitos reservados</p>
        </div>
      </div>
    </div>
  );
}
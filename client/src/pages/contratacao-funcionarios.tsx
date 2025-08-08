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
import { FileUpload } from '@/components/file-upload';
import { BackToHomeButton } from '@/components/back-to-home-button';
import { useToast } from '@/hooks/use-toast';
import { Building2, UserPlus, FileText, ArrowLeft, Upload, Calculator } from 'lucide-react';
import { Link } from 'wouter';

// Schema para dependentes
const dependenteSchema = z.object({
  nomeCompleto: z.string().min(2, "Nome completo é obrigatório"),
  dataNascimento: z.string().min(1, "Data de nascimento é obrigatória"),
  cpf: z.string().min(11, "CPF deve ter 11 dígitos").max(14, "CPF inválido")
});

// Schema de validação - apenas o termo de ciência é obrigatório
const contratacaoSchema = z.object({
  // Dados da Empresa
  razaoSocial: z.string().optional(),
  cnpj: z.string().optional(),
  endereco: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().optional(),
  responsavel: z.string().optional(),
  
  // Dados do Funcionário
  nomeFuncionario: z.string().optional(),
  nomeMae: z.string().optional(),
  cpfFuncionario: z.string().optional(),
  rgFuncionario: z.string().optional(),
  dataNascimento: z.string().optional(),
  estadoCivil: z.enum(["solteiro", "casado", "divorciado", "viuvo", "uniao_estavel"]).optional(),
  escolaridade: z.enum(["fundamental", "medio", "superior", "pos_graduacao", "mestrado", "doutorado"]).optional(),
  endereco_funcionario: z.string().optional(),
  telefone_funcionario: z.string().optional(),
  email_funcionario: z.string().optional(),
  
  // Dependentes
  dependentes: z.array(dependenteSchema).optional(),
  
  // Dados do Cargo
  cargo: z.string().optional(),
  setor: z.string().optional(),
  salario: z.string().optional(),
  cargaHoraria: z.enum(["20h", "30h", "40h", "44h"]).optional(),
  tipoContrato: z.enum(["clt", "pj", "temporario", "estagio", "aprendiz"]).optional(),
  dataAdmissao: z.string().optional(),
  
  // Benefícios
  valeTransporte: z.boolean().default(false),
  valeRefeicao: z.boolean().default(false),
  valeAlimentacao: z.boolean().default(false),
  planoSaude: z.boolean().default(false),
  planoDental: z.boolean().default(false),
  seguroVida: z.boolean().default(false),
  
  // Dados Bancários
  banco: z.string().optional(),
  agencia: z.string().optional(),
  conta: z.string().optional(),
  tipoConta: z.enum(["corrente", "poupanca"]).optional(),
  
  // Informações Adicionais
  possuiCarteira: z.enum(["sim", "nao"]).optional(),
  numeroPis: z.string().optional(),
  observacoes: z.string().optional(),
  
  // Termo de Ciência - ÚNICO CAMPO OBRIGATÓRIO
  termoCiencia: z.boolean().refine(val => val === true, {
    message: "Você deve marcar esta caixa para concordar com as obrigações legais."
  })
});

type ContratacaoForm = z.infer<typeof contratacaoSchema>;

type Dependente = z.infer<typeof dependenteSchema>;

export default function ContratacaoFuncionarios() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentos, setDocumentos] = useState<File[]>([]);
  const [dependentes, setDependentes] = useState<Dependente[]>([]);

  // Simplified schema - only termoCiencia is required
  const formSchema = z.object({
    termoCiencia: z.boolean().refine(val => val === true, {
      message: "Você deve marcar esta caixa para concordar com as obrigações legais."
    })
  }).passthrough();

  const form = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      valeTransporte: false,
      valeRefeicao: false,
      valeAlimentacao: false,
      planoSaude: false,
      planoDental: false,
      seguroVida: false,
      termoCiencia: false,
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      
      // Adicionar dados do formulário
      Object.keys(data).forEach(key => {
        const value = data[key];
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });
      
      // Adicionar dependentes
      if (dependentes.length > 0) {
        formData.append('dependentes', JSON.stringify(dependentes));
      }
      
      // Adicionar documentos
      documentos.forEach((file) => {
        formData.append('documento', file);
      });

      const response = await fetch('/api/contratacao-funcionarios', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar solicitação');
      }

      return response.json();
    },
    onSuccess: (responseData: any) => {
      console.log("Response data:", responseData);
      
      // Use the complete message from server that includes download links
      const description = responseData.message || "Entraremos em contato em breve para finalizar o processo.";
      
      toast({
        title: "✅ Sucesso!",
        description,
        duration: 10000, // 10 seconds to allow reading the links
      });
      
      // Show download links in console for easy access
      if (responseData.publicDownloadLinks) {
        console.log("📎 Links públicos de download (válidos por 7 dias):");
        responseData.publicDownloadLinks.forEach((link: any) => {
          console.log(`📄 ${link.name}: ${link.url}`);
        });
        
        // Also show a browser alert with clickable links
        const linksText = responseData.publicDownloadLinks
          .map((link: any) => `${link.name}: ${link.url}`)
          .join('\n\n');
        
        let alertMessage = `📎 Links de Download (válidos por 7 dias):\n\n${linksText}`;
        
        // Add Object Storage folder link if available
        if (responseData.externalFolderLink) {
          alertMessage += `\n\n📁 Pasta no Object Storage:\n${responseData.externalFolderLink}`;
        }
        
        alertMessage += `\n\nOu verifique o console (F12) para copiar os links.`;
        
        setTimeout(() => {
          alert(alertMessage);
        }, 1000);
      }
      
      form.reset();
      setDocumentos([]);
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
    console.log("Form data:", data);
    console.log("Form errors:", form.formState.errors);
    setIsSubmitting(true);
    submitMutation.mutate(data);
    setTimeout(() => setIsSubmitting(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <BackToHomeButton isPublicPage={true} />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center">
            <div className="flex justify-center items-center mb-6">
              <div className="w-24 h-16">
                <img 
                  src="/logo-prosperar.png" 
                  alt="Prosperar Contabilidade" 
                  className="w-full h-full object-contain"
                />
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
                  <Label htmlFor="razaoSocial" className="text-gray-200">Razão Social</Label>
                  <Input className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
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
                  <Label htmlFor="cnpj" className="text-gray-200">CNPJ</Label>
                  <Input className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
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
                  <Label htmlFor="endereco" className="text-gray-200">Endereço Completo</Label>
                  <Input className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
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
                  <Label htmlFor="telefone" className="text-gray-200">Telefone</Label>
                  <Input className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
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
                  <Label htmlFor="email" className="text-gray-200">Email</Label>
                  <Input className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
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
                  <Label htmlFor="responsavel" className="text-gray-200">Responsável pela Solicitação</Label>
                  <Input className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
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
                  <Label htmlFor="nomeFuncionario" className="text-gray-200">Nome Completo</Label>
                  <Input className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
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
                  <Label htmlFor="nomeMae" className="text-gray-200">Nome da Mãe</Label>
                  <Input className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    id="nomeMae"
                    {...form.register("nomeMae")}
                    placeholder="Nome completo da mãe"
                  />
                  {form.formState.errors.nomeMae && (
                    <p className="text-sm text-red-400 mt-1">
                      {form.formState.errors.nomeMae.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="cpfFuncionario" className="text-gray-200">CPF</Label>
                  <Input className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
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
                  <Label htmlFor="rgFuncionario" className="text-gray-200">RG</Label>
                  <Input className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
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
                  <Label htmlFor="dataNascimento" className="text-gray-200">Data de Nascimento</Label>
                  <Input className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    id="dataNascimento"
                    type="text"
                    placeholder="dd/mm/aaaa"
                    {...form.register("dataNascimento")}
                    onChange={(e) => {
                      // Máscara para formato brasileiro
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length >= 2) {
                        value = value.replace(/(\d{2})(\d)/, '$1/$2');
                      }
                      if (value.length >= 5) {
                        value = value.replace(/(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
                      }
                      if (value.length > 10) {
                        value = value.substring(0, 10);
                      }
                      e.target.value = value;
                      form.setValue("dataNascimento", value);
                    }}
                  />
                  {form.formState.errors.dataNascimento && (
                    <p className="text-sm text-red-400 mt-1">
                      {form.formState.errors.dataNascimento.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-gray-200">Estado Civil</Label>
                  <Select onValueChange={(value) => form.setValue("estadoCivil", value as any)}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Selecione o estado civil" className="placeholder-gray-400" />
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
                  <Label className="text-gray-200">Escolaridade</Label>
                  <Select onValueChange={(value) => form.setValue("escolaridade", value as any)}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Selecione a escolaridade" className="placeholder-gray-400" />
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
                  <Label htmlFor="endereco_funcionario" className="text-gray-200">Endereço Completo</Label>
                  <Input className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
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
                  <Label htmlFor="telefone_funcionario" className="text-gray-200">Telefone</Label>
                  <Input className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
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
                  <Label htmlFor="email_funcionario" className="text-gray-200">Email</Label>
                  <Input className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
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
                  <Label htmlFor="cargo" className="text-gray-200">Cargo</Label>
                  <Input className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
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
                  <Label htmlFor="setor" className="text-gray-200">Setor</Label>
                  <Input className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
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
                  <Label htmlFor="salario" className="text-gray-200">Salário</Label>
                  <Input className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
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
                  <Label className="text-gray-200">Carga Horária</Label>
                  <Select onValueChange={(value) => form.setValue("cargaHoraria", value as any)}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Selecione a carga horária" className="placeholder-gray-400" />
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
                  <Label className="text-gray-200">Tipo de Contrato</Label>
                  <Select onValueChange={(value) => form.setValue("tipoContrato", value as any)}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Selecione o tipo de contrato" className="placeholder-gray-400" />
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
                  <Label htmlFor="dataAdmissao" className="text-gray-200">Data de Admissão</Label>
                  <Input className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    id="dataAdmissao"
                    type="text"
                    placeholder="dd/mm/aaaa"
                    {...form.register("dataAdmissao")}
                    onChange={(e) => {
                      // Máscara para formato brasileiro
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length >= 2) {
                        value = value.replace(/(\d{2})(\d)/, '$1/$2');
                      }
                      if (value.length >= 5) {
                        value = value.replace(/(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
                      }
                      if (value.length > 10) {
                        value = value.substring(0, 10);
                      }
                      e.target.value = value;
                      form.setValue("dataAdmissao", value);
                    }}
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
                  <Label htmlFor="banco" className="text-gray-200">Banco</Label>
                  <Input className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
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
                  <Label htmlFor="agencia" className="text-gray-200">Agência</Label>
                  <Input className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
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
                  <Label htmlFor="conta" className="text-gray-200">Conta</Label>
                  <Input className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
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
                  <Label>Tipo de Conta</Label>
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
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  id="observacoes"
                  {...form.register("observacoes")}
                  placeholder="Informações adicionais relevantes"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Dependentes */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <UserPlus className="h-5 w-5 mr-2 text-green-500" />
                Dependentes (Filhos)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {dependentes.map((dependente, index) => (
                  <div key={index} className="border border-gray-600 rounded-lg p-4 bg-gray-700">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-semibold text-white">Dependente {index + 1}</h4>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          const newDependentes = dependentes.filter((_, i) => i !== index);
                          setDependentes(newDependentes);
                        }}
                      >
                        Remover
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-gray-200">Nome Completo</Label>
                        <Input
                          className="bg-gray-600 border-gray-500 text-white placeholder-gray-400"
                          value={dependente.nomeCompleto}
                          onChange={(e) => {
                            const newDependentes = [...dependentes];
                            newDependentes[index].nomeCompleto = e.target.value;
                            setDependentes(newDependentes);
                          }}
                          placeholder="Nome completo do dependente"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-200">Data de Nascimento</Label>
                        <Input
                          type="text"
                          placeholder="dd/mm/aaaa"
                          className="bg-gray-600 border-gray-500 text-white placeholder-gray-400"
                          value={dependente.dataNascimento}
                          onChange={(e) => {
                            // Máscara para formato brasileiro
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length >= 2) {
                              value = value.replace(/(\d{2})(\d)/, '$1/$2');
                            }
                            if (value.length >= 5) {
                              value = value.replace(/(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
                            }
                            if (value.length > 10) {
                              value = value.substring(0, 10);
                            }
                            e.target.value = value;
                            const newDependentes = [...dependentes];
                            newDependentes[index].dataNascimento = value;
                            setDependentes(newDependentes);
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-gray-200">CPF</Label>
                        <Input
                          className="bg-gray-600 border-gray-500 text-white placeholder-gray-400"
                          value={dependente.cpf}
                          onChange={(e) => {
                            const newDependentes = [...dependentes];
                            newDependentes[index].cpf = e.target.value;
                            setDependentes(newDependentes);
                          }}
                          placeholder="000.000.000-00"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDependentes([...dependentes, { nomeCompleto: '', dataNascimento: '', cpf: '' }]);
                  }}
                  className="w-full bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar Dependente
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Documentos */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Upload className="h-5 w-5 mr-2 text-blue-500" />
                Documentos do Funcionário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <p className="text-sm text-gray-300">Envie os documentos necessários para a contratação (Exame admissional, CNH ou RG e Comprovante de Residência).</p>
                <FileUpload
                  onFilesChange={setDocumentos}
                  accept={{
                    'image/jpeg': ['.jpg', '.jpeg'],
                    'image/png': ['.png'],
                    'application/pdf': ['.pdf']
                  }}
                  maxFiles={10}
                  maxSize={10 * 1024 * 1024} // 10MB
                  label="Documentos do Funcionário"
                  description="Envie até 10 arquivos (PDF, JPG, PNG). Máximo 10MB por arquivo."
                  className="bg-gray-700 border-gray-600"
                />
              </div>
            </CardContent>
          </Card>

          {/* Termo de Ciência */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Declaração de Ciência de Obrigações Trabalhistas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-300 space-y-3">
                <p>
                  Declaro estar ciente de que toda empresa que contrata funcionários é obrigada, por lei, a contratar uma empresa especializada para a elaboração dos seguintes laudos obrigatórios:
                </p>
                
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>LTCAT</strong> (Laudo Técnico das Condições Ambientais de Trabalho)</li>
                  <li><strong>PCMSO</strong> (Programa de Controle Médico de Saúde Ocupacional)</li>
                  <li><strong>PPRA</strong> (Programa de Prevenção de Riscos Ambientais)</li>
                  <li><strong>PPP</strong> (Perfil Profissiográfico Previdenciário)</li>
                  <li>Outros laudos e programas que possam ser exigidos conforme a atividade da empresa.</li>
                </ul>
                
                <p>
                  Além disso, reconheço que é necessário garantir a correta entrega dessas informações ao eSocial, conforme a legislação vigente.
                </p>
                
                <p>
                  Estou ciente de que o descumprimento dessas obrigações pode gerar multas e outras penalidades por parte dos órgãos fiscalizadores.
                </p>
                
                <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4 mt-4">
                  <p className="text-yellow-200">
                    <strong>Observação:</strong> Muitos empresários, por decisão própria, optam por não cumprir integralmente essas exigências e assumem o risco, mesmo que aparentemente nada esteja acontecendo no momento. No entanto, essa conduta não elimina o risco de autuações futuras e possíveis prejuízos. Ressaltamos que a responsabilidade pela contratação dos laudos e pelo envio das informações ao eSocial é exclusiva da empresa contratante, não sendo responsabilidade da contabilidade.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 mt-6">
                <Checkbox
                  id="termoCiencia"
                  checked={form.watch("termoCiencia")}
                  onCheckedChange={(checked) => form.setValue("termoCiencia", checked as boolean)}
                  className="mt-1"
                />
                <Label htmlFor="termoCiencia" className="text-gray-200 text-sm leading-5">
                  Li e estou ciente das obrigações legais descritas acima.
                </Label>
              </div>
              
              {form.formState.errors.termoCiencia && (
                <p className="text-sm text-red-400 mt-2">
                  {form.formState.errors.termoCiencia.message}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Botões */}
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
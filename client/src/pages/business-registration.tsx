import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Building, User, FileUp, Shield, Save, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FileUpload } from '@/components/file-upload';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const businessRegistrationSchema = z.object({
  // Company Data
  razaoSocial: z.string().min(1, "Razão social é obrigatória"),
  nomeFantasia: z.string().min(1, "Nome fantasia é obrigatório"),
  endereco: z.string().min(1, "Endereço é obrigatório"),
  inscricaoImobiliaria: z.string().min(1, "Inscrição imobiliária é obrigatória"),
  metragem: z.number().min(1, "Metragem deve ser maior que 0"),
  telefoneEmpresa: z.string().min(1, "Telefone da empresa é obrigatório"),
  emailEmpresa: z.string().email("Email inválido"),
  capitalSocial: z.string().min(1, "Capital social é obrigatório"),
  atividadePrincipal: z.string().min(1, "Atividade principal é obrigatória"),
  atividadesSecundarias: z.string().optional(),
  atividadesSugeridas: z.array(z.string()).optional(),
  
  // Partner Data
  nomeCompleto: z.string().min(1, "Nome completo é obrigatório"),
  nacionalidade: z.string().min(1, "Nacionalidade é obrigatória"),
  cpf: z.string().min(1, "CPF é obrigatório"),
  senhaGov: z.string().min(1, "Senha do Gov é obrigatória"),
  rg: z.string().min(1, "RG é obrigatório"),
  dataNascimento: z.string().min(1, "Data de nascimento é obrigatória"),
  filiacao: z.string().min(1, "Filiação é obrigatória"),
  profissao: z.string().min(1, "Profissão é obrigatória"),
  estadoCivil: z.string().min(1, "Estado civil é obrigatório"),
  enderecoPessoal: z.string().min(1, "Endereço pessoal é obrigatório"),
  telefonePessoal: z.string().min(1, "Telefone pessoal é obrigatório"),
  emailPessoal: z.string().email("Email inválido"),
});

type BusinessRegistrationForm = z.infer<typeof businessRegistrationSchema>;

export default function BusinessRegistration() {
  const [documentoComFoto, setDocumentoComFoto] = useState<File[]>([]);
  const [certidaoCasamento, setCertidaoCasamento] = useState<File[]>([]);
  const [documentosAdicionais, setDocumentosAdicionais] = useState<File[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { toast } = useToast();
  
  const form = useForm<BusinessRegistrationForm>({
    resolver: zodResolver(businessRegistrationSchema),
    defaultValues: {
      razaoSocial: '',
      nomeFantasia: '',
      endereco: '',
      inscricaoImobiliaria: '',
      metragem: 0,
      telefoneEmpresa: '',
      emailEmpresa: '',
      capitalSocial: '',
      atividadePrincipal: '',
      atividadesSecundarias: '',
      atividadesSugeridas: [],
      nomeCompleto: '',
      nacionalidade: 'Brasileira',
      cpf: '',
      senhaGov: '',
      rg: '',
      dataNascimento: '',
      filiacao: '',
      profissao: '',
      estadoCivil: '',
      enderecoPessoal: '',
      telefonePessoal: '',
      emailPessoal: '',
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (data: BusinessRegistrationForm) => {
      const formData = new FormData();
      formData.append('data', JSON.stringify(data));
      
      if (documentoComFoto[0]) {
        formData.append('documentoComFoto', documentoComFoto[0]);
      }
      
      if (certidaoCasamento[0]) {
        formData.append('certidaoCasamento', certidaoCasamento[0]);
      }
      
      documentosAdicionais.forEach((file, index) => {
        formData.append('documentosAdicionais', file);
      });
      
      const response = await fetch('/api/business-registration', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Erro ao enviar formulário');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setShowSuccess(true);
      toast({
        title: "Sucesso!",
        description: "Dados enviados com sucesso! Em breve entraremos em contato.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao enviar dados. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: BusinessRegistrationForm) => {
    if (documentoComFoto.length === 0) {
      toast({
        title: "Erro",
        description: "Documento com foto é obrigatório",
        variant: "destructive",
      });
      return;
    }
    
    if (data.estadoCivil === 'casado' && certidaoCasamento.length === 0) {
      toast({
        title: "Erro",
        description: "Certidão de casamento é obrigatória para pessoas casadas",
        variant: "destructive",
      });
      return;
    }
    
    submitMutation.mutate(data);
  };

  const estadoCivil = form.watch('estadoCivil');

  const suggestedActivities = [
    { value: '7319002', label: '7319002 - Promoção de vendas' },
    { value: '8599604', label: '8599604 - Treinamento em desenvolvimento profissional e gerencial' },
    { value: '8219999', label: '8219999 - Preparação de documentos e serviços especializados de apoio administrativo não especificados anteriormente' },
    { value: '8230001', label: '8230001 - Serviços de organização de feiras, congressos, exposições e festas' },
  ];

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Dados enviados com sucesso!
            </h3>
            <p className="text-gray-600 mb-6">
              Recebemos suas informações e documentos. Em breve entraremos em contato.
            </p>
            <Button 
              onClick={() => {
                setShowSuccess(false);
                form.reset();
                setDocumentoComFoto([]);
                setCertidaoCasamento([]);
                setDocumentosAdicionais([]);
              }}
              className="w-full"
            >
              Novo Formulário
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center flex-col space-y-4">
            <div className="w-32 h-16 bg-blue-700 rounded-lg flex items-center justify-center">
              <Building className="text-white text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 text-center">
              DADOS PARA ABERTURA DE EMPRESA
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Company Data Section */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-6">
                  <Building className="text-blue-700 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">Dados da Empresa</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="razaoSocial"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Razão Social *</FormLabel>
                          <FormControl>
                            <Input placeholder="Digite a razão social da empresa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="nomeFantasia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Fantasia *</FormLabel>
                          <FormControl>
                            <Input placeholder="Digite o nome fantasia" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="endereco"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Endereço da Empresa *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Digite o endereço completo da empresa" 
                              rows={3}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="inscricaoImobiliaria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inscrição Imobiliária *</FormLabel>
                        <FormControl>
                          <Input placeholder="000.000.000-0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="metragem"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Metragem Ocupada (m²) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="telefoneEmpresa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone da Empresa *</FormLabel>
                        <FormControl>
                          <Input placeholder="(11) 99999-9999" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emailEmpresa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail da Empresa *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="empresa@exemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="capitalSocial"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capital Social (R$) *</FormLabel>
                        <FormControl>
                          <Input placeholder="0,00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="atividadePrincipal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Atividade Principal *</FormLabel>
                          <FormControl>
                            <Input placeholder="Digite a atividade principal da empresa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="atividadesSecundarias"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Atividades Secundárias</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Liste as atividades secundárias (opcional)" 
                              rows={3}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="atividadesSugeridas"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Atividades mais usadas que poderia acrescentar:</FormLabel>
                          <div className="space-y-3">
                            {suggestedActivities.map((activity) => (
                              <div key={activity.value} className="flex items-start space-x-3">
                                <Checkbox
                                  id={activity.value}
                                  checked={field.value?.includes(activity.value)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, activity.value]);
                                    } else {
                                      field.onChange(current.filter(v => v !== activity.value));
                                    }
                                  }}
                                />
                                <Label htmlFor={activity.value} className="text-sm text-gray-700">
                                  {activity.label}
                                </Label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Partner Data Section */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-6">
                  <User className="text-blue-700 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">Dados do Sócio(a)</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="nomeCompleto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo *</FormLabel>
                          <FormControl>
                            <Input placeholder="Digite o nome completo do sócio" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="nacionalidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nacionalidade *</FormLabel>
                        <FormControl>
                          <Input placeholder="Brasileira" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF *</FormLabel>
                        <FormControl>
                          <Input placeholder="000.000.000-00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="senhaGov"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha do Gov *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Digite a senha do Gov.br" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RG *</FormLabel>
                        <FormControl>
                          <Input placeholder="00.000.000-0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dataNascimento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Nascimento *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="filiacao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Filiação *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do pai e da mãe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="profissao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profissão *</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite a profissão" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estadoCivil"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado Civil *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                            <SelectItem value="casado">Casado(a)</SelectItem>
                            <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                            <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                            <SelectItem value="uniao_estavel">União Estável</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="enderecoPessoal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Endereço Pessoal *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Digite o endereço completo" 
                              rows={3}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="telefonePessoal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone Pessoal *</FormLabel>
                        <FormControl>
                          <Input placeholder="(11) 99999-9999" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emailPessoal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail Pessoal *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="seuemail@exemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Documents Section */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-6">
                  <FileUp className="text-blue-700 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">Documentos do Sócio</h2>
                </div>
                
                <div className="space-y-6">
                  <FileUpload
                    label="Cópia de Documento com foto"
                    description="Formatos aceitos: PDF, JPG, PNG (máx. 10MB)"
                    onFilesChange={setDocumentoComFoto}
                    required
                  />

                  {estadoCivil === 'casado' && (
                    <FileUpload
                      label="Certidão de Casamento"
                      description="Formatos aceitos: PDF, JPG, PNG (máx. 10MB)"
                      onFilesChange={setCertidaoCasamento}
                      required
                    />
                  )}

                  <FileUpload
                    label="Documentos Adicionais (opcional)"
                    description="Múltiplos arquivos aceitos (máx. 10MB cada)"
                    onFilesChange={setDocumentosAdicionais}
                    maxFiles={10}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submission Section */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                  <div className="flex items-center text-sm text-gray-600">
                    <Shield className="text-green-600 mr-2" size={16} />
                    <span>Seus dados estão protegidos e serão enviados de forma segura</span>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button type="button" variant="outline">
                      <Save className="mr-2" size={16} />
                      Salvar Rascunho
                    </Button>
                    
                    <Button 
                      type="submit" 
                      disabled={submitMutation.isPending}
                      className="bg-blue-700 hover:bg-blue-800"
                    >
                      {submitMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2" size={16} />
                      )}
                      {submitMutation.isPending ? 'Enviando...' : 'Enviar Dados'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

          </form>
        </Form>
      </main>
    </div>
  );
}

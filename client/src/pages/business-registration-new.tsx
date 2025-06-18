import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Building, User, Plus, Users, Send, Loader2, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FileUpload } from '@/components/file-upload';
import { ThemeToggle } from '@/components/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { insertBusinessRegistrationSchema, type Partner } from '@shared/schema';

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
});

type BusinessRegistrationForm = z.infer<typeof businessRegistrationSchema>;

export default function BusinessRegistration() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [editingPartnerIndex, setEditingPartnerIndex] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Partner form states
  const [currentPartner, setCurrentPartner] = useState<Partial<Partner>>({
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
  });
  
  const [documentoComFoto, setDocumentoComFoto] = useState<File[]>([]);
  const [certidaoCasamento, setCertidaoCasamento] = useState<File[]>([]);
  const [documentosAdicionais, setDocumentosAdicionais] = useState<File[]>([]);
  
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
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (data: BusinessRegistrationForm) => {
      const formData = new FormData();
      const submissionData = {
        ...data,
        socios: partners
      };
      formData.append('data', JSON.stringify(submissionData));
      
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

  const handleAddPartner = () => {
    setShowPartnerForm(true);
    setEditingPartnerIndex(null);
    setCurrentPartner({
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
    });
    setDocumentoComFoto([]);
    setCertidaoCasamento([]);
    setDocumentosAdicionais([]);
  };

  const handleEditPartner = (index: number) => {
    setEditingPartnerIndex(index);
    setShowPartnerForm(true);
    setCurrentPartner(partners[index]);
  };

  const handleSavePartner = () => {
    if (!currentPartner.nomeCompleto || !currentPartner.cpf || !currentPartner.emailPessoal) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios do sócio",
        variant: "destructive",
      });
      return;
    }

    if (documentoComFoto.length === 0) {
      toast({
        title: "Erro",
        description: "Documento com foto é obrigatório",
        variant: "destructive",
      });
      return;
    }

    const partner: Partner = {
      ...currentPartner as Partner,
      documentoComFotoUrl: 'uploaded',
      certidaoCasamentoUrl: certidaoCasamento.length > 0 ? 'uploaded' : undefined,
      documentosAdicionaisUrls: documentosAdicionais.map((_, index) => `doc-${index}`),
    };

    if (editingPartnerIndex !== null) {
      const updatedPartners = [...partners];
      updatedPartners[editingPartnerIndex] = partner;
      setPartners(updatedPartners);
    } else {
      setPartners([...partners, partner]);
    }
    
    setShowPartnerForm(false);
    setEditingPartnerIndex(null);
  };

  const handleDeletePartner = (index: number) => {
    const updatedPartners = partners.filter((_, i) => i !== index);
    setPartners(updatedPartners);
  };

  const onSubmit = (data: BusinessRegistrationForm) => {
    if (partners.length === 0) {
      toast({
        title: "Erro",
        description: "Pelo menos um sócio é obrigatório",
        variant: "destructive",
      });
      return;
    }
    
    submitMutation.mutate(data);
  };

  const suggestedActivities = [
    { value: '7319002', label: '7319002 - Promoção de vendas' },
    { value: '8599604', label: '8599604 - Treinamento em desenvolvimento profissional e gerencial' },
    { value: '8219999', label: '8219999 - Preparação de documentos e serviços especializados de apoio administrativo não especificados anteriormente' },
    { value: '8230001', label: '8230001 - Serviços de organização de feiras, congressos, exposições e festas' },
  ];

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Dados enviados com sucesso!
            </h3>
            <p className="text-muted-foreground mb-6">
              Recebemos suas informações e documentos. Em breve entraremos em contato.
            </p>
            <Button 
              onClick={() => {
                setShowSuccess(false);
                form.reset();
                setPartners([]);
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
    <div className="min-h-screen bg-background dark:bg-background">
      {/* Header */}
      <header className="bg-card dark:bg-card shadow-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-center flex-col space-y-4 flex-1">
              <div className="w-32 h-16 bg-primary rounded-lg flex items-center justify-center">
                <Building className="text-primary-foreground text-2xl" />
              </div>
              <h1 className="text-2xl font-bold text-foreground text-center">
                DADOS PARA ABERTURA DE EMPRESA
              </h1>
            </div>
            <div className="absolute top-4 right-4">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Company Data Section */}
            <Card className="border-border dark:border-border">
              <CardHeader className="bg-muted/50 dark:bg-muted/20">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Building className="text-primary" />
                  Dados da Empresa
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="razaoSocial"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Nome da Razão Social *</FormLabel>
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
                          <FormLabel className="text-foreground">Nome Fantasia *</FormLabel>
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
                          <FormLabel className="text-foreground">Endereço da Empresa *</FormLabel>
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
                        <FormLabel className="text-foreground">Inscrição Imobiliária *</FormLabel>
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
                        <FormLabel className="text-foreground">Metragem Ocupada (m²) *</FormLabel>
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
                        <FormLabel className="text-foreground">Telefone da Empresa *</FormLabel>
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
                        <FormLabel className="text-foreground">E-mail da Empresa *</FormLabel>
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
                        <FormLabel className="text-foreground">Capital Social (R$) *</FormLabel>
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
                          <FormLabel className="text-foreground">Atividade Principal *</FormLabel>
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
                          <FormLabel className="text-foreground">Atividades Secundárias</FormLabel>
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
                          <FormLabel className="text-foreground">Atividades mais usadas que poderia acrescentar:</FormLabel>
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
                                <label 
                                  htmlFor={activity.value} 
                                  className="text-sm text-foreground leading-5 cursor-pointer"
                                >
                                  {activity.label}
                                </label>
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

            {/* Partners Section */}
            <Card className="border-border">
              <CardHeader className="bg-muted/50 dark:bg-muted/20">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Users className="text-primary" />
                    Sócios ({partners.length})
                  </CardTitle>
                  <Button
                    type="button"
                    onClick={handleAddPartner}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar Sócio
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {partners.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">Nenhum sócio adicionado ainda</p>
                    <Button type="button" onClick={handleAddPartner} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Primeiro Sócio
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {partners.map((partner, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/20">
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium text-foreground">{partner.nomeCompleto}</p>
                            <p className="text-sm text-muted-foreground">{partner.cpf} • {partner.emailPessoal}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPartner(index)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePartner(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Partner Form Modal */}
            {showPartnerForm && (
              <Card className="border-2 border-primary/50">
                <CardHeader className="bg-primary/10">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-foreground">
                      <User className="text-primary" />
                      {editingPartnerIndex !== null ? 'Editar Sócio' : 'Adicionar Sócio'}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowPartnerForm(false)}
                    >
                      ×
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Nome Completo *
                      </label>
                      <Input
                        value={currentPartner.nomeCompleto || ''}
                        onChange={(e) => setCurrentPartner({...currentPartner, nomeCompleto: e.target.value})}
                        placeholder="Digite o nome completo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        CPF *
                      </label>
                      <Input
                        value={currentPartner.cpf || ''}
                        onChange={(e) => setCurrentPartner({...currentPartner, cpf: e.target.value})}
                        placeholder="000.000.000-00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        RG *
                      </label>
                      <Input
                        value={currentPartner.rg || ''}
                        onChange={(e) => setCurrentPartner({...currentPartner, rg: e.target.value})}
                        placeholder="00.000.000-0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Data de Nascimento *
                      </label>
                      <Input
                        type="date"
                        value={currentPartner.dataNascimento || ''}
                        onChange={(e) => setCurrentPartner({...currentPartner, dataNascimento: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Estado Civil *
                      </label>
                      <Select
                        value={currentPartner.estadoCivil || ''}
                        onValueChange={(value) => setCurrentPartner({...currentPartner, estadoCivil: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                          <SelectItem value="casado">Casado(a)</SelectItem>
                          <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                          <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                          <SelectItem value="uniao_estavel">União Estável</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Telefone Pessoal *
                      </label>
                      <Input
                        value={currentPartner.telefonePessoal || ''}
                        onChange={(e) => setCurrentPartner({...currentPartner, telefonePessoal: e.target.value})}
                        placeholder="(11) 99999-9999"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        E-mail Pessoal *
                      </label>
                      <Input
                        type="email"
                        value={currentPartner.emailPessoal || ''}
                        onChange={(e) => setCurrentPartner({...currentPartner, emailPessoal: e.target.value})}
                        placeholder="email@exemplo.com"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Endereço Pessoal *
                      </label>
                      <Textarea
                        value={currentPartner.enderecoPessoal || ''}
                        onChange={(e) => setCurrentPartner({...currentPartner, enderecoPessoal: e.target.value})}
                        placeholder="Digite o endereço completo"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <FileUpload
                      label="Documento com Foto"
                      description="Anexe uma cópia do RG, CNH ou outro documento oficial com foto"
                      onFilesChange={setDocumentoComFoto}
                      accept={{
                        'image/*': ['.jpeg', '.jpg', '.png'],
                        'application/pdf': ['.pdf']
                      }}
                      maxFiles={1}
                      required
                    />

                    {(currentPartner.estadoCivil === 'casado' || currentPartner.estadoCivil === 'uniao_estavel') && (
                      <FileUpload
                        label="Certidão de Casamento/União Estável"
                        description="Anexe a certidão de casamento ou união estável"
                        onFilesChange={setCertidaoCasamento}
                        accept={{
                          'image/*': ['.jpeg', '.jpg', '.png'],
                          'application/pdf': ['.pdf']
                        }}
                        maxFiles={1}
                        required
                      />
                    )}

                    <FileUpload
                      label="Documentos Adicionais"
                      description="Anexe outros documentos necessários (opcional)"
                      onFilesChange={setDocumentosAdicionais}
                      accept={{
                        'image/*': ['.jpeg', '.jpg', '.png'],
                        'application/pdf': ['.pdf']
                      }}
                      maxFiles={5}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowPartnerForm(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="button" onClick={handleSavePartner}>
                      Salvar Sócio
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            <div className="flex justify-center pt-6">
              <Button
                type="submit"
                size="lg"
                disabled={submitMutation.isPending}
                className="w-full md:w-auto px-8"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Dados para Abertura
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}
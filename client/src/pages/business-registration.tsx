import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Building, User, FileUp, Shield, Save, Send, Loader2, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FileUpload } from '@/components/file-upload';
import { PartnerForm } from '@/components/partner-form';
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
  socios: z.array(z.any()).min(1, "Pelo menos um sócio é obrigatório"),
});

type BusinessRegistrationForm = z.infer<typeof businessRegistrationSchema>;

export default function BusinessRegistration() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [editingPartnerIndex, setEditingPartnerIndex] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [partnerFiles, setPartnerFiles] = useState<Map<number, { 
    documentoComFoto: File[], 
    certidaoCasamento: File[], 
    documentosAdicionais: File[] 
  }>>(new Map());
  
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
      socios: [],
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (data: BusinessRegistrationForm) => {
      const formData = new FormData();
      formData.append('data', JSON.stringify(data));
      
      // Add all partner files
      partners.forEach((partner, index) => {
        const files = partnerFiles.get(index);
        if (files?.documentoComFoto[0]) {
          formData.append(`socio_${index}_documentoComFoto`, files.documentoComFoto[0]);
        }
        if (files?.certidaoCasamento[0]) {
          formData.append(`socio_${index}_certidaoCasamento`, files.certidaoCasamento[0]);
        }
        files?.documentosAdicionais.forEach((file, fileIndex) => {
          formData.append(`socio_${index}_documentosAdicionais`, file);
        });
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

  const handleAddPartner = () => {
    setShowPartnerForm(true);
    setEditingPartnerIndex(null);
  };

  const handleEditPartner = (index: number) => {
    setEditingPartnerIndex(index);
    setShowPartnerForm(true);
  };

  const handleSavePartner = (partner: Partner) => {
    if (editingPartnerIndex !== null) {
      const updatedPartners = [...partners];
      updatedPartners[editingPartnerIndex] = partner;
      setPartners(updatedPartners);
    } else {
      setPartners([...partners, partner]);
    }
    setShowPartnerForm(false);
    setEditingPartnerIndex(null);
    
    // Update form with current partners
    form.setValue('socios', editingPartnerIndex !== null 
      ? partners.map((p, i) => i === editingPartnerIndex ? partner : p)
      : [...partners, partner]
    );
  };

  const handleDeletePartner = (index: number) => {
    const updatedPartners = partners.filter((_, i) => i !== index);
    setPartners(updatedPartners);
    form.setValue('socios', updatedPartners);
    
    // Remove files for this partner
    const newPartnerFiles = new Map(partnerFiles);
    newPartnerFiles.delete(index);
    setPartnerFiles(newPartnerFiles);
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
    
    // Update data with partners
    const submissionData = {
      ...data,
      socios: partners
    };
    
    submitMutation.mutate(submissionData);
  };

  const suggestedActivities = [
    { value: '7319002', label: '7319002 - Promoção de vendas' },
    { value: '8599604', label: '8599604 - Treinamento em desenvolvimento profissional e gerencial' },
    { value: '8219999', label: '8219999 - Preparação de documentos e serviços especializados de apoio administrativo não especificados anteriormente' },
    { value: '8230001', label: '8230001 - Serviços de organização de feiras, congressos, exposições e festas' },
  ];

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <Card style={{ background: '#1f2937', border: '1px solid #374151' }} className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Dados enviados com sucesso!
            </h3>
            <p className="text-gray-300 mb-6">
              Recebemos suas informações e documentos. Em breve entraremos em contato.
            </p>
            <Button 
              onClick={() => {
                setShowSuccess(false);
                form.reset();
                setPartners([]);
                setPartnerFiles(new Map());
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Novo Formulário
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" data-page="business-registration">
      {/* Header */}
      <header style={{ background: '#1f2937', borderBottom: '1px solid #374151' }}>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <Building className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  DADOS PARA ABERTURA DE EMPRESA
                </h1>
                <p className="text-gray-300 text-sm">Prosperar Contabilidade</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 business-registration-form">
            
            {/* Company Data Section */}
            <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
              <CardContent className="p-6">
                <div className="flex items-center mb-6">
                  <Building className="text-green-500 mr-3" />
                  <h2 className="text-xl font-semibold text-white">Dados da Empresa</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="razaoSocial"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel style={{ color: '#d1d5db' }}>Nome da Razão Social *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Digite a razão social da empresa" 
                              {...field}
                              style={{ 
                                backgroundColor: '#374151', 
                                border: '1px solid #4b5563', 
                                color: '#ffffff' 
                              }}
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
                      name="nomeFantasia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel style={{ color: '#d1d5db' }}>Nome Fantasia *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Digite o nome fantasia" 
                              {...field}
                              style={{ 
                                backgroundColor: '#374151', 
                                border: '1px solid #4b5563', 
                                color: '#ffffff' 
                              }}
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
                      name="endereco"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel style={{ color: '#d1d5db' }}>Endereço da Empresa *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Digite o endereço completo da empresa" 
                              rows={3}
                              {...field}
                              style={{ 
                                backgroundColor: '#374151', 
                                border: '1px solid #4b5563', 
                                color: '#ffffff' 
                              }}
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
                        <FormLabel style={{ color: '#d1d5db' }}>Inscrição Imobiliária *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="000.000.000-0" 
                            {...field}
                            style={{ 
                              backgroundColor: '#374151', 
                              border: '1px solid #4b5563', 
                              color: '#ffffff' 
                            }}
                          />
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
                        <FormLabel style={{ color: '#ffffff' }}>Metragem Ocupada (m²) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            style={{ 
                              backgroundColor: '#374151', 
                              border: '1px solid #4b5563', 
                              color: '#ffffff' 
                            }}
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
                        <FormLabel style={{ color: '#ffffff' }}>Telefone da Empresa *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="(11) 99999-9999" 
                            {...field}
                            style={{ 
                              backgroundColor: '#374151', 
                              border: '1px solid #4b5563', 
                              color: '#ffffff' 
                            }}
                          />
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
                        <FormLabel style={{ color: '#ffffff' }}>E-mail da Empresa *</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="empresa@exemplo.com" 
                            {...field}
                            style={{ 
                              backgroundColor: '#374151', 
                              border: '1px solid #4b5563', 
                              color: '#ffffff' 
                            }}
                          />
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
                        <FormLabel style={{ color: '#ffffff' }}>Capital Social (R$) *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="0,00" 
                            {...field}
                            style={{ 
                              backgroundColor: '#374151', 
                              border: '1px solid #4b5563', 
                              color: '#ffffff' 
                            }}
                          />
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
                          <FormLabel style={{ color: '#ffffff' }}>Atividade Principal *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Digite a atividade principal da empresa" 
                              {...field}
                              style={{ 
                                backgroundColor: '#374151', 
                                border: '1px solid #4b5563', 
                                color: '#ffffff' 
                              }}
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
                      name="atividadesSecundarias"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel style={{ color: '#ffffff' }}>Atividades Secundárias</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Liste as atividades secundárias (opcional)" 
                              rows={3}
                              {...field}
                              style={{ 
                                backgroundColor: '#374151', 
                                border: '1px solid #4b5563', 
                                color: '#ffffff' 
                              }}
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
                          <FormLabel style={{ color: '#ffffff' }}>Atividades mais usadas que poderia acrescentar:</FormLabel>
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
                                  style={{
                                    backgroundColor: '#374151',
                                    borderColor: '#4b5563'
                                  }}
                                />
                                <Label htmlFor={activity.value} style={{ color: '#ffffff', fontSize: '14px' }}>
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
            <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <Users className="text-green-500 mr-3" />
                    <h2 className="text-xl font-semibold text-white">Sócios da Empresa</h2>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setShowPartnerForm(true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Sócio
                  </Button>
                </div>

                {/* Display existing partners */}
                {partners.length > 0 && (
                  <div className="space-y-4 mb-6">
                    {partners.map((partner, index) => (
                      <Card key={index} style={{ background: '#374151', border: '1px solid #4b5563' }}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-white">{partner.nomeCompleto}</h3>
                              <p className="text-sm text-gray-300">
                                {partner.participacao}% - {partner.tipoParticipacao}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingPartnerIndex(index);
                                  setShowPartnerForm(true);
                                }}
                                className="border-gray-600 text-gray-300 hover:bg-gray-600"
                              >
                                Editar
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newPartners = partners.filter((_, i) => i !== index);
                                  setPartners(newPartners);
                                  form.setValue('socios', newPartners);
                                }}
                                className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                              >
                                Remover
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {partners.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">Nenhum sócio adicionado ainda</p>
                    <p className="text-sm text-gray-500">Clique em "Adicionar Sócio" para começar</p>
                  </div>
                )}
                
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
            <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
              <CardContent className="p-6">
                <div className="flex items-center mb-6">
                  <FileUp className="text-green-500 mr-3" />
                  <h2 className="text-xl font-semibold text-white">Documentos</h2>
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
            <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                  <div className="flex items-center text-sm text-gray-300">
                    <Shield className="text-green-500 mr-2" size={16} />
                    <span>Seus dados estão protegidos e serão enviados de forma segura</span>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      type="button" 
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                    >
                      <Save className="mr-2" size={16} />
                      Salvar Rascunho
                    </Button>
                    
                    <Button 
                      type="submit" 
                      disabled={submitMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white"
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

        {/* Partner Form Modal */}
        {showPartnerForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <PartnerForm
                partner={editingPartnerIndex !== null ? partners[editingPartnerIndex] : undefined}
                partnerIndex={editingPartnerIndex || partners.length}
                onSave={(partner) => {
                  if (editingPartnerIndex !== null) {
                    const newPartners = [...partners];
                    newPartners[editingPartnerIndex] = partner;
                    setPartners(newPartners);
                  } else {
                    setPartners([...partners, partner]);
                  }
                  form.setValue('socios', editingPartnerIndex !== null ? 
                    partners.map((p, i) => i === editingPartnerIndex ? partner : p) : 
                    [...partners, partner]
                  );
                  setShowPartnerForm(false);
                  setEditingPartnerIndex(null);
                }}
                onCancel={() => {
                  setShowPartnerForm(false);
                  setEditingPartnerIndex(null);
                }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

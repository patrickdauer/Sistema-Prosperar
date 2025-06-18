import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, X, Calendar, Phone, Mail, MapPin, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FileUpload } from '@/components/file-upload';
import { partnerSchema, type Partner } from '@shared/schema';

interface PartnerFormProps {
  partner?: Partner;
  onSave: (partner: Partner) => void;
  onCancel: () => void;
  onDelete?: () => void;
  partnerIndex: number;
}

export function PartnerForm({ partner, onSave, onCancel, onDelete, partnerIndex }: PartnerFormProps) {
  const [documentoComFoto, setDocumentoComFoto] = useState<File[]>([]);
  const [certidaoCasamento, setCertidaoCasamento] = useState<File[]>([]);
  const [documentosAdicionais, setDocumentosAdicionais] = useState<File[]>([]);

  const form = useForm<Partner>({
    resolver: zodResolver(partnerSchema),
    defaultValues: partner || {
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

  const onSubmit = (data: Partner) => {
    // Add file URLs to the partner data
    const partnerData = {
      ...data,
      documentoComFotoUrl: documentoComFoto.length > 0 ? 'uploaded' : undefined,
      certidaoCasamentoUrl: certidaoCasamento.length > 0 ? 'uploaded' : undefined,
      documentosAdicionaisUrls: documentosAdicionais.map((_, index) => `doc-${index}`),
    };
    
    onSave(partnerData);
  };

  const estadoCivil = form.watch('estadoCivil');

  return (
    <Card className="border-2 border-primary/20 dark:border-primary/30">
      <CardHeader className="bg-primary/5 dark:bg-primary/10 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Dados do Sócio {partnerIndex + 1}
          </CardTitle>
          <div className="flex gap-2">
            {onDelete && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onDelete}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remover
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Informações Pessoais
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="nomeCompleto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo *</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite o nome completo" {...field} />
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
                        <Input placeholder="Ex: Brasileira" {...field} />
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
                            <SelectValue placeholder="Selecione o estado civil" />
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
                    name="filiacao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Filiação *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome dos pais" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contato
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="enderecoPessoal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço Pessoal *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Digite o endereço pessoal completo" 
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
                        <Input type="email" placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Documents */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documentos
              </h3>
              
              <div className="space-y-6">
                <FileUpload
                  label="Documento com Foto"
                  description="Anexe uma cópia do RG, CNH ou outro documento oficial com foto (JPEG, PNG ou PDF - máx. 10MB)"
                  onFilesChange={setDocumentoComFoto}
                  accept={{
                    'image/*': ['.jpeg', '.jpg', '.png'],
                    'application/pdf': ['.pdf']
                  }}
                  maxFiles={1}
                  required
                />

                {(estadoCivil === 'casado' || estadoCivil === 'uniao_estavel') && (
                  <FileUpload
                    label="Certidão de Casamento/União Estável"
                    description="Anexe a certidão de casamento ou união estável (JPEG, PNG ou PDF - máx. 10MB)"
                    onFilesChange={setCertidaoCasamento}
                    accept={{
                      'image/*': ['.jpeg', '.jpg', '.png'],
                      'application/pdf': ['.pdf']
                    }}
                    maxFiles={1}
                    required={estadoCivil === 'casado' || estadoCivil === 'uniao_estavel'}
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
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                Salvar Sócio
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
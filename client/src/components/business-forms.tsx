import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Building, Plus, Users, Trash2, UserPlus } from 'lucide-react';
import type { BusinessRegistration, Partner } from '@shared/schema';

interface EditRegistrationFormProps {
  registration: BusinessRegistration;
  onSave: (id: number, data: Partial<BusinessRegistration>) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function EditRegistrationForm({ 
  registration, 
  onSave, 
  onCancel, 
  isLoading 
}: EditRegistrationFormProps) {
  const [formData, setFormData] = useState({
    razaoSocial: registration.razaoSocial,
    nomeFantasia: registration.nomeFantasia,
    cnpj: registration.cnpj || '',
    endereco: registration.endereco,
    inscricaoImobiliaria: registration.inscricaoImobiliaria || '',
    metragem: registration.metragem || 0,
    emailEmpresa: registration.emailEmpresa,
    telefoneEmpresa: registration.telefoneEmpresa,
    capitalSocial: registration.capitalSocial || '',
    atividadePrincipal: registration.atividadePrincipal || '',
    atividadesSecundarias: registration.atividadesSecundarias || '',
    socios: (registration.socios as Partner[]) || []
  });

  const addSocio = () => {
    const newSocio: Partner = {
      nomeCompleto: '',
      cpf: '',
      rg: '',
      estadoCivil: '',
      regimeCasamento: '',
      profissao: '',
      endereco: '',
      telefoneResidencial: '',
      telefonePessoal: '',
      emailPessoal: '',
      participacao: 0,
      tipoParticipacao: 'quotista'
    };
    setFormData({ ...formData, socios: [...formData.socios, newSocio] });
  };

  const removeSocio = (index: number) => {
    const newSocios = formData.socios.filter((_, i) => i !== index);
    setFormData({ ...formData, socios: newSocios });
  };

  const updateSocio = (index: number, field: keyof Partner, value: string | number) => {
    const newSocios = [...formData.socios];
    newSocios[index] = { ...newSocios[index], [field]: value };
    setFormData({ ...formData, socios: newSocios });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(registration.id, formData);
  };

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      <header style={{ background: '#1a1a1a', borderBottom: '1px solid #333' }}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Button variant="ghost" onClick={onCancel} className="mb-2" style={{ color: '#22c55e' }}>
                ← Voltar ao Dashboard
              </Button>
              <h1 className="text-xl font-bold" style={{ color: '#22c55e' }}>Editar Empresa</h1>
              <p className="text-sm" style={{ color: '#888' }}>Editando: {registration.razaoSocial}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card style={{ background: '#1a1a1a', border: '1px solid #333' }}>
          <CardHeader style={{ borderBottom: '1px solid #333' }}>
            <CardTitle style={{ color: '#22c55e' }}>Dados da Empresa</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados da Empresa */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium" style={{ color: '#22c55e' }}>Dados da Empresa</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium" style={{ color: '#888' }}>Razão Social *</label>
                    <Input
                      value={formData.razaoSocial}
                      onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                      style={{ background: '#0a0a0a', border: '1px solid #333', color: '#ffffff' }}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: '#888' }}>Nome Fantasia *</label>
                    <Input
                      value={formData.nomeFantasia}
                      onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
                      style={{ background: '#0a0a0a', border: '1px solid #333', color: '#ffffff' }}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: '#888' }}>CNPJ</label>
                    <Input
                      value={formData.cnpj}
                      onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                      style={{ background: '#0a0a0a', border: '1px solid #333', color: '#ffffff' }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: '#888' }}>Inscrição Imobiliária *</label>
                    <Input
                      value={formData.inscricaoImobiliaria}
                      onChange={(e) => setFormData({ ...formData, inscricaoImobiliaria: e.target.value })}
                      style={{ background: '#0a0a0a', border: '1px solid #333', color: '#ffffff' }}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: '#888' }}>Metragem (m²) *</label>
                    <Input
                      type="number"
                      value={formData.metragem}
                      onChange={(e) => setFormData({ ...formData, metragem: parseInt(e.target.value) || 0 })}
                      style={{ background: '#0a0a0a', border: '1px solid #333', color: '#ffffff' }}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: '#888' }}>Capital Social *</label>
                    <Input
                      value={formData.capitalSocial}
                      onChange={(e) => setFormData({ ...formData, capitalSocial: e.target.value })}
                      style={{ background: '#0a0a0a', border: '1px solid #333', color: '#ffffff' }}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: '#888' }}>Email da Empresa *</label>
                    <Input
                      type="email"
                      value={formData.emailEmpresa}
                      onChange={(e) => setFormData({ ...formData, emailEmpresa: e.target.value })}
                      style={{ background: '#0a0a0a', border: '1px solid #333', color: '#ffffff' }}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: '#888' }}>Telefone da Empresa *</label>
                    <Input
                      value={formData.telefoneEmpresa}
                      onChange={(e) => setFormData({ ...formData, telefoneEmpresa: e.target.value })}
                      style={{ background: '#0a0a0a', border: '1px solid #333', color: '#ffffff' }}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium" style={{ color: '#888' }}>Endereço Completo *</label>
                    <Input
                      value={formData.endereco}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                      style={{ background: '#0a0a0a', border: '1px solid #333', color: '#ffffff' }}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium" style={{ color: '#888' }}>Atividade Principal *</label>
                    <Textarea
                      value={formData.atividadePrincipal}
                      onChange={(e) => setFormData({ ...formData, atividadePrincipal: e.target.value })}
                      style={{ background: '#0a0a0a', border: '1px solid #333', color: '#ffffff' }}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium" style={{ color: '#888' }}>Atividades Secundárias</label>
                    <Textarea
                      value={formData.atividadesSecundarias}
                      onChange={(e) => setFormData({ ...formData, atividadesSecundarias: e.target.value })}
                      style={{ background: '#0a0a0a', border: '1px solid #333', color: '#ffffff' }}
                    />
                  </div>
                </div>
              </div>

              {/* Dados dos Sócios */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium" style={{ color: '#22c55e' }}>Sócios da Empresa</h3>
                  <Button
                    type="button"
                    onClick={addSocio}
                    style={{ background: '#22c55e', border: '1px solid #22c55e', color: '#ffffff' }}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Adicionar Sócio
                  </Button>
                </div>

                {formData.socios.map((socio, index) => (
                  <Card key={index} style={{ background: '#0a0a0a', border: '1px solid #333' }}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm" style={{ color: '#ff8c42' }}>
                          <Users className="h-4 w-4 inline mr-2" />
                          Sócio {index + 1}
                        </CardTitle>
                        {formData.socios.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeSocio(index)}
                            style={{ background: '#ef4444', border: '1px solid #ef4444', color: '#ffffff' }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium" style={{ color: '#888' }}>Nome Completo *</label>
                          <Input
                            value={socio.nomeCompleto}
                            onChange={(e) => updateSocio(index, 'nomeCompleto', e.target.value)}
                            style={{ background: '#1a1a1a', border: '1px solid #333', color: '#ffffff' }}
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium" style={{ color: '#888' }}>CPF *</label>
                          <Input
                            value={socio.cpf}
                            onChange={(e) => updateSocio(index, 'cpf', e.target.value)}
                            style={{ background: '#1a1a1a', border: '1px solid #333', color: '#ffffff' }}
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium" style={{ color: '#888' }}>RG *</label>
                          <Input
                            value={socio.rg}
                            onChange={(e) => updateSocio(index, 'rg', e.target.value)}
                            style={{ background: '#1a1a1a', border: '1px solid #333', color: '#ffffff' }}
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium" style={{ color: '#888' }}>Estado Civil *</label>
                          <Input
                            value={socio.estadoCivil}
                            onChange={(e) => updateSocio(index, 'estadoCivil', e.target.value)}
                            style={{ background: '#1a1a1a', border: '1px solid #333', color: '#ffffff' }}
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium" style={{ color: '#888' }}>Regime de Casamento</label>
                          <Input
                            value={socio.regimeCasamento || ''}
                            onChange={(e) => updateSocio(index, 'regimeCasamento', e.target.value)}
                            style={{ background: '#1a1a1a', border: '1px solid #333', color: '#ffffff' }}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium" style={{ color: '#888' }}>Profissão *</label>
                          <Input
                            value={socio.profissao}
                            onChange={(e) => updateSocio(index, 'profissao', e.target.value)}
                            style={{ background: '#1a1a1a', border: '1px solid #333', color: '#ffffff' }}
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium" style={{ color: '#888' }}>Telefone Pessoal *</label>
                          <Input
                            value={socio.telefonePessoal}
                            onChange={(e) => updateSocio(index, 'telefonePessoal', e.target.value)}
                            style={{ background: '#1a1a1a', border: '1px solid #333', color: '#ffffff' }}
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium" style={{ color: '#888' }}>Email Pessoal *</label>
                          <Input
                            type="email"
                            value={socio.emailPessoal}
                            onChange={(e) => updateSocio(index, 'emailPessoal', e.target.value)}
                            style={{ background: '#1a1a1a', border: '1px solid #333', color: '#ffffff' }}
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium" style={{ color: '#888' }}>Participação (%) *</label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={socio.participacao}
                            onChange={(e) => updateSocio(index, 'participacao', parseFloat(e.target.value) || 0)}
                            style={{ background: '#1a1a1a', border: '1px solid #333', color: '#ffffff' }}
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium" style={{ color: '#888' }}>Tipo de Participação *</label>
                          <Input
                            value={socio.tipoParticipacao}
                            onChange={(e) => updateSocio(index, 'tipoParticipacao', e.target.value)}
                            style={{ background: '#1a1a1a', border: '1px solid #333', color: '#ffffff' }}
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium" style={{ color: '#888' }}>Endereço Completo *</label>
                          <Input
                            value={socio.endereco}
                            onChange={(e) => updateSocio(index, 'endereco', e.target.value)}
                            style={{ background: '#1a1a1a', border: '1px solid #333', color: '#ffffff' }}
                            required
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  style={{ background: '#22c55e', border: '1px solid #22c55e', color: '#ffffff' }}
                >
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  style={{ background: '#ef4444', border: '1px solid #ef4444', color: '#ffffff' }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

interface CreateRegistrationFormProps {
  onSave: (data: any) => void;
  onCancel: () => void;
}

export function CreateRegistrationForm({ 
  onSave, 
  onCancel 
}: CreateRegistrationFormProps) {
  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      <header style={{ background: '#1a1a1a', borderBottom: '1px solid #333' }}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Button variant="ghost" onClick={onCancel} className="mb-2" style={{ color: '#22c55e' }}>
                ← Voltar ao Dashboard
              </Button>
              <h1 className="text-xl font-bold" style={{ color: '#22c55e' }}>Criar Nova Empresa</h1>
              <p className="text-sm" style={{ color: '#888' }}>Redirecionando para formulário completo</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card style={{ background: '#1a1a1a', border: '1px solid #333' }}>
          <CardContent className="pt-6 text-center">
            <div className="space-y-4">
              <Building className="h-16 w-16 mx-auto" style={{ color: '#22c55e' }} />
              <h2 className="text-xl font-bold" style={{ color: '#ffffff' }}>Formulário Completo de Cadastro</h2>
              <p style={{ color: '#888' }}>
                Para criar uma nova empresa, você será redirecionado para o formulário completo
                com todos os campos necessários, incluindo dados dos sócios e upload de documentos.
              </p>
              <div className="flex gap-4 justify-center pt-4">
                <Button
                  onClick={() => {
                    window.open('/', '_blank');
                    onCancel();
                  }}
                  style={{ background: '#22c55e', border: '1px solid #22c55e', color: '#ffffff' }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ir para Formulário de Cadastro
                </Button>
                <Button
                  variant="outline"
                  onClick={onCancel}
                  style={{ background: '#ef4444', border: '1px solid #ef4444', color: '#ffffff' }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
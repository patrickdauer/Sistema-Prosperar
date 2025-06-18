import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Building, 
  Users, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Upload,
  FileText,
  LogOut,
  User,
  Filter,
  Trash2,
  Edit,
  Settings,
  UserPlus,
  Key
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ThemeToggle } from '@/components/theme-toggle';
import { useToast } from '@/hooks/use-toast';

interface Task {
  id: number;
  title: string;
  description: string;
  department: string;
  status: string;
  dueDate: string;
  businessRegistrationId: number;
  order: number;
}

interface BusinessRegistration {
  id: number;
  razaoSocial: string;
  nomeFantasia: string;
  endereco: string;
  inscricaoImobiliaria?: string;
  metragem?: number;
  emailEmpresa: string;
  telefoneEmpresa: string;
  capitalSocial?: string;
  atividadePrincipal?: string;
  atividadesSecundarias?: string;
  atividadesSugeridas?: string[];
  socios: any[];
  createdAt: string;
  tasks: Task[];
}

export default function InternalDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [editingCompany, setEditingCompany] = useState<BusinessRegistration | null>(null);
  const [userManagementOpen, setUserManagementOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({ username: '', password: '', name: '', email: '', role: 'user', department: '' });
  const [changePasswordData, setChangePasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const { data: registrations, isLoading } = useQuery({
    queryKey: ['/api/internal/registrations'],
    queryFn: async () => {
      const response = await fetch('/api/internal/registrations', {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch registrations');
      return response.json();
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: string }) => {
      const response = await fetch(`/api/internal/task/${taskId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/internal/registrations'] });
      toast({
        title: "Tarefa atualizada",
        description: "Status da tarefa foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao atualizar tarefa.",
        variant: "destructive",
      });
    }
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: async (companyId: number) => {
      const response = await fetch(`/api/internal/registration/${companyId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete company');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/internal/registrations'] });
      toast({
        title: "Empresa deletada",
        description: "A empresa foi removida com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao deletar empresa.",
        variant: "destructive",
      });
    }
  });

  const editCompanyMutation = useMutation({
    mutationFn: async (companyData: BusinessRegistration) => {
      const response = await fetch(`/api/internal/registration/${companyData.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(companyData)
      });
      if (!response.ok) throw new Error('Failed to update company');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/internal/registrations'] });
      setEditingCompany(null);
      toast({
        title: "Empresa atualizada",
        description: "Os dados da empresa foram atualizados com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao atualizar empresa.",
        variant: "destructive",
      });
    }
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await fetch('/api/internal/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(userData)
      });
      if (!response.ok) throw new Error('Failed to create user');
      return response.json();
    },
    onSuccess: () => {
      setNewUserData({ username: '', password: '', name: '', email: '', role: 'user', department: '' });
      toast({
        title: "Usuário criado",
        description: "Novo usuário foi criado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao criar usuário.",
        variant: "destructive",
      });
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (passwordData: any) => {
      const response = await fetch('/api/internal/change-password', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(passwordData)
      });
      if (!response.ok) throw new Error('Failed to change password');
      return response.json();
    },
    onSuccess: () => {
      setChangePasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao alterar senha.",
        variant: "destructive",
      });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'in_progress':
        return <Badge variant="default">Em Andamento</Badge>;
      case 'completed':
        return <Badge variant="destructive">Concluída</Badge>;
      case 'blocked':
        return <Badge variant="outline">Bloqueada</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case 'societario':
        return 'bg-blue-100 dark:bg-blue-900 border-blue-200 dark:border-blue-800';
      case 'fiscal':
        return 'bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-800';
      case 'pessoal':
        return 'bg-purple-100 dark:bg-purple-900 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-800';
    }
  };

  const getDepartmentTitle = (department: string) => {
    switch (department) {
      case 'societario':
        return 'Depto. Societário';
      case 'fiscal':
        return 'Depto. Fiscal';
      case 'pessoal':
        return 'Depto. Pessoal';
      default:
        return department;
    }
  };

  const handleTaskStatusChange = (taskId: number, status: string) => {
    console.log('Updating task status:', taskId, status);
    updateTaskMutation.mutate({ taskId, status });
  };

  const filteredRegistrations = registrations?.filter((reg: BusinessRegistration) => {
    if (departmentFilter === 'all') return true;
    return reg.tasks && reg.tasks.some(task => task.department === departmentFilter);
  }) || [];

  console.log('Department filter:', departmentFilter);
  console.log('Total registrations:', registrations?.length);
  console.log('Filtered registrations:', filteredRegistrations.length);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Building className="text-primary-foreground text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Sistema Interno</h1>
                <p className="text-sm text-muted-foreground">Gestão de Abertura de Empresas</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setUserManagementOpen(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Gestão de Usuários
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{user?.name}</span>
                <Badge variant="outline">{user?.role}</Badge>
                {user?.department && <Badge variant="secondary">{getDepartmentTitle(user.department)}</Badge>}
              </div>
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="flex items-center p-6">
              <Building className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {registrations?.length || 0}
                </div>
                <p className="text-sm text-muted-foreground">Total de Empresas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Clock className="h-8 w-8 text-yellow-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {registrations?.reduce((acc: number, reg: BusinessRegistration) => 
                    acc + reg.tasks.filter(t => t.status === 'pending').length, 0) || 0}
                </div>
                <p className="text-sm text-muted-foreground">Tarefas Pendentes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <AlertCircle className="h-8 w-8 text-orange-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {registrations?.reduce((acc: number, reg: BusinessRegistration) => 
                    acc + reg.tasks.filter(t => t.status === 'in_progress').length, 0) || 0}
                </div>
                <p className="text-sm text-muted-foreground">Em Andamento</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {registrations?.reduce((acc: number, reg: BusinessRegistration) => 
                    acc + reg.tasks.filter(t => t.status === 'completed').length, 0) || 0}
                </div>
                <p className="text-sm text-muted-foreground">Concluídas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Departamentos</SelectItem>
                  <SelectItem value="societario">Depto. Societário</SelectItem>
                  <SelectItem value="fiscal">Depto. Fiscal</SelectItem>
                  <SelectItem value="pessoal">Depto. Pessoal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Companies Grid */}
        <div className="space-y-6">
          {filteredRegistrations.map((registration: BusinessRegistration) => (
            <Card key={registration.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{registration.razaoSocial}</CardTitle>
                    <p className="text-sm text-muted-foreground">{registration.nomeFantasia}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{registration.emailEmpresa}</span>
                      <span>{registration.telefoneEmpresa}</span>
                      <span>ID: {registration.id}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Recebido em {format(new Date(registration.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-xl">{registration.razaoSocial} - Dados Completos</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-6">
                            {/* Dados da Empresa */}
                            <div className="border rounded-lg p-4">
                              <h3 className="font-semibold mb-3 text-lg">Dados da Empresa</h3>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><strong>Razão Social:</strong> {registration.razaoSocial}</div>
                                <div><strong>Nome Fantasia:</strong> {registration.nomeFantasia}</div>
                                <div><strong>Endereço:</strong> {registration.endereco}</div>
                                <div><strong>Telefone:</strong> {registration.telefoneEmpresa}</div>
                                <div><strong>Email:</strong> {registration.emailEmpresa}</div>
                                <div><strong>Data de Registro:</strong> {format(new Date(registration.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</div>
                              </div>
                            </div>

                            {/* Dados dos Sócios */}
                            <div className="border rounded-lg p-4">
                              <h3 className="font-semibold mb-3 text-lg">Sócios ({registration.socios?.length || 0})</h3>
                              {registration.socios && registration.socios.length > 0 ? (
                                <div className="space-y-4">
                                  {registration.socios.map((socio: any, index: number) => (
                                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2 bg-muted/30">
                                      <h4 className="font-medium mb-2">Sócio {index + 1}: {socio.nomeCompleto}</h4>
                                      <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div><strong>CPF:</strong> {socio.cpf}</div>
                                        <div><strong>RG:</strong> {socio.rg}</div>
                                        <div><strong>Email:</strong> {socio.emailPessoal}</div>
                                        <div><strong>Telefone:</strong> {socio.telefonePessoal}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-muted-foreground">Nenhum sócio cadastrado</p>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditingCompany(registration)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => {
                          if (confirm('Tem certeza que deseja deletar esta empresa?')) {
                            deleteCompanyMutation.mutate(registration.id);
                          }
                        }}
                        disabled={deleteCompanyMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Deletar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Kanban Board */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {['societario', 'fiscal', 'pessoal'].map(department => {
                    const departmentTasks = registration.tasks
                      ?.filter(task => task.department === department)
                      ?.sort((a, b) => a.order - b.order) || [];
                    
                    return (
                      <div key={department} className={`p-4 rounded-lg border ${getDepartmentColor(department)}`}>
                        <h4 className="font-semibold mb-3 text-center">{getDepartmentTitle(department)}</h4>
                        <div className="space-y-3">
                          {departmentTasks.map(task => (
                            <div key={task.id} className="bg-card p-3 rounded-md border shadow-sm">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h5 className="font-medium text-sm">{task.title}</h5>
                                {getStatusBadge(task.status)}
                              </div>
                              {task.description && (
                                <p className="text-xs text-muted-foreground mb-2">{task.description}</p>
                              )}
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  Prazo: {format(new Date(task.dueDate), 'dd/MM', { locale: ptBR })}
                                </span>
                                <div className="flex gap-1">
                                  {task.status !== 'completed' && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-6 px-2 text-xs"
                                        onClick={() => handleTaskStatusChange(task.id, 'in_progress')}
                                        disabled={updateTaskMutation.isPending}
                                      >
                                        Iniciar
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="default"
                                        className="h-6 px-2 text-xs"
                                        onClick={() => handleTaskStatusChange(task.id, 'completed')}
                                        disabled={updateTaskMutation.isPending}
                                      >
                                        Concluir
                                      </Button>
                                    </>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-xs"
                                  >
                                    <Upload className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRegistrations.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma empresa encontrada</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de Gestão de Usuários */}
      <Dialog open={userManagementOpen} onOpenChange={setUserManagementOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gestão de Usuários</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Criar Novo Usuário */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Criar Novo Usuário
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Nome de Usuário</Label>
                  <Input
                    id="username"
                    value={newUserData.username}
                    onChange={(e) => setNewUserData({...newUserData, username: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={newUserData.name}
                    onChange={(e) => setNewUserData({...newUserData, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Função</Label>
                  <Select value={newUserData.role} onValueChange={(value) => setNewUserData({...newUserData, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="department">Departamento</Label>
                  <Select value={newUserData.department} onValueChange={(value) => setNewUserData({...newUserData, department: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="societario">Societário</SelectItem>
                      <SelectItem value="fiscal">Fiscal</SelectItem>
                      <SelectItem value="pessoal">Pessoal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                className="mt-4" 
                onClick={() => createUserMutation.mutate(newUserData)}
                disabled={createUserMutation.isPending}
              >
                Criar Usuário
              </Button>
            </div>

            {/* Alterar Senha */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Key className="h-4 w-4" />
                Alterar Minha Senha
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Senha Atual</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={changePasswordData.currentPassword}
                    onChange={(e) => setChangePasswordData({...changePasswordData, currentPassword: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={changePasswordData.newPassword}
                    onChange={(e) => setChangePasswordData({...changePasswordData, newPassword: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={changePasswordData.confirmPassword}
                    onChange={(e) => setChangePasswordData({...changePasswordData, confirmPassword: e.target.value})}
                  />
                </div>
              </div>
              <Button 
                className="mt-4" 
                onClick={() => {
                  if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
                    toast({
                      title: "Erro",
                      description: "As senhas não coincidem.",
                      variant: "destructive",
                    });
                    return;
                  }
                  changePasswordMutation.mutate(changePasswordData);
                }}
                disabled={changePasswordMutation.isPending}
              >
                Alterar Senha
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição de Empresa */}
      {editingCompany && (
        <Dialog open={!!editingCompany} onOpenChange={() => setEditingCompany(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Empresa - {editingCompany.razaoSocial}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="razaoSocial">Razão Social</Label>
                  <Input
                    id="razaoSocial"
                    value={editingCompany.razaoSocial}
                    onChange={(e) => setEditingCompany({...editingCompany, razaoSocial: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
                  <Input
                    id="nomeFantasia"
                    value={editingCompany.nomeFantasia}
                    onChange={(e) => setEditingCompany({...editingCompany, nomeFantasia: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={editingCompany.endereco}
                    onChange={(e) => setEditingCompany({...editingCompany, endereco: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="telefoneEmpresa">Telefone</Label>
                  <Input
                    id="telefoneEmpresa"
                    value={editingCompany.telefoneEmpresa}
                    onChange={(e) => setEditingCompany({...editingCompany, telefoneEmpresa: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="emailEmpresa">Email</Label>
                  <Input
                    id="emailEmpresa"
                    value={editingCompany.emailEmpresa}
                    onChange={(e) => setEditingCompany({...editingCompany, emailEmpresa: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => editCompanyMutation.mutate(editingCompany)}
                  disabled={editCompanyMutation.isPending}
                >
                  Salvar Alterações
                </Button>
                <Button variant="outline" onClick={() => setEditingCompany(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
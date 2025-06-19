import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  Building, 
  Users, 
  Clock, 
  CheckCircle, 
  User, 
  LogOut, 
  Settings,
  UserPlus,
  Key,
  Edit,
  Trash2,
  FileText,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

// Custom status buttons component
const StatusButtons = ({ task, onStatusChange }: { task: Task; onStatusChange: (taskId: number, status: string) => void }) => {
  const buttonStyle = {
    base: {
      display: 'inline-block',
      fontSize: '11px',
      padding: '3px 6px',
      borderRadius: '3px',
      cursor: 'pointer',
      fontWeight: '500',
      minWidth: '50px',
      textAlign: 'center' as const,
      userSelect: 'none' as const,
      marginRight: '4px',
      border: '1px solid'
    }
  };

  const getStyle = (status: string) => {
    if (task.status === status) {
      switch (status) {
        case 'pending':
          return { ...buttonStyle.base, backgroundColor: '#ef4444', color: 'white', borderColor: '#ef4444' };
        case 'in_progress':
          return { ...buttonStyle.base, backgroundColor: '#eab308', color: 'white', borderColor: '#eab308' };
        case 'completed':
          return { ...buttonStyle.base, backgroundColor: '#22c55e', color: 'white', borderColor: '#22c55e' };
      }
    }
    return { ...buttonStyle.base, backgroundColor: '#f3f4f6', color: '#374151', borderColor: '#d1d5db' };
  };

  return (
    <div style={{ marginTop: '6px' }}>
      <span style={getStyle('pending')} onClick={() => onStatusChange(task.id, 'pending')}>
        Pendente
      </span>
      <span style={getStyle('in_progress')} onClick={() => onStatusChange(task.id, 'in_progress')}>
        Em Andamento
      </span>
      <span style={getStyle('completed')} onClick={() => onStatusChange(task.id, 'completed')}>
        Concluída
      </span>
    </div>
  );
};

export default function InternalDashboardV2() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [userManagementOpen, setUserManagementOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({ 
    username: '', 
    password: '', 
    name: '', 
    email: '', 
    role: 'user', 
    department: '' 
  });

  const isAdmin = user?.role === 'admin';

  // Fetch registrations
  const { data: registrations, isLoading } = useQuery({
    queryKey: ['internal-registrations'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/internal/registrations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha ao carregar registros');
      return response.json();
    }
  });

  // Update task status mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: string }) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/internal/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Falha ao atualizar status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-registrations'] });
      toast({ title: "Status atualizado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
    }
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUserData) => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/internal/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });
      if (!response.ok) throw new Error('Falha ao criar usuário');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Usuário criado com sucesso!" });
      setNewUserData({ username: '', password: '', name: '', email: '', role: 'user', department: '' });
    },
    onError: () => {
      toast({ title: "Erro ao criar usuário", variant: "destructive" });
    }
  });

  const handleStatusChange = (taskId: number, status: string) => {
    updateTaskMutation.mutate({ taskId, status });
  };

  const getDepartmentTitle = (dept: string) => {
    switch (dept) {
      case 'societario': return 'Depto. Societário';
      case 'fiscal': return 'Depto. Fiscal';
      case 'pessoal': return 'Depto. Pessoal';
      default: return dept;
    }
  };

  const getDepartmentColor = (dept: string) => {
    switch (dept) {
      case 'societario': return 'border-blue-500 bg-blue-50 dark:bg-blue-950';
      case 'fiscal': return 'border-green-500 bg-green-50 dark:bg-green-950';
      case 'pessoal': return 'border-purple-500 bg-purple-50 dark:bg-purple-950';
      default: return 'border-gray-500 bg-gray-50 dark:bg-gray-950';
    }
  };

  // Filter registrations
  const filteredRegistrations = registrations?.filter((reg: BusinessRegistration) => {
    if (departmentFilter === 'all') return true;
    return reg.tasks?.some(task => task.department === departmentFilter);
  }) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">Carregando sistema interno...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Building className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-foreground">Sistema Interno V2</h1>
                <p className="text-sm text-muted-foreground">Gestão de Abertura de Empresas</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setUserManagementOpen(true)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Gestão de Usuários
                </Button>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{user?.name}</span>
                <Badge variant="outline">{user?.role}</Badge>
              </div>
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="flex items-center p-6">
              <Building className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-foreground">{registrations?.length || 0}</div>
                <p className="text-sm text-muted-foreground">Total de Empresas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Clock className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {registrations?.reduce((acc: number, reg: BusinessRegistration) => 
                    acc + (reg.tasks?.filter(t => t.status === 'pending').length || 0), 0) || 0}
                </div>
                <p className="text-sm text-muted-foreground">Tarefas Pendentes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Users className="h-8 w-8 text-yellow-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {registrations?.reduce((acc: number, reg: BusinessRegistration) => 
                    acc + (reg.tasks?.filter(t => t.status === 'in_progress').length || 0), 0) || 0}
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
                    acc + (reg.tasks?.filter(t => t.status === 'completed').length || 0), 0) || 0}
                </div>
                <p className="text-sm text-muted-foreground">Concluídas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Filter className="h-4 w-4" />
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os departamentos</SelectItem>
                  <SelectItem value="societario">Depto. Societário</SelectItem>
                  <SelectItem value="fiscal">Depto. Fiscal</SelectItem>
                  <SelectItem value="pessoal">Depto. Pessoal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Companies with Kanban Tasks */}
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
                                <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                                  {task.status === 'pending' ? 'Pendente' : 
                                   task.status === 'in_progress' ? 'Em Andamento' : 'Concluída'}
                                </Badge>
                              </div>
                              {task.description && (
                                <p className="text-xs text-muted-foreground mb-2">{task.description}</p>
                              )}
                              <StatusButtons task={task} onStatusChange={handleStatusChange} />
                            </div>
                          ))}
                          {departmentTasks.length === 0 && (
                            <p className="text-center text-muted-foreground text-sm">
                              Nenhuma tarefa
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* User Management Dialog */}
      {isAdmin && (
        <Dialog open={userManagementOpen} onOpenChange={setUserManagementOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Gestão de Usuários
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Criar Novo Usuário
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Nome de usuário</Label>
                    <Input
                      id="username"
                      value={newUserData.username}
                      onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUserData.password}
                      onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      value={newUserData.name}
                      onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Função</Label>
                    <Select value={newUserData.role} onValueChange={(value) => setNewUserData({ ...newUserData, role: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="user">Usuário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="department">Departamento</Label>
                    <Select value={newUserData.department} onValueChange={(value) => setNewUserData({ ...newUserData, department: value })}>
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
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
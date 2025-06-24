import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { ThemeToggle } from '@/components/theme-toggle';
import { Building2, Users, Upload, Download, Calendar, MessageSquare, LogOut, Search, Filter, Trash2, Edit, Plus, Clock, CheckCircle2, AlertCircle, User, FileSpreadsheet, FileDown, UserPlus, Settings } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Task {
  id: number;
  title: string;
  description: string;
  department: string;
  status: string;
  dueDate?: string;
  businessRegistrationId: number;
  order: number;
  cnpj?: string;
  observacao?: string;
  data_lembrete?: string;
}

interface TaskFile {
  id: number;
  taskId: number;
  originalName: string;
  filePath: string;
  mimeType: string;
  createdAt: string;
}

interface Socio {
  nomeCompleto: string;
  cpf: string;
  rg: string;
  dataNascimento: string;
  estadoCivil: string;
  profissao: string;
  nacionalidade: string;
  enderecoPessoal: string;
  telefonePessoal: string;
  emailPessoal: string;
  filiacao: string;
}

interface BusinessRegistration {
  id: number;
  razaoSocial: string;
  nomeFantasia: string;
  endereco: string;
  emailEmpresa: string;
  telefoneEmpresa: string;
  cnpj?: string;
  capitalSocial?: string;
  atividadePrincipal?: string;
  socios?: Socio[];
  createdAt: string;
  tasks: Task[];
}

export default function SistemaFinal() {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedRegistration, setSelectedRegistration] = useState<BusinessRegistration | null>(null);
  const [editingCompany, setEditingCompany] = useState<BusinessRegistration | null>(null);
  const [observacao, setObservacao] = useState('');
  const [dataLembrete, setDataLembrete] = useState('');
  const [cnpjValue, setCnpjValue] = useState('');
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showCompanyEdit, setShowCompanyEdit] = useState(false);
  const [editingCompanyData, setEditingCompanyData] = useState<BusinessRegistration | null>(null);
  const [newTaskDepartment, setNewTaskDepartment] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [editingTaskData, setEditingTaskData] = useState<{id: number; title: string; description: string} | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: registrations = [], isLoading } = useQuery<BusinessRegistration[]>({
    queryKey: ['/api/internal/business-registrations/with-tasks'],
  });

  const { data: taskFiles = [], refetch: refetchTaskFiles, isLoading: filesLoading } = useQuery<TaskFile[]>({
    queryKey: ['/api/internal/tasks', selectedTask?.id, 'files'],
    enabled: !!selectedTask?.id,
    refetchInterval: 2000, // Refetch every 2 seconds to catch new uploads
    onSuccess: (data) => {
      console.log('Files loaded for task:', selectedTask?.id, 'Files:', data);
    },
    onError: (error) => {
      console.error('Error loading files:', error);
    }
  });

  const { data: users = [] } = useQuery({
    queryKey: ['/api/internal/users'],
    enabled: showUserManagement,
  });

  // Update company mutation
  const updateCompanyMutation = useMutation({
    mutationFn: async (companyData: BusinessRegistration) => {
      console.log('Dados sendo enviados:', companyData);
      const response = await fetch(`/api/internal/business-registrations/${companyData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(companyData),
      });
      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);
      if (!response.ok) throw new Error(responseData.message || 'Falha ao atualizar empresa');
      return responseData;
    },
    onSuccess: () => {
      // Force refresh all related queries
      queryClient.invalidateQueries({ queryKey: ['/api/internal/business-registrations/with-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/internal/business-registrations'] });
      queryClient.refetchQueries({ queryKey: ['/api/internal/business-registrations/with-tasks'] });
      setShowCompanyEdit(false);
      setEditingCompanyData(null);
      toast({ title: "Empresa atualizada com sucesso!", variant: "default" });
    },
    onError: (error: Error) => {
      console.error('Erro na atualização:', error);
      toast({ title: "Erro ao atualizar empresa", description: error.message, variant: "destructive" });
    },
  });

  // Update task field mutation
  const updateTaskFieldMutation = useMutation({
    mutationFn: async ({ taskId, field, value }: { taskId: number; field: string; value: any }) => {
      const response = await fetch(`/api/internal/tasks/${taskId}/field`, {
        method: 'PUT',
        body: JSON.stringify({ field, value }),
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/internal/business-registrations/with-tasks'] });
      toast({ title: "Campo atualizado com sucesso!", variant: "default" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar campo", variant: "destructive" });
    },
  });

  // Update task status mutation
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: string }) => {
      const response = await fetch(`/api/internal/tasks/${taskId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/internal/business-registrations/with-tasks'] });
      toast({ title: "Status atualizado com sucesso!", variant: "default" });
    },
  });

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async ({ taskId, file }: { taskId: number; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('taskId', taskId.toString());

      const response = await fetch(`/api/internal/tasks/${taskId}/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Upload success:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/internal/tasks', selectedTask?.id, 'files'] });
      refetchTaskFiles();
      setSelectedFile(null);
      toast({ title: "Arquivo enviado com sucesso!", variant: "default" });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: () => {
      toast({ title: "Erro ao enviar arquivo", variant: "destructive" });
    },
  });

  // Delete business registration mutation
  const deleteBusinessMutation = useMutation({
    mutationFn: async (registrationId: number) => {
      const response = await fetch(`/api/internal/business-registrations/${registrationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/internal/business-registrations/with-tasks'] });
      toast({ title: "Empresa deletada com sucesso!", variant: "default" });
    },
    onError: () => {
      toast({ title: "Erro ao deletar empresa", variant: "destructive" });
    },
  });

  // Edit company mutation
  const editCompanyMutation = useMutation({
    mutationFn: async (companyData: BusinessRegistration) => {
      const response = await fetch(`/api/internal/business-registrations/${companyData.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(companyData)
      });
      if (!response.ok) throw new Error('Falha ao atualizar empresa');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/internal/business-registrations/with-tasks'] });
      setEditingCompany(null);
      toast({ title: "Empresa atualizada com sucesso!", variant: "default" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar empresa", description: error.message, variant: "destructive" });
    }
  });

  // Export mutations
  const exportExcelMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/internal/export/excel', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Falha ao exportar Excel: ${response.status} - ${errorText}`);
      }
      
      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Arquivo Excel vazio recebido');
      }
      
      return blob;
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_completo_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: "Excel exportado com sucesso!", variant: "default" });
    },
    onError: (error: Error) => {
      console.error('Erro ao exportar Excel:', error);
      toast({ title: "Erro ao exportar Excel", description: error.message, variant: "destructive" });
    },
  });

  const exportPdfMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/internal/export/pdf', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Falha ao exportar PDF: ${response.status} - ${errorText}`);
      }
      
      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Arquivo PDF vazio recebido');
      }
      
      return blob;
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_empresas_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: "PDF exportado com sucesso!", variant: "default" });
    },
    onError: (error: Error) => {
      console.error('Erro ao exportar PDF:', error);
      toast({ title: "Erro ao exportar PDF", description: error.message, variant: "destructive" });
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const response = await fetch('/api/internal/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(taskData),
      });
      if (!response.ok) throw new Error('Erro ao criar tarefa');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/internal/business-registrations/with-tasks'] });
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskDepartment('');
      toast({ title: "Tarefa criada com sucesso!", variant: "default" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar tarefa", description: error.message, variant: "destructive" });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await fetch(`/api/internal/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Erro ao deletar tarefa');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/internal/business-registrations/with-tasks'] });
      toast({ title: "Tarefa deletada com sucesso!", variant: "default" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao deletar tarefa", description: error.message, variant: "destructive" });
    },
  });

  // Edit task mutation
  const editTaskMutation = useMutation({
    mutationFn: async (taskData: {id: number; title: string; description: string}) => {
      const response = await fetch(`/api/internal/tasks/${taskData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          title: taskData.title,
          description: taskData.description
        }),
      });
      if (!response.ok) throw new Error('Erro ao editar tarefa');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/internal/business-registrations/with-tasks'] });
      setEditingTaskData(null);
      toast({ title: "Tarefa editada com sucesso!", variant: "default" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao editar tarefa", description: error.message, variant: "destructive" });
    },
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/equipe';
  };

  const handleDownloadFile = async (fileId: number, fileName: string) => {
    try {
      const response = await fetch(`/api/internal/files/${fileId}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) throw new Error('Falha ao baixar arquivo');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({ title: "Arquivo baixado com sucesso!", variant: "default" });
    } catch (error) {
      console.error('Download error:', error);
      toast({ title: "Erro ao baixar arquivo", variant: "destructive" });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFile(file || null);
  };

  const handleFileUpload = () => {
    if (selectedFile && selectedTask) {
      uploadFileMutation.mutate({ taskId: selectedTask.id, file: selectedFile });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileDownload = async (fileId: number) => {
    try {
      const response = await fetch(`/api/internal/files/${fileId}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'arquivo';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      toast({ title: "Erro ao baixar arquivo", variant: "destructive" });
    }
  };

  const handleUpdateObservacao = () => {
    if (selectedTask && observacao.trim()) {
      updateTaskFieldMutation.mutate({
        taskId: selectedTask.id,
        field: 'observacao',
        value: observacao,
      });
    }
  };

  const handleUpdateDataLembrete = () => {
    if (selectedTask && dataLembrete) {
      updateTaskFieldMutation.mutate({
        taskId: selectedTask.id,
        field: 'data_lembrete',
        value: dataLembrete,
      });
    }
  };

  const handleUpdateCnpj = () => {
    if (selectedTask && cnpjValue) {
      updateTaskFieldMutation.mutate({
        taskId: selectedTask.id,
        field: 'cnpj',
        value: cnpjValue,
      });
    }
  };

  const handleDeleteBusiness = (registration: BusinessRegistration) => {
    if (window.confirm(`Tem certeza que deseja excluir a empresa "${registration.razaoSocial}"?\n\nEsta ação não pode ser desfeita e irá deletar todas as tarefas e arquivos associados.`)) {
      deleteBusinessMutation.mutate(registration.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-red-500 hover:bg-red-600';
      case 'in_progress': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'completed': return 'bg-green-500 hover:bg-green-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'in_progress': return 'Em Andamento';
      case 'completed': return 'Concluída';
      default: return status;
    }
  };

  const filteredRegistrations = registrations.filter((reg: BusinessRegistration) => {
    const matchesSearch = reg.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reg.emailEmpresa.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedDepartment === 'all') return matchesSearch;
    
    // Para filtros por departamento, mostrar empresas que tenham pelo menos uma tarefa do departamento
    return matchesSearch && reg.tasks?.some((task: Task) => 
      task.department === selectedDepartment
    );
  });

  const getAllTasks = () => {
    return registrations.flatMap((reg: BusinessRegistration) => 
      (reg.tasks || []).map((task: Task) => ({ ...task, company: reg.razaoSocial }))
    );
  };

  const getTaskStatistics = () => {
    if (!registrations || !Array.isArray(registrations)) {
      return { pending: 0, inProgress: 0, completed: 0 };
    }
    
    let pending = 0, inProgress = 0, completed = 0;
    
    registrations.forEach((reg: BusinessRegistration) => {
      if (reg.tasks && Array.isArray(reg.tasks)) {
        reg.tasks.forEach((task: Task) => {
          if (task.status === 'pending') {
            pending++;
          } else if (task.status === 'in_progress') {
            inProgress++;
          } else if (task.status === 'completed') {
            completed++;
          }
        });
      }
    });
    
    return { pending, inProgress, completed };
  };

  const stats = getTaskStatistics();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Sistema Interno Prosperar Contabilidade</h1>
                <p className="text-sm text-muted-foreground">Gestão de Tarefas e Documentos</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => exportExcelMutation.mutate()}
                disabled={exportExcelMutation.isPending}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                {exportExcelMutation.isPending ? "Exportando..." : "Excel"}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => exportPdfMutation.mutate()}
                disabled={exportPdfMutation.isPending}
              >
                <FileDown className="h-4 w-4 mr-2" />
                {exportPdfMutation.isPending ? "Gerando..." : "PDF"}
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowUserManagement(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Usuários
              </Button>

              <ThemeToggle />
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
              <Badge className="bg-red-500 text-white">{stats.pending}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats.pending}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
              <Badge className="bg-yellow-500 text-white">{stats.inProgress}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{stats.inProgress}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
              <Badge className="bg-green-500 text-white">{stats.completed}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por empresa ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background text-foreground"
            >
              <option value="all">Todos os Departamentos</option>
              <option value="Societário">Societário</option>
              <option value="Fiscal">Fiscal</option>
              <option value="Pessoal">Pessoal</option>
            </select>
          </div>
        </div>

        {/* Companies and Tasks */}
        <div className="space-y-6">
          {filteredRegistrations.map((registration: BusinessRegistration) => (
            <Card key={registration.id} className="overflow-hidden">
              <CardHeader className="bg-muted/50">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{registration.razaoSocial}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {registration.nomeFantasia} • {registration.emailEmpresa}{registration.telefoneEmpresa ? ` • ${registration.telefoneEmpresa}` : ''}
                    </p>
                    {registration.cnpj && (
                      <p className="text-sm text-muted-foreground">CNPJ: {registration.cnpj}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {registration.tasks?.length || 0} tarefas
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingCompanyData(registration);
                        setShowCompanyEdit(true);
                      }}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteBusiness(registration)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      disabled={deleteBusinessMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <Tabs defaultValue="Societário" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="Societário">Societário</TabsTrigger>
                    <TabsTrigger value="Fiscal">Fiscal</TabsTrigger>
                    <TabsTrigger value="Pessoal">Pessoal</TabsTrigger>
                  </TabsList>
                  
                  {['Societário', 'Fiscal', 'Pessoal'].map((department) => {
                    // Only show tasks if no department filter is selected or if it matches the selected department
                    const shouldShowDepartment = selectedDepartment === 'all' || selectedDepartment === department;
                    const departmentTasks = registration.tasks
                      ?.filter((task: Task) => task.department === department)
                      .sort((a: Task, b: Task) => a.order - b.order);

                    return (
                      <TabsContent key={department} value={department} className="space-y-4 mt-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold">{department}</h3>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" onClick={() => setNewTaskDepartment(department)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Nova Tarefa
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Nova Tarefa - {department}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Título da Tarefa</Label>
                                  <Input
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    placeholder="Digite o título da tarefa"
                                  />
                                </div>
                                <div>
                                  <Label>Descrição</Label>
                                  <Input
                                    value={newTaskDescription}
                                    onChange={(e) => setNewTaskDescription(e.target.value)}
                                    placeholder="Digite a descrição da tarefa"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    onClick={() => {
                                      createTaskMutation.mutate({
                                        businessRegistrationId: registration.id,
                                        title: newTaskTitle,
                                        description: newTaskDescription,
                                        department: department,
                                        status: 'pending',
                                        order: (departmentTasks?.length || 0) + 1
                                      });
                                      setNewTaskTitle('');
                                      setNewTaskDescription('');
                                    }}
                                    disabled={!newTaskTitle.trim()}
                                  >
                                    Criar Tarefa
                                  </Button>
                                  <DialogClose asChild>
                                    <Button variant="outline" onClick={() => {
                                      setNewTaskTitle('');
                                      setNewTaskDescription('');
                                    }}>Cancelar</Button>
                                  </DialogClose>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        
                        {shouldShowDepartment && departmentTasks?.map((task: Task) => (
                          <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-medium">{task.title}</h4>
                              <p className="text-sm text-muted-foreground">{task.description}</p>
                              {task.cnpj && (
                                <p className="text-xs text-green-600 mt-1">CNPJ: {task.cnpj}</p>
                              )}
                              {task.observacao && (
                                <p className="text-xs text-blue-600 mt-1">Obs: {task.observacao}</p>
                              )}
                              {task.data_lembrete && (
                                <p className="text-xs text-orange-600 mt-1">
                                  Lembrete: {new Date(task.data_lembrete).toLocaleDateString('pt-BR')}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Badge className={`${getStatusColor(task.status)} text-white`}>
                                {getStatusText(task.status)}
                              </Badge>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteTaskMutation.mutate(task.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>

                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingTaskData({
                                      id: task.id,
                                      title: task.title,
                                      description: task.description
                                    })}
                                    className="text-blue-600 hover:text-blue-700"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Editar Tarefa</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Título da Tarefa</Label>
                                      <Input
                                        value={editingTaskData?.title || ''}
                                        onChange={(e) => setEditingTaskData(prev => 
                                          prev ? {...prev, title: e.target.value} : null
                                        )}
                                        placeholder="Digite o título da tarefa"
                                      />
                                    </div>
                                    <div>
                                      <Label>Descrição</Label>
                                      <Input
                                        value={editingTaskData?.description || ''}
                                        onChange={(e) => setEditingTaskData(prev => 
                                          prev ? {...prev, description: e.target.value} : null
                                        )}
                                        placeholder="Digite a descrição da tarefa"
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <Button 
                                        onClick={() => {
                                          if (editingTaskData) {
                                            editTaskMutation.mutate(editingTaskData);
                                          }
                                        }}
                                        disabled={!editingTaskData?.title.trim()}
                                      >
                                        Salvar Alterações
                                      </Button>
                                      <DialogClose asChild>
                                        <Button variant="outline" onClick={() => setEditingTaskData(null)}>
                                          Cancelar
                                        </Button>
                                      </DialogClose>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedTask(task);
                                      setObservacao(task.observacao || '');
                                      setDataLembrete(task.data_lembrete ? new Date(task.data_lembrete).toISOString().split('T')[0] : '');
                                      setCnpjValue(task.cnpj || '');
                                    }}
                                    className="text-blue-600 hover:text-blue-700"
                                  >
                                    Gerenciar
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>{task.title} - {registration.razaoSocial}</DialogTitle>
                                  </DialogHeader>
                                  
                                  <div className="space-y-6">
                                    {/* Status Update */}
                                    <div>
                                      <label className="text-sm font-medium">Status da Tarefa</label>
                                      <div className="flex gap-2 mt-2">
                                        {['pending', 'in_progress', 'completed'].map(status => (
                                          <Button
                                            key={status}
                                            size="sm"
                                            variant={task.status === status ? "default" : "outline"}
                                            className={task.status === status ? getStatusColor(status) : ''}
                                            onClick={() => updateTaskStatusMutation.mutate({ taskId: task.id, status })}
                                          >
                                            {getStatusText(status)}
                                          </Button>
                                        ))}
                                      </div>
                                    </div>

                                    {/* CNPJ Field */}
                                    {task.title === 'CNPJ' && (
                                      <div>
                                        <label className="text-sm font-medium">CNPJ</label>
                                        <div className="flex gap-2 mt-2">
                                          <Input
                                            value={cnpjValue}
                                            onChange={(e) => setCnpjValue(e.target.value)}
                                            placeholder="Digite o CNPJ"
                                          />
                                          <Button onClick={handleUpdateCnpj}>Salvar</Button>
                                        </div>
                                      </div>
                                    )}

                                    {/* Observações */}
                                    <div>
                                      <label className="text-sm font-medium">Observações</label>
                                      <div className="flex gap-2 mt-2">
                                        <Textarea
                                          value={observacao}
                                          onChange={(e) => setObservacao(e.target.value)}
                                          placeholder="Digite suas observações"
                                          rows={3}
                                        />
                                        <Button onClick={handleUpdateObservacao}>Salvar</Button>
                                      </div>
                                    </div>

                                    {/* Data de Lembrete */}
                                    <div>
                                      <label className="text-sm font-medium">Data de Lembrete</label>
                                      <div className="flex gap-2 mt-2">
                                        <Input
                                          type="date"
                                          value={dataLembrete}
                                          onChange={(e) => setDataLembrete(e.target.value)}
                                        />
                                        <Button onClick={handleUpdateDataLembrete}>Salvar</Button>
                                      </div>
                                    </div>

                                    {/* File Upload */}
                                    <div>
                                      <label className="text-sm font-medium">Envio de Arquivo</label>
                                      <div className="mt-2 space-y-3">
                                        <input
                                          ref={fileInputRef}
                                          type="file"
                                          onChange={handleFileSelect}
                                          accept=".pdf,.jpg,.jpeg,.png"
                                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />
                                        {selectedFile && (
                                          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                            <div>
                                              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                                {selectedFile.name}
                                              </p>
                                              <p className="text-xs text-blue-600 dark:text-blue-300">
                                                {Math.round(selectedFile.size / 1024)} KB
                                              </p>
                                            </div>
                                            <div className="flex gap-2">
                                              <Button
                                                size="sm"
                                                onClick={handleFileUpload}
                                                disabled={uploadFileMutation.isPending}
                                                className="bg-blue-600 hover:bg-blue-700"
                                              >
                                                {uploadFileMutation.isPending ? (
                                                  <>
                                                    <Upload className="h-4 w-4 mr-1 animate-spin" />
                                                    Enviando...
                                                  </>
                                                ) : (
                                                  <>
                                                    <Upload className="h-4 w-4 mr-1" />
                                                    Enviar
                                                  </>
                                                )}
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                  setSelectedFile(null);
                                                  if (fileInputRef.current) {
                                                    fileInputRef.current.value = '';
                                                  }
                                                }}
                                              >
                                                Cancelar
                                              </Button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Files List */}
                                    <div>
                                      <label className="text-sm font-medium">Histórico de Arquivos</label>
                                      {taskFiles.length > 0 ? (
                                        <div className="mt-2 space-y-2">
                                          {taskFiles.map((file) => (
                                            <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                                              <div className="flex-1">
                                                <span className="text-sm font-medium text-blue-600">{file.originalName}</span>
                                                <div className="text-xs text-muted-foreground">
                                                  {file.fileSize ? `${Math.round(file.fileSize / 1024)} KB` : ''} • 
                                                  {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString('pt-BR') : ''}
                                                </div>
                                              </div>
                                              <div className="flex gap-2">
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => handleDownloadFile(file.id, file.originalName)}
                                                  className="text-blue-600 hover:text-blue-700"
                                                >
                                                  <Download className="h-4 w-4 mr-1" />
                                                  Baixar
                                                </Button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="mt-2 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center text-sm text-muted-foreground">
                                          Nenhum arquivo enviado ainda
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        ))}
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* User Management Modal */}
      <Dialog open={showUserManagement} onOpenChange={setShowUserManagement}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Gestão de Usuários</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Usuários do Sistema</h3>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </div>

            <div className="border rounded-lg">
              <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 font-medium">
                <div>Nome</div>
                <div>Email</div>
                <div>Departamento</div>
                <div>Ações</div>
              </div>
              
              {(users as any[]).map((user: any) => (
                <div key={user.id} className="grid grid-cols-4 gap-4 p-4 border-t">
                  <div>{user.name}</div>
                  <div>{user.email}</div>
                  <div>{user.department}</div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Company Modal */}
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
                <div className="col-span-2">
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
                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={editingCompany.cnpj || ''}
                    onChange={(e) => setEditingCompany({...editingCompany, cnpj: e.target.value})}
                  />
                </div>

              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => editCompanyMutation.mutate(editingCompany)}
                  disabled={editCompanyMutation.isPending}
                >
                  {editCompanyMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
                <Button variant="outline" onClick={() => setEditingCompany(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Complete Company Edit Modal */}
      <Dialog open={showCompanyEdit} onOpenChange={setShowCompanyEdit}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Empresa Completa</DialogTitle>
          </DialogHeader>
          
          {editingCompanyData && (
            <div className="space-y-6">
              {/* Company Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="razaoSocial">Razão Social</Label>
                  <Input
                    id="razaoSocial"
                    value={editingCompanyData.razaoSocial}
                    onChange={(e) => setEditingCompanyData({...editingCompanyData, razaoSocial: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
                  <Input
                    id="nomeFantasia"
                    value={editingCompanyData.nomeFantasia}
                    onChange={(e) => setEditingCompanyData({...editingCompanyData, nomeFantasia: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="emailEmpresa">Email da Empresa</Label>
                  <Input
                    id="emailEmpresa"
                    value={editingCompanyData.emailEmpresa}
                    onChange={(e) => setEditingCompanyData({...editingCompanyData, emailEmpresa: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="telefoneEmpresa">Telefone da Empresa</Label>
                  <Input
                    id="telefoneEmpresa"
                    value={editingCompanyData.telefoneEmpresa}
                    onChange={(e) => setEditingCompanyData({...editingCompanyData, telefoneEmpresa: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={editingCompanyData.endereco}
                    onChange={(e) => setEditingCompanyData({...editingCompanyData, endereco: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={editingCompanyData.cnpj || ''}
                    onChange={(e) => setEditingCompanyData({...editingCompanyData, cnpj: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="capitalSocial">Capital Social</Label>
                  <Input
                    id="capitalSocial"
                    value={editingCompanyData.capitalSocial || ''}
                    onChange={(e) => setEditingCompanyData({...editingCompanyData, capitalSocial: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="atividadePrincipal">Atividade Principal</Label>
                  <Input
                    id="atividadePrincipal"
                    value={editingCompanyData.atividadePrincipal || ''}
                    onChange={(e) => setEditingCompanyData({...editingCompanyData, atividadePrincipal: e.target.value})}
                  />
                </div>
              </div>

              {/* Sócios Section */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Sócios</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newSocio = {
                        nomeCompleto: '',
                        cpf: '',
                        rg: '',
                        dataNascimento: '',
                        estadoCivil: '',
                        profissao: '',
                        nacionalidade: '',
                        enderecoPessoal: '',
                        telefonePessoal: '',
                        emailPessoal: '',
                        filiacao: ''
                      };
                      const updatedSocios = [...(editingCompanyData.socios || []), newSocio];
                      setEditingCompanyData({...editingCompanyData, socios: updatedSocios});
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Sócio
                  </Button>
                </div>
                
                {editingCompanyData.socios && editingCompanyData.socios.length > 0 ? (
                  <div className="space-y-4">
                    {editingCompanyData.socios.map((socio, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium">Sócio {index + 1}</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const updatedSocios = editingCompanyData.socios?.filter((_, i) => i !== index) || [];
                              setEditingCompanyData({...editingCompanyData, socios: updatedSocios});
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <Label>Nome Completo</Label>
                            <Input
                              value={socio.nomeCompleto}
                              onChange={(e) => {
                                const updatedSocios = [...(editingCompanyData.socios || [])];
                                updatedSocios[index] = {...socio, nomeCompleto: e.target.value};
                                setEditingCompanyData({...editingCompanyData, socios: updatedSocios});
                              }}
                            />
                          </div>
                          <div>
                            <Label>CPF</Label>
                            <Input
                              value={socio.cpf}
                              onChange={(e) => {
                                const updatedSocios = [...(editingCompanyData.socios || [])];
                                updatedSocios[index] = {...socio, cpf: e.target.value};
                                setEditingCompanyData({...editingCompanyData, socios: updatedSocios});
                              }}
                            />
                          </div>
                          <div>
                            <Label>RG</Label>
                            <Input
                              value={socio.rg}
                              onChange={(e) => {
                                const updatedSocios = [...(editingCompanyData.socios || [])];
                                updatedSocios[index] = {...socio, rg: e.target.value};
                                setEditingCompanyData({...editingCompanyData, socios: updatedSocios});
                              }}
                            />
                          </div>
                          <div>
                            <Label>Data de Nascimento</Label>
                            <Input
                              type="date"
                              value={socio.dataNascimento}
                              onChange={(e) => {
                                const updatedSocios = [...(editingCompanyData.socios || [])];
                                updatedSocios[index] = {...socio, dataNascimento: e.target.value};
                                setEditingCompanyData({...editingCompanyData, socios: updatedSocios});
                              }}
                            />
                          </div>
                          <div>
                            <Label>Estado Civil</Label>
                            <Input
                              value={socio.estadoCivil}
                              onChange={(e) => {
                                const updatedSocios = [...(editingCompanyData.socios || [])];
                                updatedSocios[index] = {...socio, estadoCivil: e.target.value};
                                setEditingCompanyData({...editingCompanyData, socios: updatedSocios});
                              }}
                            />
                          </div>
                          <div>
                            <Label>Profissão</Label>
                            <Input
                              value={socio.profissao}
                              onChange={(e) => {
                                const updatedSocios = [...(editingCompanyData.socios || [])];
                                updatedSocios[index] = {...socio, profissao: e.target.value};
                                setEditingCompanyData({...editingCompanyData, socios: updatedSocios});
                              }}
                            />
                          </div>
                          <div>
                            <Label>Nacionalidade</Label>
                            <Input
                              value={socio.nacionalidade}
                              onChange={(e) => {
                                const updatedSocios = [...(editingCompanyData.socios || [])];
                                updatedSocios[index] = {...socio, nacionalidade: e.target.value};
                                setEditingCompanyData({...editingCompanyData, socios: updatedSocios});
                              }}
                            />
                          </div>
                          <div>
                            <Label>Telefone Pessoal</Label>
                            <Input
                              value={socio.telefonePessoal}
                              onChange={(e) => {
                                const updatedSocios = [...(editingCompanyData.socios || [])];
                                updatedSocios[index] = {...socio, telefonePessoal: e.target.value};
                                setEditingCompanyData({...editingCompanyData, socios: updatedSocios});
                              }}
                            />
                          </div>
                          <div>
                            <Label>Email Pessoal</Label>
                            <Input
                              value={socio.emailPessoal}
                              onChange={(e) => {
                                const updatedSocios = [...(editingCompanyData.socios || [])];
                                updatedSocios[index] = {...socio, emailPessoal: e.target.value};
                                setEditingCompanyData({...editingCompanyData, socios: updatedSocios});
                              }}
                            />
                          </div>
                          <div className="md:col-span-2 lg:col-span-3">
                            <Label>Endereço Pessoal</Label>
                            <Input
                              value={socio.enderecoPessoal}
                              onChange={(e) => {
                                const updatedSocios = [...(editingCompanyData.socios || [])];
                                updatedSocios[index] = {...socio, enderecoPessoal: e.target.value};
                                setEditingCompanyData({...editingCompanyData, socios: updatedSocios});
                              }}
                            />
                          </div>
                          <div className="md:col-span-2 lg:col-span-3">
                            <Label>Filiação</Label>
                            <Input
                              value={socio.filiacao}
                              onChange={(e) => {
                                const updatedSocios = [...(editingCompanyData.socios || [])];
                                updatedSocios[index] = {...socio, filiacao: e.target.value};
                                setEditingCompanyData({...editingCompanyData, socios: updatedSocios});
                              }}
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum sócio cadastrado. Clique em "Adicionar Sócio" para começar.
                  </p>
                )}
              </div>

              {/* Documents Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Documentos da Empresa</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <h4 className="font-medium mb-2">Pasta Principal</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://drive.google.com/drive/folders/${editingCompanyData.id}`, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Abrir no Google Drive
                    </Button>
                  </Card>
                  <Card className="p-4">
                    <h4 className="font-medium mb-2">Departamento Societário</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://drive.google.com/drive/folders/${editingCompanyData.id}/societario`, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Abrir Pasta Societário
                    </Button>
                  </Card>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  onClick={() => {
                    console.log('Botão clicado!');
                    console.log('editingCompanyData:', editingCompanyData);
                    if (editingCompanyData) {
                      updateCompanyMutation.mutate(editingCompanyData);
                    } else {
                      console.error('editingCompanyData é null/undefined');
                    }
                  }}
                  disabled={updateCompanyMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {updateCompanyMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
                <Button variant="outline" onClick={() => setShowCompanyEdit(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
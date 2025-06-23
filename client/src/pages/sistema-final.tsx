import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ThemeToggle } from '@/components/theme-toggle';
import { Building2, Users, Upload, Download, Calendar, MessageSquare, LogOut, Search, Filter, Trash2, FileSpreadsheet, FileDown, Edit, Plus, Clock, CheckCircle2, AlertCircle, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Task {
  id: number;
  title: string;
  description: string;
  department: string;
  status: string;
  businessRegistrationId: number;
  observacao?: string;
  dataLembrete?: string;
  cnpj?: string;
}

interface TaskFile {
  id: number;
  taskId: number;
  fileName: string;
  originalName: string;
  uploadedAt: string;
}

interface BusinessRegistration {
  id: number;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj?: string;
  endereco: string;
  emailEmpresa: string;
  telefoneEmpresa: string;
  capitalSocial: string;
  atividadePrincipal: string;
  createdAt: string;
  tasks: Task[];
}

export default function SistemaFinal() {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [observacao, setObservacao] = useState('');
  const [dataLembrete, setDataLembrete] = useState('');
  const [cnpjValue, setCnpjValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: registrations = [], isLoading } = useQuery<BusinessRegistration[]>({
    queryKey: ['/api/internal/business-registrations/with-tasks'],
  });

  const { data: taskFiles = [] } = useQuery<TaskFile[]>({
    queryKey: ['/api/internal/tasks', selectedTask?.id, 'files'],
    enabled: !!selectedTask?.id,
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

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async ({ taskId, file }: { taskId: number; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      
      return fetch(`/api/internal/tasks/${taskId}/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/internal/tasks', selectedTask?.id, 'files'] });
      toast({ title: "Arquivo enviado com sucesso!", variant: "default" });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: () => {
      toast({ title: "Erro ao enviar arquivo", variant: "destructive" });
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/equipe';
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedTask) {
      uploadFileMutation.mutate({ taskId: selectedTask.id, file });
    }
  };

  const handleDownloadFile = async (fileId: number) => {
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
    if (selectedTask) {
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
        field: 'dataLembrete',
        value: new Date(dataLembrete).toISOString(),
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

  // Export functions
  const exportExcelMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/internal/export/excel', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to export Excel');
      
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `empresas_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: "Excel exportado com sucesso!", variant: "default" });
    },
    onError: () => {
      toast({ title: "Erro ao exportar Excel", variant: "destructive" });
    },
  });

  const exportPdfMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/internal/export/pdf', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to export PDF');
      
      return response.blob();
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
    onError: () => {
      toast({ title: "Erro ao exportar PDF", variant: "destructive" });
    },
  });

  const handleExportExcel = () => {
    exportExcelMutation.mutate();
  };

  const handleExportPDF = () => {
    exportPdfMutation.mutate();
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
    
    return matchesSearch && reg.tasks?.some((task: Task) => 
      task.department === selectedDepartment
    );
  });

  const getAllTasks = () => {
    return registrations.flatMap((reg: BusinessRegistration) => 
      (reg.tasks || []).map((task: Task) => ({ ...task, company: reg.razaoSocial }))
    );
  };

  const getTasksByDepartment = (department: string) => {
    return getAllTasks().filter((task: any) => task.department === department);
  };

  const getTaskStatistics = () => {
    const allTasks = getAllTasks();
    return {
      pending: allTasks.filter((task: any) => task.status === 'pending').length,
      inProgress: allTasks.filter((task: any) => task.status === 'in_progress').length,
      completed: allTasks.filter((task: any) => task.status === 'completed').length,
    };
  };

  const stats = getTaskStatistics();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-foreground">SISTEMA PROSPERAR CONTABILIDADE</h1>
                <p className="text-sm text-muted-foreground">Gestão de Tarefas e Documentos</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
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

          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={exportExcelMutation.isPending}
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              {exportExcelMutation.isPending ? "Exportando..." : "Excel"}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={exportPdfMutation.isPending}
              className="flex items-center gap-2"
            >
              <FileDown className="h-4 w-4" />
              {exportPdfMutation.isPending ? "Gerando..." : "PDF"}
            </Button>
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
                      {registration.nomeFantasia} • {registration.emailEmpresa}
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
                      onClick={() => handleDeleteBusiness(registration)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      disabled={deleteBusinessMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <Tabs defaultValue="Societário" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="Societário">Societário</TabsTrigger>
                    <TabsTrigger value="Fiscal">Fiscal</TabsTrigger>
                    <TabsTrigger value="Pessoal">Pessoal</TabsTrigger>
                  </TabsList>
                  
                  {['Societário', 'Fiscal', 'Pessoal'].map(department => (
                    <TabsContent key={department} value={department} className="p-4">
                      <div className="space-y-3">
                        {registration.tasks
                          ?.filter((task: Task) => task.department === department)
                          .map((task: Task) => (
                            <div key={task.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                              <div className="flex-1">
                                <h4 className="font-medium">{task.title}</h4>
                                <p className="text-sm text-muted-foreground">{task.description}</p>
                                {task.observacao && (
                                  <p className="text-xs text-blue-600 mt-1">Obs: {task.observacao}</p>
                                )}
                                {task.dataLembrete && (
                                  <p className="text-xs text-orange-600 mt-1">
                                    Lembrete: {new Date(task.dataLembrete).toLocaleDateString('pt-BR')}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Badge className={`${getStatusColor(task.status)} text-white`}>
                                  {getStatusText(task.status)}
                                </Badge>
                                
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedTask(task);
                                        setObservacao(task.observacao || '');
                                        setDataLembrete(task.dataLembrete ? task.dataLembrete.split('T')[0] : '');
                                        setCnpjValue(task.cnpj || '');
                                      }}
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

                                      {/* CNPJ Field (only for CNPJ task) */}
                                      {task.title === 'CNPJ' && (
                                        <div>
                                          <label className="text-sm font-medium">Número do CNPJ</label>
                                          <div className="flex gap-2 mt-2">
                                            <Input
                                              placeholder="00.000.000/0000-00"
                                              value={cnpjValue}
                                              onChange={(e) => setCnpjValue(e.target.value)}
                                            />
                                            <Button onClick={handleUpdateCnpj}>Salvar</Button>
                                          </div>
                                        </div>
                                      )}

                                      {/* Observations */}
                                      <div>
                                        <label className="text-sm font-medium">Observações</label>
                                        <div className="flex gap-2 mt-2">
                                          <Textarea
                                            placeholder="Adicione observações sobre esta tarefa..."
                                            value={observacao}
                                            onChange={(e) => setObservacao(e.target.value)}
                                            rows={3}
                                          />
                                          <Button onClick={handleUpdateObservacao}>
                                            <MessageSquare className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>

                                      {/* Reminder Date */}
                                      <div>
                                        <label className="text-sm font-medium">Data de Lembrete</label>
                                        <div className="flex gap-2 mt-2">
                                          <Input
                                            type="date"
                                            value={dataLembrete}
                                            onChange={(e) => setDataLembrete(e.target.value)}
                                          />
                                          <Button onClick={handleUpdateDataLembrete}>
                                            <Calendar className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>

                                      {/* File Upload */}
                                      <div>
                                        <label className="text-sm font-medium">Envio de Arquivo</label>
                                        <div className="flex gap-2 mt-2">
                                          <Input
                                            ref={fileInputRef}
                                            type="file"
                                            onChange={handleFileUpload}
                                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                          />
                                          <Button disabled={uploadFileMutation.isPending}>
                                            <Upload className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>

                                      {/* File List */}
                                      {taskFiles.length > 0 && (
                                        <div>
                                          <label className="text-sm font-medium">Arquivos Enviados</label>
                                          <div className="space-y-2 mt-2">
                                            {taskFiles.map((file: TaskFile) => (
                                              <div key={file.id} className="flex items-center justify-between p-2 border border-border rounded">
                                                <span className="text-sm">{file.originalName}</span>
                                                <div className="flex gap-2">
                                                  <span className="text-xs text-muted-foreground">
                                                    {new Date(file.uploadedAt).toLocaleDateString('pt-BR')}
                                                  </span>
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDownloadFile(file.id)}
                                                  >
                                                    <Download className="h-4 w-4" />
                                                  </Button>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </div>
                          ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
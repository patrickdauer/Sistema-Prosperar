import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { BackToHomeButton } from '@/components/back-to-home-button';

interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  department: string;
  assignedTo?: number;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  order: number;
  priority?: string;
  estimatedHours?: number;
}

interface ClienteWithTasks {
  id: number;
  razaoSocial: string;
  nomeFantasia?: string;
  email: string;
  telefoneComercial: string;
  status: string;
  origem: string;
  created_at: string;
  tasks: Task[];
}

const StatusButton = ({ 
  task, 
  onStatusChange 
}: { 
  task: Task; 
  onStatusChange: (taskId: number, status: string) => void;
}) => {
  const getStyle = (buttonStatus: string) => ({
    background: task.status === buttonStatus 
      ? (buttonStatus === 'pending' ? '#dc2626' : 
         buttonStatus === 'in_progress' ? '#ca8a04' : '#16a34a')
      : '#404040',
    color: '#ffffff',
    border: 'none',
    padding: '6px 12px',
    fontSize: '11px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500',
    marginRight: '6px',
    marginBottom: '4px'
  });

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

export default function ClienteTasks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Fetch clients with tasks
  const { data: clients, isLoading } = useQuery({
    queryKey: ['clientes-with-tasks'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/clientes/with-tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha ao carregar clientes');
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
      if (!response.ok) throw new Error('Falha ao atualizar tarefa');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes-with-tasks'] });
      toast({ description: 'Status da tarefa atualizado com sucesso!' });
    },
    onError: () => {
      toast({ description: 'Erro ao atualizar status da tarefa', variant: 'destructive' });
    }
  });

  // Create tasks for client mutation
  const createTasksMutation = useMutation({
    mutationFn: async (clientId: number) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/clientes/${clientId}/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Falha ao criar tarefas');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes-with-tasks'] });
      toast({ description: 'Tarefas criadas com sucesso!' });
    },
    onError: () => {
      toast({ description: 'Erro ao criar tarefas', variant: 'destructive' });
    }
  });

  const filteredClients = clients?.filter((client: ClienteWithTasks) => {
    if (departmentFilter === 'all') return true;
    return client.tasks?.some(task => task.department === departmentFilter);
  });

  const departments = ['all', 'societario', 'fiscal', 'contabil', 'rh'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6">
        <div className="text-center py-8">
          <div className="text-white">Carregando clientes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <BackToHomeButton />
            <div>
              <h1 className="text-3xl font-bold text-white">Gestão de Clientes</h1>
              <p className="text-gray-300">Tarefas e acompanhamento de clientes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-green-500" />
            <span className="text-white font-medium">{filteredClients?.length || 0} clientes</span>
          </div>
        </div>

        {/* Department Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {departments.map(dept => (
            <Button
              key={dept}
              variant={departmentFilter === dept ? "default" : "outline"}
              size="sm"
              onClick={() => setDepartmentFilter(dept)}
              className={`${
                departmentFilter === dept 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600'
              }`}
            >
              {dept === 'all' ? 'Todos' : dept.charAt(0).toUpperCase() + dept.slice(1)}
            </Button>
          ))}
        </div>

        {/* Clients Grid */}
        <div className="grid gap-6">
          {filteredClients?.map((client: ClienteWithTasks) => (
            <Card key={client.id} className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white text-xl">{client.razaoSocial}</CardTitle>
                    {client.nomeFantasia && (
                      <p className="text-gray-400 text-sm">{client.nomeFantasia}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <Badge variant="outline" className="text-gray-300 border-gray-600">
                        {client.origem}
                      </Badge>
                      <Badge 
                        variant={client.status === 'ativo' ? 'default' : 'secondary'}
                        className={client.status === 'ativo' ? 'bg-green-600' : 'bg-gray-600'}
                      >
                        {client.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-300 text-sm">{client.email}</div>
                    <div className="text-gray-400 text-sm">{client.telefoneComercial}</div>
                    {(!client.tasks || client.tasks.length === 0) && (
                      <Button
                        size="sm"
                        onClick={() => createTasksMutation.mutate(client.id)}
                        disabled={createTasksMutation.isPending}
                        className="mt-2 bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Criar Tarefas
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              {client.tasks && client.tasks.length > 0 && (
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {['societario', 'fiscal', 'contabil', 'rh'].map(dept => {
                      const deptTasks = client.tasks.filter(task => task.department === dept);
                      if (deptTasks.length === 0) return null;

                      return (
                        <div key={dept} className="bg-gray-700 p-4 rounded-lg">
                          <div className="text-white font-semibold text-sm mb-3 pb-2 border-b border-gray-600 capitalize">
                            {dept === 'societario' ? 'Societário' : 
                             dept === 'fiscal' ? 'Fiscal' :
                             dept === 'contabil' ? 'Contábil' : 'RH'}
                          </div>
                          {deptTasks.map(task => (
                            <div key={task.id} className="mb-4 last:mb-0">
                              <div className="text-gray-300 text-xs mb-2 leading-relaxed">
                                {task.title}
                              </div>
                              <StatusButton 
                                task={task} 
                                onStatusChange={(taskId, status) => 
                                  updateTaskMutation.mutate({ taskId, status })
                                } 
                              />
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {filteredClients?.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Nenhum cliente encontrado</h3>
            <p className="text-gray-400">
              {departmentFilter === 'all' 
                ? 'Não há clientes cadastrados no sistema.'
                : `Não há clientes com tarefas no departamento ${departmentFilter}.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
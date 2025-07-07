import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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
  emailEmpresa: string;
  telefoneEmpresa: string;
  createdAt: string;
  tasks: Task[];
}

export default function SistemaNovo() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: registrationsData, isLoading } = useQuery({
    queryKey: ['/api/internal/business-registrations/with-tasks'],
    refetchInterval: 3000,
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: string }) => {
      const response = await fetch(`/api/internal/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error('Erro ao atualizar tarefa');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/internal/business-registrations/with-tasks'] });
      toast({
        title: "Sucesso",
        description: "Status da tarefa atualizado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status da tarefa",
        variant: "destructive",
      });
    },
  });

  const updateTaskDetailsMutation = useMutation({
    mutationFn: async ({ taskId, data }: { taskId: number; data: any }) => {
      const response = await fetch(`/api/internal/tasks/${taskId}/edit`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Erro ao atualizar tarefa');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/internal/business-registrations/with-tasks'] });
      toast({
        title: "Sucesso",
        description: "Tarefa atualizada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar tarefa",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await fetch(`/api/internal/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) {
        throw new Error('Erro ao deletar tarefa');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/internal/business-registrations/with-tasks'] });
      toast({
        title: "Sucesso",
        description: "Tarefa deletada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao deletar tarefa",
        variant: "destructive",
      });
    },
  });

  if (isLoading) return <div>Carregando...</div>;

  const allRegistrations = registrationsData || [];
  const totalRegistrations = allRegistrations.length;
  const pendingRegistrations = allRegistrations.filter((reg: any) => reg.status === 'pending').length;
  const processingRegistrations = allRegistrations.filter((reg: any) => reg.status === 'in_progress').length;
  const completedRegistrations = allRegistrations.filter((reg: any) => reg.status === 'completed').length;



  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)', 
      color: '#ffffff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ 
        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', 
        padding: '20px',
        borderBottom: '1px solid #333'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            color: '#ffffff',
            margin: 0
          }}>
            Sistema Interno
          </h1>
          <button
            onClick={logout}
            style={{
              background: '#dc2626',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Sair
          </button>
        </div>
      </div>

      <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '8px', border: '1px solid #333' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#22c55e' }}>{totalRegistrations}</div>
            <div style={{ fontSize: '14px', color: '#a0a0a0', fontWeight: '500' }}>Total de Empresas</div>
          </div>
          <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '8px', border: '1px solid #333' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#e74c3c' }}>{pendingRegistrations}</div>
            <div style={{ fontSize: '14px', color: '#a0a0a0', fontWeight: '500' }}>Pendentes</div>
          </div>
          <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '8px', border: '1px solid #333' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#f39c12' }}>{processingRegistrations}</div>
            <div style={{ fontSize: '14px', color: '#a0a0a0', fontWeight: '500' }}>Em Andamento</div>
          </div>
          <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '8px', border: '1px solid #333' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#27ae60' }}>{completedRegistrations}</div>
            <div style={{ fontSize: '14px', color: '#a0a0a0', fontWeight: '500' }}>Concluídas</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
          {allRegistrations.map((registration: any, index: number) => (
            <div key={registration.id || index} style={{ 
              background: '#1a1a1a', 
              padding: '20px', 
              borderRadius: '8px', 
              border: '1px solid #333',
              display: 'flex',
              flexDirection: 'column',
              gap: '15px'
            }}>
              <div>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: '#22c55e', 
                  margin: '0 0 8px 0' 
                }}>
                  {registration.razaoSocial}
                </h3>
                <div style={{ fontSize: '14px', color: '#a0a0a0' }}>
                  {registration.emailEmpresa}
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff' }}>
                  Tarefas ({registration.tasks?.length || 0})
                </div>
                
                {registration.tasks?.map((task: any) => (
                  <div key={task.id} style={{ 
                    background: '#2a2a2a', 
                    padding: '15px', 
                    borderRadius: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
                          {task.title}
                        </div>
                        <div style={{ fontSize: '12px', color: '#a0a0a0', marginTop: '4px' }}>
                          {task.description}
                        </div>
                        <div style={{ fontSize: '11px', color: '#ff8c42', marginTop: '4px', fontWeight: '500' }}>
                          {task.department}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          onClick={() => {
                            const newTitle = prompt('Novo título:', task.title);
                            if (newTitle && newTitle !== task.title) {
                              const newDescription = prompt('Nova descrição:', task.description);
                              if (newDescription !== null) {
                                const newObservacao = prompt('Nova observação:', task.observacao || '');
                                if (newObservacao !== null) {
                                  updateTaskDetailsMutation.mutate({
                                    taskId: task.id,
                                    data: {
                                      title: newTitle,
                                      description: newDescription,
                                      observacao: newObservacao
                                    }
                                  });
                                }
                              }
                            }
                          }}
                          style={{ background: '#444', color: '#fff', border: 'none', padding: '4px 8px', fontSize: '10px', borderRadius: '3px', cursor: 'pointer' }}
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm(`Deletar tarefa "${task.title}"?`)) {
                              deleteTaskMutation.mutate(task.id);
                            }
                          }}
                          style={{ background: '#e74c3c', color: '#fff', border: 'none', padding: '4px 8px', fontSize: '10px', borderRadius: '3px', cursor: 'pointer' }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'pending' })}
                        className={task.status === 'pending' ? 'btn-status-active-red' : 'btn-status-inactive'}
                      >
                        Pendente
                      </button>
                      <button
                        onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'in_progress' })}
                        className={task.status === 'in_progress' ? 'btn-status-active-orange' : 'btn-status-inactive'}
                      >
                        Andamento
                      </button>
                      <button
                        onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'completed' })}
                        className={task.status === 'completed' ? 'btn-status-active-green' : 'btn-status-inactive'}
                      >
                        Concluído
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
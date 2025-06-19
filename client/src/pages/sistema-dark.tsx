import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

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

export default function SistemaDark() {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data: registrations, isLoading: registrationsLoading } = useQuery<BusinessRegistration[]>({
    queryKey: ['/api/business-registrations'],
    enabled: isAuthenticated,
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: string }) => {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-registrations'] });
    },
  });

  if (isLoading || registrationsLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>Carregando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>Acesso não autorizado</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      
      {/* Header */}
      <div style={{
        background: '#111111',
        padding: '20px',
        borderBottom: '1px solid #222222'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '600',
              margin: '0 0 4px 0',
              color: '#ffffff'
            }}>
              Sistema Interno
            </h1>
            <div style={{ fontSize: '14px', color: '#666666' }}>
              {user?.name} • {user?.role}
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              background: '#222222',
              border: '1px solid #333333',
              color: '#ffffff',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Sair
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '30px 20px'
      }}>
        
        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
          marginBottom: '40px'
        }}>
          <div style={{
            background: '#111111',
            padding: '20px',
            borderRadius: '6px',
            textAlign: 'center',
            border: '1px solid #222222'
          }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
              {(registrations as BusinessRegistration[])?.length || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#666666' }}>Empresas</div>
          </div>
          
          <div style={{
            background: '#111111',
            padding: '20px',
            borderRadius: '6px',
            textAlign: 'center',
            border: '1px solid #222222'
          }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
              {(registrations as BusinessRegistration[])?.reduce((acc: number, reg: BusinessRegistration) => 
                acc + (reg.tasks?.filter((t: Task) => t.status === 'pending').length || 0), 0) || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#666666' }}>Pendentes</div>
          </div>

          <div style={{
            background: '#111111',
            padding: '20px',
            borderRadius: '6px',
            textAlign: 'center',
            border: '1px solid #222222'
          }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
              {(registrations as BusinessRegistration[])?.reduce((acc: number, reg: BusinessRegistration) => 
                acc + (reg.tasks?.filter((t: Task) => t.status === 'in_progress').length || 0), 0) || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#666666' }}>Em Andamento</div>
          </div>

          <div style={{
            background: '#111111',
            padding: '20px',
            borderRadius: '6px',
            textAlign: 'center',
            border: '1px solid #222222'
          }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
              {(registrations as BusinessRegistration[])?.reduce((acc: number, reg: BusinessRegistration) => 
                acc + (reg.tasks?.filter((t: Task) => t.status === 'completed').length || 0), 0) || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#666666' }}>Concluídas</div>
          </div>
        </div>

        {/* Companies */}
        <div style={{ display: 'grid', gap: '30px' }}>
          {(registrations as BusinessRegistration[])?.map((registration: BusinessRegistration) => (
            <div key={registration.id} style={{
              background: '#111111',
              borderRadius: '6px',
              border: '1px solid #222222',
              overflow: 'hidden'
            }}>
              
              {/* Company Header */}
              <div style={{
                background: '#1a1a1a',
                padding: '20px',
                borderBottom: '1px solid #222222'
              }}>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '6px' }}>
                  {registration.razaoSocial}
                </div>
                <div style={{ fontSize: '14px', color: '#666666' }}>
                  {registration.nomeFantasia && `${registration.nomeFantasia} • `}
                  ID: {registration.id} • {registration.emailEmpresa}
                </div>
              </div>

              {/* Departments */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '1px',
                background: '#222222'
              }}>
                
                {/* Societário */}
                <div style={{
                  background: '#111111',
                  padding: '20px'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#ffffff',
                    marginBottom: '16px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid #222222'
                  }}>
                    Societário
                  </div>
                  {registration.tasks?.filter(task => task.department === 'societario').map(task => (
                    <div key={task.id} style={{ marginBottom: '16px' }}>
                      <div style={{
                        fontSize: '13px',
                        color: '#cccccc',
                        marginBottom: '10px',
                        lineHeight: '1.4'
                      }}>
                        {task.title}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => {
                            const newStatus = task.status === 'pending' ? 'idle' : 'pending';
                            updateTaskMutation.mutate({ taskId: task.id, status: newStatus });
                          }}
                          style={{
                            background: task.status === 'pending' ? '#dc3545' : '#333333',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 12px',
                            fontSize: '11px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          Pendente
                        </button>
                        <button
                          onClick={() => {
                            const newStatus = task.status === 'in_progress' ? 'idle' : 'in_progress';
                            updateTaskMutation.mutate({ taskId: task.id, status: newStatus });
                          }}
                          style={{
                            background: task.status === 'in_progress' ? '#fd7e14' : '#333333',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 12px',
                            fontSize: '11px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          Andamento
                        </button>
                        <button
                          onClick={() => {
                            const newStatus = task.status === 'completed' ? 'idle' : 'completed';
                            updateTaskMutation.mutate({ taskId: task.id, status: newStatus });
                          }}
                          style={{
                            background: task.status === 'completed' ? '#198754' : '#333333',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 12px',
                            fontSize: '11px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          Concluído
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Fiscal */}
                <div style={{
                  background: '#111111',
                  padding: '20px'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#ffffff',
                    marginBottom: '16px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid #222222'
                  }}>
                    Fiscal
                  </div>
                  {registration.tasks?.filter(task => task.department === 'fiscal').map(task => (
                    <div key={task.id} style={{ marginBottom: '16px' }}>
                      <div style={{
                        fontSize: '13px',
                        color: '#cccccc',
                        marginBottom: '10px',
                        lineHeight: '1.4'
                      }}>
                        {task.title}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => {
                            const newStatus = task.status === 'pending' ? 'idle' : 'pending';
                            updateTaskMutation.mutate({ taskId: task.id, status: newStatus });
                          }}
                          style={{
                            background: task.status === 'pending' ? '#dc3545' : '#333333',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 12px',
                            fontSize: '11px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          Pendente
                        </button>
                        <button
                          onClick={() => {
                            const newStatus = task.status === 'in_progress' ? 'idle' : 'in_progress';
                            updateTaskMutation.mutate({ taskId: task.id, status: newStatus });
                          }}
                          style={{
                            background: task.status === 'in_progress' ? '#fd7e14' : '#333333',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 12px',
                            fontSize: '11px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          Andamento
                        </button>
                        <button
                          onClick={() => {
                            const newStatus = task.status === 'completed' ? 'idle' : 'completed';
                            updateTaskMutation.mutate({ taskId: task.id, status: newStatus });
                          }}
                          style={{
                            background: task.status === 'completed' ? '#198754' : '#333333',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 12px',
                            fontSize: '11px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          Concluído
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pessoal */}
                <div style={{
                  background: '#111111',
                  padding: '20px'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#ffffff',
                    marginBottom: '16px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid #222222'
                  }}>
                    Pessoal
                  </div>
                  {registration.tasks?.filter(task => task.department === 'pessoal').map(task => (
                    <div key={task.id} style={{ marginBottom: '16px' }}>
                      <div style={{
                        fontSize: '13px',
                        color: '#cccccc',
                        marginBottom: '10px',
                        lineHeight: '1.4'
                      }}>
                        {task.title}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => {
                            const newStatus = task.status === 'pending' ? 'idle' : 'pending';
                            updateTaskMutation.mutate({ taskId: task.id, status: newStatus });
                          }}
                          style={{
                            background: task.status === 'pending' ? '#dc3545' : '#333333',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 12px',
                            fontSize: '11px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          Pendente
                        </button>
                        <button
                          onClick={() => {
                            const newStatus = task.status === 'in_progress' ? 'idle' : 'in_progress';
                            updateTaskMutation.mutate({ taskId: task.id, status: newStatus });
                          }}
                          style={{
                            background: task.status === 'in_progress' ? '#fd7e14' : '#333333',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 12px',
                            fontSize: '11px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          Andamento
                        </button>
                        <button
                          onClick={() => {
                            const newStatus = task.status === 'completed' ? 'idle' : 'completed';
                            updateTaskMutation.mutate({ taskId: task.id, status: newStatus });
                          }}
                          style={{
                            background: task.status === 'completed' ? '#198754' : '#333333',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 12px',
                            fontSize: '11px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          Concluído
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
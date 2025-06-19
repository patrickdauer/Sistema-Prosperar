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

export default function DashboardInterno() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch registrations
  const { data: registrations, isLoading } = useQuery({
    queryKey: ['registrations-novo'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/internal/registrations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erro ao carregar');
      return response.json();
    }
  });

  // Update task status
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
      if (!response.ok) throw new Error('Erro ao atualizar');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations-novo'] });
      toast({ title: "Status atualizado!" });
    }
  });

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#1a1a2e',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '4px solid #16213e',
            borderTop: '4px solid #0f3460',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <h2>Carregando Sistema Interno</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#1a1a2e',
      color: 'white'
    }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(45deg, #16213e 0%, #0f3460 100%)',
        padding: '20px 0',
        borderBottom: '2px solid #0f3460'
      }}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto', 
          padding: '0 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: 'bold', 
              margin: 0,
              color: '#e94560'
            }}>
              Sistema de Gestão Empresarial
            </h1>
            <p style={{ margin: '8px 0 0 0', opacity: 0.8 }}>
              Controle Avançado de Processos
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ 
              background: 'rgba(233, 69, 96, 0.2)', 
              padding: '10px 20px', 
              borderRadius: '25px',
              border: '1px solid #e94560'
            }}>
              <span>{user?.name} - {user?.role}</span>
            </div>
            <button
              onClick={logout}
              style={{
                background: '#e94560',
                border: 'none',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '30px 20px' 
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px',
          marginBottom: '40px'
        }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #e94560 0%, #f27a7a 100%)',
            padding: '25px',
            borderRadius: '15px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold' }}>
              {registrations?.length || 0}
            </div>
            <div>Total de Empresas</div>
          </div>
          
          <div style={{ 
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
            padding: '25px',
            borderRadius: '15px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold' }}>
              {registrations?.reduce((acc: number, reg: BusinessRegistration) => 
                acc + (reg.tasks?.filter((t: Task) => t.status === 'pending').length || 0), 0) || 0}
            </div>
            <div>Pendentes</div>
          </div>

          <div style={{ 
            background: 'linear-gradient(135deg, #ffa726 0%, #ff9800 100%)',
            padding: '25px',
            borderRadius: '15px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold' }}>
              {registrations?.reduce((acc: number, reg: BusinessRegistration) => 
                acc + (reg.tasks?.filter((t: Task) => t.status === 'in_progress').length || 0), 0) || 0}
            </div>
            <div>Em Andamento</div>
          </div>

          <div style={{ 
            background: 'linear-gradient(135deg, #66bb6a 0%, #4caf50 100%)',
            padding: '25px',
            borderRadius: '15px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold' }}>
              {registrations?.reduce((acc: number, reg: BusinessRegistration) => 
                acc + (reg.tasks?.filter((t: Task) => t.status === 'completed').length || 0), 0) || 0}
            </div>
            <div>Concluídas</div>
          </div>
        </div>

        {/* Companies List */}
        <div style={{ display: 'grid', gap: '30px' }}>
          {registrations?.map((registration: BusinessRegistration) => (
            <div key={registration.id} style={{ 
              background: 'linear-gradient(145deg, #16213e 0%, #0f3460 100%)',
              borderRadius: '20px',
              overflow: 'hidden',
              border: '1px solid #e94560'
            }}>
              {/* Company Header */}
              <div style={{ 
                background: 'rgba(233, 69, 96, 0.1)', 
                padding: '25px',
                borderBottom: '1px solid #e94560'
              }}>
                <h3 style={{ 
                  fontSize: '24px', 
                  margin: '0 0 10px 0',
                  color: '#e94560'
                }}>
                  {registration.razaoSocial}
                </h3>
                <p style={{ margin: '0 0 15px 0', opacity: 0.8 }}>
                  {registration.nomeFantasia}
                </p>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '10px',
                  fontSize: '14px',
                  opacity: 0.7
                }}>
                  <div>📧 {registration.emailEmpresa}</div>
                  <div>📞 {registration.telefoneEmpresa}</div>
                  <div>🆔 ID: {registration.id}</div>
                  <div>📅 {new Date(registration.createdAt).toLocaleDateString('pt-BR')}</div>
                </div>
              </div>

              {/* Departments */}
              <div style={{ padding: '30px' }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
                  gap: '25px' 
                }}>
                  {/* Societário */}
                  <div style={{ 
                    background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                    borderRadius: '15px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      background: 'rgba(0,0,0,0.2)', 
                      padding: '15px',
                      fontWeight: 'bold',
                      fontSize: '18px'
                    }}>
                      🏢 Depto. Societário
                    </div>
                    <div style={{ padding: '20px' }}>
                      {registration.tasks?.filter(task => task.department === 'societario').map(task => (
                        <div key={task.id} style={{ 
                          background: 'rgba(255,255,255,0.1)', 
                          padding: '15px', 
                          borderRadius: '10px',
                          marginBottom: '15px'
                        }}>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p style={{ margin: '0 0 15px 0', fontSize: '14px', opacity: 0.8 }}>
                              {task.description}
                            </p>
                          )}
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'pending' })}
                              style={{
                                background: task.status === 'pending' ? '#dc2626' : 'rgba(220, 38, 38, 0.3)',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                textTransform: 'uppercase'
                              }}
                            >
                              PENDENTE
                            </button>
                            <button
                              onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'in_progress' })}
                              style={{
                                background: task.status === 'in_progress' ? '#ca8a04' : 'rgba(202, 138, 4, 0.3)',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                textTransform: 'uppercase'
                              }}
                            >
                              EM ANDAMENTO
                            </button>
                            <button
                              onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'completed' })}
                              style={{
                                background: task.status === 'completed' ? '#16a34a' : 'rgba(22, 163, 74, 0.3)',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                textTransform: 'uppercase'
                              }}
                            >
                              CONCLUÍDA
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fiscal */}
                  <div style={{ 
                    background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                    borderRadius: '15px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      background: 'rgba(0,0,0,0.2)', 
                      padding: '15px',
                      fontWeight: 'bold',
                      fontSize: '18px'
                    }}>
                      📊 Depto. Fiscal
                    </div>
                    <div style={{ padding: '20px' }}>
                      {registration.tasks?.filter(task => task.department === 'fiscal').map(task => (
                        <div key={task.id} style={{ 
                          background: 'rgba(255,255,255,0.1)', 
                          padding: '15px', 
                          borderRadius: '10px',
                          marginBottom: '15px'
                        }}>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p style={{ margin: '0 0 15px 0', fontSize: '14px', opacity: 0.8 }}>
                              {task.description}
                            </p>
                          )}
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'pending' })}
                              style={{
                                background: task.status === 'pending' ? '#dc2626' : 'rgba(220, 38, 38, 0.3)',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                textTransform: 'uppercase'
                              }}
                            >
                              PENDENTE
                            </button>
                            <button
                              onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'in_progress' })}
                              style={{
                                background: task.status === 'in_progress' ? '#ca8a04' : 'rgba(202, 138, 4, 0.3)',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                textTransform: 'uppercase'
                              }}
                            >
                              EM ANDAMENTO
                            </button>
                            <button
                              onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'completed' })}
                              style={{
                                background: task.status === 'completed' ? '#16a34a' : 'rgba(22, 163, 74, 0.3)',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                textTransform: 'uppercase'
                              }}
                            >
                              CONCLUÍDA
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pessoal */}
                  <div style={{ 
                    background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
                    borderRadius: '15px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      background: 'rgba(0,0,0,0.2)', 
                      padding: '15px',
                      fontWeight: 'bold',
                      fontSize: '18px'
                    }}>
                      👥 Depto. Pessoal
                    </div>
                    <div style={{ padding: '20px' }}>
                      {registration.tasks?.filter(task => task.department === 'pessoal').map(task => (
                        <div key={task.id} style={{ 
                          background: 'rgba(255,255,255,0.1)', 
                          padding: '15px', 
                          borderRadius: '10px',
                          marginBottom: '15px'
                        }}>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p style={{ margin: '0 0 15px 0', fontSize: '14px', opacity: 0.8 }}>
                              {task.description}
                            </p>
                          )}
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'pending' })}
                              style={{
                                background: task.status === 'pending' ? '#dc2626' : 'rgba(220, 38, 38, 0.3)',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                textTransform: 'uppercase'
                              }}
                            >
                              PENDENTE
                            </button>
                            <button
                              onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'in_progress' })}
                              style={{
                                background: task.status === 'in_progress' ? '#ca8a04' : 'rgba(202, 138, 4, 0.3)',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                textTransform: 'uppercase'
                              }}
                            >
                              EM ANDAMENTO
                            </button>
                            <button
                              onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'completed' })}
                              style={{
                                background: task.status === 'completed' ? '#16a34a' : 'rgba(22, 163, 74, 0.3)',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                textTransform: 'uppercase'
                              }}
                            >
                              CONCLUÍDA
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }} />
    </div>
  );
}
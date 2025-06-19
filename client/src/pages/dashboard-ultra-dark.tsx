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

export default function DashboardUltraDark() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch registrations
  const { data: registrations, isLoading } = useQuery({
    queryKey: ['registrations-ultra'],
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
      queryClient.invalidateQueries({ queryKey: ['registrations-ultra'] });
      toast({ title: "Status atualizado!" });
    }
  });

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#000000',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            border: '3px solid #111111',
            borderTop: '3px solid #333333',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <h2 style={{ color: '#666666', fontSize: '18px' }}>Carregando Sistema</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#000000',
      color: '#00ff00',
      fontFamily: 'monospace',
      fontSize: '14px'
    }}>
      {/* Header */}
      <div style={{ 
        background: '#000000',
        padding: '30px 0',
        borderBottom: '1px solid #111111',
        position: 'relative'
      }}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto', 
          padding: '0 30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '50px', 
              fontWeight: '900', 
              margin: 0,
              color: '#00ff00',
              letterSpacing: '0.1em',
              textShadow: '0 0 20px #00ff00'
            }}>
              ▓▓▓ SISTEMA ULTRA ▓▓▓
            </h1>
            <p style={{ margin: '15px 0 0 0', color: '#00ff00', fontSize: '16px', fontWeight: '700', letterSpacing: '0.3em' }}>
              ► MATRIX MODE ACTIVATED ◄
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            <div style={{ 
              background: '#111111', 
              padding: '12px 20px', 
              borderRadius: '4px',
              border: '1px solid #222222'
            }}>
              <span style={{ color: '#cccccc', fontSize: '13px', fontWeight: '500' }}>
                {user?.name} / {user?.role}
              </span>
            </div>
            <button
              onClick={logout}
              style={{
                background: '#111111',
                border: '1px solid #333333',
                color: '#ffffff',
                padding: '12px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '13px'
              }}
            >
              SAIR
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '40px 30px' 
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '1px',
          marginBottom: '60px',
          background: '#111111',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{ 
            background: '#000000',
            padding: '40px 20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', fontWeight: '900', color: '#ffffff', marginBottom: '8px', fontFamily: 'monospace' }}>
              {String(registrations?.length || 0).padStart(2, '0')}
            </div>
            <div style={{ color: '#444444', fontSize: '11px', fontWeight: '500', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Empresas
            </div>
          </div>
          
          <div style={{ 
            background: '#000000',
            padding: '40px 20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', fontWeight: '900', color: '#ff3333', marginBottom: '8px', fontFamily: 'monospace' }}>
              {String(registrations?.reduce((acc: number, reg: BusinessRegistration) => 
                acc + (reg.tasks?.filter((t: Task) => t.status === 'pending').length || 0), 0) || 0).padStart(2, '0')}
            </div>
            <div style={{ color: '#444444', fontSize: '11px', fontWeight: '500', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Pendentes
            </div>
          </div>

          <div style={{ 
            background: '#000000',
            padding: '40px 20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', fontWeight: '900', color: '#ffaa00', marginBottom: '8px', fontFamily: 'monospace' }}>
              {String(registrations?.reduce((acc: number, reg: BusinessRegistration) => 
                acc + (reg.tasks?.filter((t: Task) => t.status === 'in_progress').length || 0), 0) || 0).padStart(2, '0')}
            </div>
            <div style={{ color: '#444444', fontSize: '11px', fontWeight: '500', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Andamento
            </div>
          </div>

          <div style={{ 
            background: '#000000',
            padding: '40px 20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', fontWeight: '900', color: '#00cc44', marginBottom: '8px', fontFamily: 'monospace' }}>
              {String(registrations?.reduce((acc: number, reg: BusinessRegistration) => 
                acc + (reg.tasks?.filter((t: Task) => t.status === 'completed').length || 0), 0) || 0).padStart(2, '0')}
            </div>
            <div style={{ color: '#444444', fontSize: '11px', fontWeight: '500', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Concluídas
            </div>
          </div>
        </div>

        {/* Companies List */}
        <div style={{ display: 'grid', gap: '40px' }}>
          {registrations?.map((registration: BusinessRegistration) => (
            <div key={registration.id} style={{ 
              background: '#000000',
              border: '1px solid #111111',
              overflow: 'hidden'
            }}>
              {/* Company Header */}
              <div style={{ 
                background: '#000000', 
                padding: '30px',
                borderBottom: '1px solid #111111'
              }}>
                <h3 style={{ 
                  fontSize: '24px', 
                  margin: '0 0 8px 0',
                  color: '#ffffff',
                  fontWeight: '600',
                  letterSpacing: '-0.01em'
                }}>
                  {registration.razaoSocial}
                </h3>
                <p style={{ margin: '0 0 20px 0', color: '#666666', fontSize: '14px' }}>
                  {registration.nomeFantasia}
                </p>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '12px',
                  fontSize: '12px',
                  color: '#444444'
                }}>
                  <div>{registration.emailEmpresa}</div>
                  <div>{registration.telefoneEmpresa}</div>
                  <div>ID {registration.id}</div>
                  <div>{new Date(registration.createdAt).toLocaleDateString('pt-BR')}</div>
                </div>
              </div>

              {/* Departments */}
              <div style={{ padding: '0' }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: '1px',
                  background: '#111111'
                }}>
                  {/* Societário */}
                  <div style={{ 
                    background: '#000000'
                  }}>
                    <div style={{ 
                      background: '#111111', 
                      padding: '20px',
                      fontWeight: '600',
                      fontSize: '12px',
                      color: '#ffffff',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase'
                    }}>
                      Societário
                    </div>
                    <div style={{ padding: '30px' }}>
                      {registration.tasks?.filter(task => task.department === 'societario').map(task => (
                        <div key={task.id} style={{ 
                          borderBottom: '1px solid #111111',
                          paddingBottom: '20px',
                          marginBottom: '20px'
                        }}>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#ffffff', fontWeight: '500' }}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p style={{ margin: '0 0 15px 0', fontSize: '12px', color: '#666666', lineHeight: '1.4' }}>
                              {task.description}
                            </p>
                          )}
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'pending' })}
                              style={{
                                background: task.status === 'pending' ? '#dc2626' : '#111111',
                                color: '#ffffff',
                                border: 'none',
                                padding: '6px 12px',
                                fontSize: '10px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                              }}
                            >
                              PEN
                            </button>
                            <button
                              onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'in_progress' })}
                              style={{
                                background: task.status === 'in_progress' ? '#ca8a04' : '#111111',
                                color: '#ffffff',
                                border: 'none',
                                padding: '6px 12px',
                                fontSize: '10px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                              }}
                            >
                              AND
                            </button>
                            <button
                              onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'completed' })}
                              style={{
                                background: task.status === 'completed' ? '#16a34a' : '#111111',
                                color: '#ffffff',
                                border: 'none',
                                padding: '6px 12px',
                                fontSize: '10px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                              }}
                            >
                              CON
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fiscal */}
                  <div style={{ 
                    background: '#000000'
                  }}>
                    <div style={{ 
                      background: '#111111', 
                      padding: '20px',
                      fontWeight: '600',
                      fontSize: '12px',
                      color: '#ffffff',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase'
                    }}>
                      Fiscal
                    </div>
                    <div style={{ padding: '30px' }}>
                      {registration.tasks?.filter(task => task.department === 'fiscal').map(task => (
                        <div key={task.id} style={{ 
                          borderBottom: '1px solid #111111',
                          paddingBottom: '20px',
                          marginBottom: '20px'
                        }}>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#ffffff', fontWeight: '500' }}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p style={{ margin: '0 0 15px 0', fontSize: '12px', color: '#666666', lineHeight: '1.4' }}>
                              {task.description}
                            </p>
                          )}
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'pending' })}
                              style={{
                                background: task.status === 'pending' ? '#dc2626' : '#111111',
                                color: '#ffffff',
                                border: 'none',
                                padding: '6px 12px',
                                fontSize: '10px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                              }}
                            >
                              PEN
                            </button>
                            <button
                              onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'in_progress' })}
                              style={{
                                background: task.status === 'in_progress' ? '#ca8a04' : '#111111',
                                color: '#ffffff',
                                border: 'none',
                                padding: '6px 12px',
                                fontSize: '10px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                              }}
                            >
                              AND
                            </button>
                            <button
                              onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'completed' })}
                              style={{
                                background: task.status === 'completed' ? '#16a34a' : '#111111',
                                color: '#ffffff',
                                border: 'none',
                                padding: '6px 12px',
                                fontSize: '10px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                              }}
                            >
                              CON
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pessoal */}
                  <div style={{ 
                    background: '#000000'
                  }}>
                    <div style={{ 
                      background: '#111111', 
                      padding: '20px',
                      fontWeight: '600',
                      fontSize: '12px',
                      color: '#ffffff',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase'
                    }}>
                      Pessoal
                    </div>
                    <div style={{ padding: '30px' }}>
                      {registration.tasks?.filter(task => task.department === 'pessoal').map(task => (
                        <div key={task.id} style={{ 
                          borderBottom: '1px solid #111111',
                          paddingBottom: '20px',
                          marginBottom: '20px'
                        }}>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#ffffff', fontWeight: '500' }}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p style={{ margin: '0 0 15px 0', fontSize: '12px', color: '#666666', lineHeight: '1.4' }}>
                              {task.description}
                            </p>
                          )}
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'pending' })}
                              style={{
                                background: task.status === 'pending' ? '#dc2626' : '#111111',
                                color: '#ffffff',
                                border: 'none',
                                padding: '6px 12px',
                                fontSize: '10px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                              }}
                            >
                              PEN
                            </button>
                            <button
                              onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'in_progress' })}
                              style={{
                                background: task.status === 'in_progress' ? '#ca8a04' : '#111111',
                                color: '#ffffff',
                                border: 'none',
                                padding: '6px 12px',
                                fontSize: '10px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                              }}
                            >
                              AND
                            </button>
                            <button
                              onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'completed' })}
                              style={{
                                background: task.status === 'completed' ? '#16a34a' : '#111111',
                                color: '#ffffff',
                                border: 'none',
                                padding: '6px 12px',
                                fontSize: '10px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                              }}
                            >
                              CON
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
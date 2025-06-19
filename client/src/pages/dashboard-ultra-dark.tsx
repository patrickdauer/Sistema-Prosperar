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
      color: '#ffffff'
    }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #111111 0%, #1a1a1a 100%)',
        padding: '25px 0',
        borderBottom: '1px solid #222222',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.8)'
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
              fontSize: '36px', 
              fontWeight: 'bold', 
              margin: 0,
              background: 'linear-gradient(45deg, #ffffff 0%, #888888 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Sistema Interno Ultra
            </h1>
            <p style={{ margin: '10px 0 0 0', color: '#666666', fontSize: '16px' }}>
              Dashboard Empresarial Premium
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #222222 0%, #333333 100%)', 
              padding: '15px 25px', 
              borderRadius: '50px',
              border: '1px solid #444444',
              backdropFilter: 'blur(20px)'
            }}>
              <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: '500' }}>
                {user?.name} • {user?.role}
              </span>
            </div>
            <button
              onClick={logout}
              style={{
                background: 'linear-gradient(135deg, #333333 0%, #444444 100%)',
                border: '1px solid #555555',
                color: '#ffffff',
                padding: '15px 25px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #444444 0%, #555555 100%)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #333333 0%, #444444 100%)';
              }}
            >
              Sair do Sistema
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '25px',
          marginBottom: '50px'
        }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #111111 0%, #222222 100%)',
            padding: '30px',
            borderRadius: '20px',
            textAlign: 'center',
            border: '1px solid #333333',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7)'
          }}>
            <div style={{ fontSize: '42px', fontWeight: '900', color: '#ffffff', marginBottom: '10px' }}>
              {registrations?.length || 0}
            </div>
            <div style={{ color: '#888888', fontSize: '16px', fontWeight: '500' }}>Total de Empresas</div>
          </div>
          
          <div style={{ 
            background: 'linear-gradient(135deg, #111111 0%, #222222 100%)',
            padding: '30px',
            borderRadius: '20px',
            textAlign: 'center',
            border: '1px solid #dc2626',
            boxShadow: '0 10px 30px rgba(220, 38, 38, 0.2)'
          }}>
            <div style={{ fontSize: '42px', fontWeight: '900', color: '#ff4444', marginBottom: '10px' }}>
              {registrations?.reduce((acc: number, reg: BusinessRegistration) => 
                acc + (reg.tasks?.filter((t: Task) => t.status === 'pending').length || 0), 0) || 0}
            </div>
            <div style={{ color: '#888888', fontSize: '16px', fontWeight: '500' }}>Tarefas Pendentes</div>
          </div>

          <div style={{ 
            background: 'linear-gradient(135deg, #111111 0%, #222222 100%)',
            padding: '30px',
            borderRadius: '20px',
            textAlign: 'center',
            border: '1px solid #ca8a04',
            boxShadow: '0 10px 30px rgba(202, 138, 4, 0.2)'
          }}>
            <div style={{ fontSize: '42px', fontWeight: '900', color: '#ffaa00', marginBottom: '10px' }}>
              {registrations?.reduce((acc: number, reg: BusinessRegistration) => 
                acc + (reg.tasks?.filter((t: Task) => t.status === 'in_progress').length || 0), 0) || 0}
            </div>
            <div style={{ color: '#888888', fontSize: '16px', fontWeight: '500' }}>Em Andamento</div>
          </div>

          <div style={{ 
            background: 'linear-gradient(135deg, #111111 0%, #222222 100%)',
            padding: '30px',
            borderRadius: '20px',
            textAlign: 'center',
            border: '1px solid #16a34a',
            boxShadow: '0 10px 30px rgba(22, 163, 74, 0.2)'
          }}>
            <div style={{ fontSize: '42px', fontWeight: '900', color: '#00cc44', marginBottom: '10px' }}>
              {registrations?.reduce((acc: number, reg: BusinessRegistration) => 
                acc + (reg.tasks?.filter((t: Task) => t.status === 'completed').length || 0), 0) || 0}
            </div>
            <div style={{ color: '#888888', fontSize: '16px', fontWeight: '500' }}>Concluídas</div>
          </div>
        </div>

        {/* Companies List */}
        <div style={{ display: 'grid', gap: '40px' }}>
          {registrations?.map((registration: BusinessRegistration) => (
            <div key={registration.id} style={{ 
              background: 'linear-gradient(145deg, #111111 0%, #1a1a1a 100%)',
              borderRadius: '25px',
              overflow: 'hidden',
              border: '1px solid #333333',
              boxShadow: '0 15px 40px rgba(0, 0, 0, 0.8)'
            }}>
              {/* Company Header */}
              <div style={{ 
                background: 'linear-gradient(135deg, #1a1a1a 0%, #222222 100%)', 
                padding: '30px',
                borderBottom: '1px solid #333333'
              }}>
                <h3 style={{ 
                  fontSize: '28px', 
                  margin: '0 0 15px 0',
                  color: '#ffffff',
                  fontWeight: '700'
                }}>
                  {registration.razaoSocial}
                </h3>
                <p style={{ margin: '0 0 20px 0', color: '#aaaaaa', fontSize: '18px' }}>
                  {registration.nomeFantasia}
                </p>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                  gap: '15px',
                  fontSize: '15px',
                  color: '#777777'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#555555' }}>✉</span> {registration.emailEmpresa}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#555555' }}>☎</span> {registration.telefoneEmpresa}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#555555' }}>🆔</span> ID: {registration.id}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#555555' }}>📅</span> {new Date(registration.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>

              {/* Departments */}
              <div style={{ padding: '40px' }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', 
                  gap: '30px' 
                }}>
                  {/* Societário */}
                  <div style={{ 
                    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    border: '1px solid #444444'
                  }}>
                    <div style={{ 
                      background: 'linear-gradient(135deg, #222222 0%, #333333 100%)', 
                      padding: '20px',
                      fontWeight: 'bold',
                      fontSize: '20px',
                      color: '#ffffff',
                      borderBottom: '1px solid #444444'
                    }}>
                      🏢 Departamento Societário
                    </div>
                    <div style={{ padding: '25px' }}>
                      {registration.tasks?.filter(task => task.department === 'societario').map(task => (
                        <div key={task.id} style={{ 
                          background: 'linear-gradient(135deg, #1a1a1a 0%, #222222 100%)', 
                          padding: '20px', 
                          borderRadius: '15px',
                          marginBottom: '20px',
                          border: '1px solid #333333'
                        }}>
                          <h4 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#ffffff', fontWeight: '600' }}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p style={{ margin: '0 0 20px 0', fontSize: '15px', color: '#aaaaaa', lineHeight: '1.5' }}>
                              {task.description}
                            </p>
                          )}
                          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'pending' })}
                              style={{
                                background: task.status === 'pending' ? '#dc2626' : 'rgba(220, 38, 38, 0.2)',
                                color: '#ffffff',
                                border: task.status === 'pending' ? '2px solid #dc2626' : '2px solid rgba(220, 38, 38, 0.5)',
                                padding: '10px 16px',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              PENDENTE
                            </button>
                            <button
                              onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'in_progress' })}
                              style={{
                                background: task.status === 'in_progress' ? '#ca8a04' : 'rgba(202, 138, 4, 0.2)',
                                color: '#ffffff',
                                border: task.status === 'in_progress' ? '2px solid #ca8a04' : '2px solid rgba(202, 138, 4, 0.5)',
                                padding: '10px 16px',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              EM ANDAMENTO
                            </button>
                            <button
                              onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'completed' })}
                              style={{
                                background: task.status === 'completed' ? '#16a34a' : 'rgba(22, 163, 74, 0.2)',
                                color: '#ffffff',
                                border: task.status === 'completed' ? '2px solid #16a34a' : '2px solid rgba(22, 163, 74, 0.5)',
                                padding: '10px 16px',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                transition: 'all 0.3s ease'
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
                    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    border: '1px solid #444444'
                  }}>
                    <div style={{ 
                      background: 'linear-gradient(135deg, #222222 0%, #333333 100%)', 
                      padding: '20px',
                      fontWeight: 'bold',
                      fontSize: '20px',
                      color: '#ffffff',
                      borderBottom: '1px solid #444444'
                    }}>
                      📊 Departamento Fiscal
                    </div>
                    <div style={{ padding: '25px' }}>
                      {registration.tasks?.filter(task => task.department === 'fiscal').map(task => (
                        <div key={task.id} style={{ 
                          background: 'linear-gradient(135deg, #1a1a1a 0%, #222222 100%)', 
                          padding: '20px', 
                          borderRadius: '15px',
                          marginBottom: '20px',
                          border: '1px solid #333333'
                        }}>
                          <h4 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#ffffff', fontWeight: '600' }}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p style={{ margin: '0 0 20px 0', fontSize: '15px', color: '#aaaaaa', lineHeight: '1.5' }}>
                              {task.description}
                            </p>
                          )}
                          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'pending' })}
                              style={{
                                background: task.status === 'pending' ? '#dc2626' : 'rgba(220, 38, 38, 0.2)',
                                color: '#ffffff',
                                border: task.status === 'pending' ? '2px solid #dc2626' : '2px solid rgba(220, 38, 38, 0.5)',
                                padding: '10px 16px',
                                borderRadius: '8px',
                                fontSize: '13px',
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
                                background: task.status === 'in_progress' ? '#ca8a04' : 'rgba(202, 138, 4, 0.2)',
                                color: '#ffffff',
                                border: task.status === 'in_progress' ? '2px solid #ca8a04' : '2px solid rgba(202, 138, 4, 0.5)',
                                padding: '10px 16px',
                                borderRadius: '8px',
                                fontSize: '13px',
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
                                background: task.status === 'completed' ? '#16a34a' : 'rgba(22, 163, 74, 0.2)',
                                color: '#ffffff',
                                border: task.status === 'completed' ? '2px solid #16a34a' : '2px solid rgba(22, 163, 74, 0.5)',
                                padding: '10px 16px',
                                borderRadius: '8px',
                                fontSize: '13px',
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
                    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    border: '1px solid #444444'
                  }}>
                    <div style={{ 
                      background: 'linear-gradient(135deg, #222222 0%, #333333 100%)', 
                      padding: '20px',
                      fontWeight: 'bold',
                      fontSize: '20px',
                      color: '#ffffff',
                      borderBottom: '1px solid #444444'
                    }}>
                      👥 Departamento Pessoal
                    </div>
                    <div style={{ padding: '25px' }}>
                      {registration.tasks?.filter(task => task.department === 'pessoal').map(task => (
                        <div key={task.id} style={{ 
                          background: 'linear-gradient(135deg, #1a1a1a 0%, #222222 100%)', 
                          padding: '20px', 
                          borderRadius: '15px',
                          marginBottom: '20px',
                          border: '1px solid #333333'
                        }}>
                          <h4 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#ffffff', fontWeight: '600' }}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p style={{ margin: '0 0 20px 0', fontSize: '15px', color: '#aaaaaa', lineHeight: '1.5' }}>
                              {task.description}
                            </p>
                          )}
                          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'pending' })}
                              style={{
                                background: task.status === 'pending' ? '#dc2626' : 'rgba(220, 38, 38, 0.2)',
                                color: '#ffffff',
                                border: task.status === 'pending' ? '2px solid #dc2626' : '2px solid rgba(220, 38, 38, 0.5)',
                                padding: '10px 16px',
                                borderRadius: '8px',
                                fontSize: '13px',
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
                                background: task.status === 'in_progress' ? '#ca8a04' : 'rgba(202, 138, 4, 0.2)',
                                color: '#ffffff',
                                border: task.status === 'in_progress' ? '2px solid #ca8a04' : '2px solid rgba(202, 138, 4, 0.5)',
                                padding: '10px 16px',
                                borderRadius: '8px',
                                fontSize: '13px',
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
                                background: task.status === 'completed' ? '#16a34a' : 'rgba(22, 163, 74, 0.2)',
                                color: '#ffffff',
                                border: task.status === 'completed' ? '2px solid #16a34a' : '2px solid rgba(22, 163, 74, 0.5)',
                                padding: '10px 16px',
                                borderRadius: '8px',
                                fontSize: '13px',
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
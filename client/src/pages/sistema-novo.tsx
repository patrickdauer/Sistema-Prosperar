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

  // Fetch registrations
  const { data: registrations, isLoading } = useQuery({
    queryKey: ['registrations-sistema-novo'],
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
      queryClient.invalidateQueries({ queryKey: ['registrations-sistema-novo'] });
      toast({ title: "Status atualizado!" });
    }
  });

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#000',
        color: '#0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
        fontSize: '24px'
      }}>
        <div>LOADING NEW SYSTEM...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#000',
      color: '#0f0',
      fontFamily: 'monospace',
      padding: '0',
      margin: '0'
    }}>
      
      {/* Header Terminal Style */}
      <div style={{ 
        background: '#000',
        padding: '20px',
        borderBottom: '2px solid #0f0',
        fontFamily: 'monospace'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ 
              fontSize: '32px', 
              fontWeight: 'bold',
              color: '#0f0',
              textShadow: '0 0 10px #0f0'
            }}>
              [SISTEMA_INTERNO_v2.0]
            </div>
            <div style={{ fontSize: '14px', color: '#0a0' }}>
              &gt; STATUS: ONLINE | USER: {user?.name} | ROLE: {user?.role}
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              background: '#000',
              border: '2px solid #0f0',
              color: '#0f0',
              padding: '10px 20px',
              fontFamily: 'monospace',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            [LOGOUT]
          </button>
        </div>
      </div>

      {/* Stats Terminal */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '30px 20px' 
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr 1fr 1fr', 
          gap: '2px',
          marginBottom: '40px',
          border: '2px solid #0f0'
        }}>
          <div style={{ 
            background: '#000',
            padding: '20px',
            textAlign: 'center',
            borderRight: '1px solid #0f0'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f0' }}>
              {String(registrations?.length || 0).padStart(3, '0')}
            </div>
            <div style={{ fontSize: '10px', color: '#0a0' }}>EMPRESAS</div>
          </div>
          
          <div style={{ 
            background: '#000',
            padding: '20px',
            textAlign: 'center',
            borderRight: '1px solid #0f0'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f00' }}>
              {String(registrations?.reduce((acc: number, reg: BusinessRegistration) => 
                acc + (reg.tasks?.filter((t: Task) => t.status === 'pending').length || 0), 0) || 0).padStart(3, '0')}
            </div>
            <div style={{ fontSize: '10px', color: '#0a0' }}>PENDENTES</div>
          </div>

          <div style={{ 
            background: '#000',
            padding: '20px',
            textAlign: 'center',
            borderRight: '1px solid #0f0'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff0' }}>
              {String(registrations?.reduce((acc: number, reg: BusinessRegistration) => 
                acc + (reg.tasks?.filter((t: Task) => t.status === 'in_progress').length || 0), 0) || 0).padStart(3, '0')}
            </div>
            <div style={{ fontSize: '10px', color: '#0a0' }}>ANDAMENTO</div>
          </div>

          <div style={{ 
            background: '#000',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f0' }}>
              {String(registrations?.reduce((acc: number, reg: BusinessRegistration) => 
                acc + (reg.tasks?.filter((t: Task) => t.status === 'completed').length || 0), 0) || 0).padStart(3, '0')}
            </div>
            <div style={{ fontSize: '10px', color: '#0a0' }}>CONCLUIDAS</div>
          </div>
        </div>

        {/* Companies Terminal List */}
        <div style={{ display: 'grid', gap: '20px' }}>
          {registrations?.map((registration: BusinessRegistration) => (
            <div key={registration.id} style={{ 
              border: '2px solid #0f0',
              background: '#000'
            }}>
              
              {/* Company Header */}
              <div style={{ 
                background: '#001100', 
                padding: '15px',
                borderBottom: '1px solid #0f0'
              }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f0' }}>
                  &gt; {registration.razaoSocial}
                </div>
                <div style={{ fontSize: '12px', color: '#0a0', marginTop: '5px' }}>
                  ID:{registration.id} | {registration.emailEmpresa} | {registration.telefoneEmpresa}
                </div>
              </div>

              {/* Departments Terminal Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '1px',
                background: '#0f0'
              }}>
                
                {/* Societário */}
                <div style={{ background: '#000', padding: '15px' }}>
                  <div style={{ 
                    fontSize: '12px', 
                    fontWeight: 'bold', 
                    color: '#0f0',
                    marginBottom: '10px',
                    borderBottom: '1px solid #0f0',
                    paddingBottom: '5px'
                  }}>
                    [SOCIETARIO]
                  </div>
                  {registration.tasks?.filter(task => task.department === 'societario').map(task => (
                    <div key={task.id} style={{ marginBottom: '15px' }}>
                      <div style={{ fontSize: '11px', color: '#0f0', marginBottom: '5px' }}>
                        &gt; {task.title}
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'pending' })}
                          style={{
                            background: task.status === 'pending' ? '#f00' : '#000',
                            color: task.status === 'pending' ? '#000' : '#f00',
                            border: '1px solid #f00',
                            padding: '2px 6px',
                            fontSize: '9px',
                            fontFamily: 'monospace',
                            cursor: 'pointer'
                          }}
                        >
                          PEN
                        </button>
                        <button
                          onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'in_progress' })}
                          style={{
                            background: task.status === 'in_progress' ? '#ff0' : '#000',
                            color: task.status === 'in_progress' ? '#000' : '#ff0',
                            border: '1px solid #ff0',
                            padding: '2px 6px',
                            fontSize: '9px',
                            fontFamily: 'monospace',
                            cursor: 'pointer'
                          }}
                        >
                          AND
                        </button>
                        <button
                          onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'completed' })}
                          style={{
                            background: task.status === 'completed' ? '#0f0' : '#000',
                            color: task.status === 'completed' ? '#000' : '#0f0',
                            border: '1px solid #0f0',
                            padding: '2px 6px',
                            fontSize: '9px',
                            fontFamily: 'monospace',
                            cursor: 'pointer'
                          }}
                        >
                          OK
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Fiscal */}
                <div style={{ background: '#000', padding: '15px' }}>
                  <div style={{ 
                    fontSize: '12px', 
                    fontWeight: 'bold', 
                    color: '#0f0',
                    marginBottom: '10px',
                    borderBottom: '1px solid #0f0',
                    paddingBottom: '5px'
                  }}>
                    [FISCAL]
                  </div>
                  {registration.tasks?.filter(task => task.department === 'fiscal').map(task => (
                    <div key={task.id} style={{ marginBottom: '15px' }}>
                      <div style={{ fontSize: '11px', color: '#0f0', marginBottom: '5px' }}>
                        &gt; {task.title}
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'pending' })}
                          style={{
                            background: task.status === 'pending' ? '#f00' : '#000',
                            color: task.status === 'pending' ? '#000' : '#f00',
                            border: '1px solid #f00',
                            padding: '2px 6px',
                            fontSize: '9px',
                            fontFamily: 'monospace',
                            cursor: 'pointer'
                          }}
                        >
                          PEN
                        </button>
                        <button
                          onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'in_progress' })}
                          style={{
                            background: task.status === 'in_progress' ? '#ff0' : '#000',
                            color: task.status === 'in_progress' ? '#000' : '#ff0',
                            border: '1px solid #ff0',
                            padding: '2px 6px',
                            fontSize: '9px',
                            fontFamily: 'monospace',
                            cursor: 'pointer'
                          }}
                        >
                          AND
                        </button>
                        <button
                          onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'completed' })}
                          style={{
                            background: task.status === 'completed' ? '#0f0' : '#000',
                            color: task.status === 'completed' ? '#000' : '#0f0',
                            border: '1px solid #0f0',
                            padding: '2px 6px',
                            fontSize: '9px',
                            fontFamily: 'monospace',
                            cursor: 'pointer'
                          }}
                        >
                          OK
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pessoal */}
                <div style={{ background: '#000', padding: '15px' }}>
                  <div style={{ 
                    fontSize: '12px', 
                    fontWeight: 'bold', 
                    color: '#0f0',
                    marginBottom: '10px',
                    borderBottom: '1px solid #0f0',
                    paddingBottom: '5px'
                  }}>
                    [PESSOAL]
                  </div>
                  {registration.tasks?.filter(task => task.department === 'pessoal').map(task => (
                    <div key={task.id} style={{ marginBottom: '15px' }}>
                      <div style={{ fontSize: '11px', color: '#0f0', marginBottom: '5px' }}>
                        &gt; {task.title}
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'pending' })}
                          style={{
                            background: task.status === 'pending' ? '#f00' : '#000',
                            color: task.status === 'pending' ? '#000' : '#f00',
                            border: '1px solid #f00',
                            padding: '2px 6px',
                            fontSize: '9px',
                            fontFamily: 'monospace',
                            cursor: 'pointer'
                          }}
                        >
                          PEN
                        </button>
                        <button
                          onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'in_progress' })}
                          style={{
                            background: task.status === 'in_progress' ? '#ff0' : '#000',
                            color: task.status === 'in_progress' ? '#000' : '#ff0',
                            border: '1px solid #ff0',
                            padding: '2px 6px',
                            fontSize: '9px',
                            fontFamily: 'monospace',
                            cursor: 'pointer'
                          }}
                        >
                          AND
                        </button>
                        <button
                          onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'completed' })}
                          style={{
                            background: task.status === 'completed' ? '#0f0' : '#000',
                            color: task.status === 'completed' ? '#000' : '#0f0',
                            border: '1px solid #0f0',
                            padding: '2px 6px',
                            fontSize: '9px',
                            fontFamily: 'monospace',
                            cursor: 'pointer'
                          }}
                        >
                          OK
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
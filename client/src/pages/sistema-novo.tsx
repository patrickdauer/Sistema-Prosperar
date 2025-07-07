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

  // Fetch registrations with client tasks
  const { data: registrations, isLoading } = useQuery({
    queryKey: ['registrations-sistema-novo'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/internal/business-registrations/with-tasks', {
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
      background: '#1a1a1a',
      color: '#e0e0e0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '0',
      margin: '0'
    }}>
      
      {/* Header Professional */}
      <div style={{ 
        background: '#2a2a2a',
        padding: '24px',
        borderBottom: '1px solid #404040'
      }}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ 
              fontSize: '28px', 
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: '4px'
            }}>
              Sistema de Gestão Interno
            </div>
            <div style={{ fontSize: '14px', color: '#a0a0a0' }}>
              {user?.name} • {user?.role} • Sistema Ativo
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              background: '#404040',
              border: '1px solid #606060',
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

      {/* Stats Professional */}
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '30px 24px' 
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '16px',
          marginBottom: '40px'
        }}>
          <div style={{ 
            background: '#2a2a2a',
            padding: '24px',
            borderRadius: '8px',
            textAlign: 'center',
            border: '1px solid #404040'
          }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
              {registrations?.length || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#a0a0a0', fontWeight: '500' }}>Total de Empresas</div>
          </div>
          
          <div style={{ 
            background: '#2a2a2a',
            padding: '24px',
            borderRadius: '8px',
            textAlign: 'center',
            border: '1px solid #e74c3c'
          }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#e74c3c', marginBottom: '8px' }}>
              {registrations?.reduce((acc: number, reg: BusinessRegistration) => 
                acc + (reg.tasks?.filter((t: Task) => t.status === 'pending').length || 0), 0) || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#a0a0a0', fontWeight: '500' }}>Pendentes</div>
          </div>

          <div style={{ 
            background: '#2a2a2a',
            padding: '24px',
            borderRadius: '8px',
            textAlign: 'center',
            border: '1px solid #f39c12'
          }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#f39c12', marginBottom: '8px' }}>
              {registrations?.reduce((acc: number, reg: BusinessRegistration) => 
                acc + (reg.tasks?.filter((t: Task) => t.status === 'in_progress').length || 0), 0) || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#a0a0a0', fontWeight: '500' }}>Em Andamento</div>
          </div>

          <div style={{ 
            background: '#2a2a2a',
            padding: '24px',
            borderRadius: '8px',
            textAlign: 'center',
            border: '1px solid #27ae60'
          }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#27ae60', marginBottom: '8px' }}>
              {registrations?.reduce((acc: number, reg: BusinessRegistration) => 
                acc + (reg.tasks?.filter((t: Task) => t.status === 'completed').length || 0), 0) || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#a0a0a0', fontWeight: '500' }}>Concluídas</div>
          </div>
        </div>

        {/* Companies Professional List */}
        <div style={{ display: 'grid', gap: '24px' }}>
          {registrations?.map((registration: BusinessRegistration) => (
            <div key={registration.id} style={{ 
              border: '1px solid #404040',
              background: '#2a2a2a',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              
              {/* Company Header */}
              <div style={{ 
                background: '#333333', 
                padding: '20px',
                borderBottom: '1px solid #404040'
              }}>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
                  {registration.razaoSocial}
                </div>
                <div style={{ fontSize: '14px', color: '#a0a0a0' }}>
                  {registration.nomeFantasia && `${registration.nomeFantasia} • `}
                  ID: {registration.id} • {registration.emailEmpresa} • {registration.telefoneEmpresa}
                </div>
              </div>

              {/* Departments Professional Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '16px',
                padding: '20px'
              }}>
                
                {/* Societário */}
                <div style={{ background: '#333333', padding: '16px', borderRadius: '6px' }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#ffffff',
                    marginBottom: '16px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid #505050'
                  }}>
                    Departamento Societário
                  </div>
                  {registration.tasks?.filter(task => task.department === 'societario' || task.department === 'Societário' || task.department === 'DEPTO SOCIETARIO').map(task => (
                    <div key={task.id} style={{ marginBottom: '16px', padding: '12px', border: '1px solid #505050', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontSize: '13px', color: '#e0e0e0', marginBottom: '4px', lineHeight: '1.4', fontWeight: '600' }}>
                            {task.title}
                          </div>
                          <div style={{ fontSize: '11px', color: '#a0a0a0', marginBottom: '8px' }}>
                            {task.description}
                          </div>
                          {task.observacao && (
                            <div style={{ fontSize: '10px', color: '#f39c12', marginBottom: '8px', fontStyle: 'italic' }}>
                              Obs: {task.observacao}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button style={{ background: '#444', color: '#fff', border: 'none', padding: '4px 8px', fontSize: '10px', borderRadius: '3px', cursor: 'pointer' }}>
                            ✏️
                          </button>
                          <button style={{ background: '#e74c3c', color: '#fff', border: 'none', padding: '4px 8px', fontSize: '10px', borderRadius: '3px', cursor: 'pointer' }}>
                            🗑️
                          </button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'pending' })}
                          style={{
                            background: task.status === 'pending' ? '#e74c3c' : '#404040',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 12px',
                            fontSize: '11px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          Pendente
                        </button>
                        <button
                          onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'in_progress' })}
                          style={{
                            background: task.status === 'in_progress' ? '#f39c12' : '#404040',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 12px',
                            fontSize: '11px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          Andamento
                        </button>
                        <button
                          onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'completed' })}
                          style={{
                            background: task.status === 'completed' ? '#27ae60' : '#404040',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 12px',
                            fontSize: '11px',
                            borderRadius: '4px',
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
                <div style={{ background: '#333333', padding: '16px', borderRadius: '6px' }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#ffffff',
                    marginBottom: '16px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid #505050'
                  }}>
                    Departamento Fiscal
                  </div>
                  {registration.tasks?.filter(task => task.department === 'fiscal' || task.department === 'Fiscal' || task.department === 'DEPTO FISCAL').map(task => (
                    <div key={task.id} style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '13px', color: '#e0e0e0', marginBottom: '8px', lineHeight: '1.4' }}>
                        {task.title}
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'pending' })}
                          style={{
                            background: task.status === 'pending' ? '#e74c3c' : '#404040',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 12px',
                            fontSize: '11px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          Pendente
                        </button>
                        <button
                          onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'in_progress' })}
                          style={{
                            background: task.status === 'in_progress' ? '#f39c12' : '#404040',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 12px',
                            fontSize: '11px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          Andamento
                        </button>
                        <button
                          onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'completed' })}
                          style={{
                            background: task.status === 'completed' ? '#27ae60' : '#404040',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 12px',
                            fontSize: '11px',
                            borderRadius: '4px',
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
                <div style={{ background: '#333333', padding: '16px', borderRadius: '6px' }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#ffffff',
                    marginBottom: '16px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid #505050'
                  }}>
                    Departamento Pessoal
                  </div>
                  {registration.tasks?.filter(task => task.department === 'pessoal' || task.department === 'Pessoal' || task.department === 'DEPTO PESSOAL').map(task => (
                    <div key={task.id} style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '13px', color: '#e0e0e0', marginBottom: '8px', lineHeight: '1.4' }}>
                        {task.title}
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'pending' })}
                          style={{
                            background: task.status === 'pending' ? '#e74c3c' : '#404040',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 12px',
                            fontSize: '11px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          Pendente
                        </button>
                        <button
                          onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'in_progress' })}
                          style={{
                            background: task.status === 'in_progress' ? '#f39c12' : '#404040',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 12px',
                            fontSize: '11px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          Andamento
                        </button>
                        <button
                          onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'completed' })}
                          style={{
                            background: task.status === 'completed' ? '#27ae60' : '#404040',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 12px',
                            fontSize: '11px',
                            borderRadius: '4px',
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
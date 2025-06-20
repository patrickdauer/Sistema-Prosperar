import { useState, useEffect } from 'react';

interface Task {
  id: number;
  title: string;
  department: string;
  status: string;
}

interface BusinessRegistration {
  id: number;
  razaoSocial: string;
  nomeFantasia: string;
  emailEmpresa: string;
  tasks: Task[];
}

export default function SistemaFinal() {
  const [registrations, setRegistrations] = useState<BusinessRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCompany, setEditingCompany] = useState<BusinessRegistration | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/equipe';
      return;
    }

    fetch('/api/internal/registrations', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => {
      if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/equipe';
        return;
      }
      return res.json();
    })
    .then(data => {
      if (data) {
        setRegistrations(Array.isArray(data) ? data : []);
      }
      setLoading(false);
    })
    .catch(error => {
      console.error('Error loading registrations:', error);
      setLoading(false);
    });
  }, []);

  const updateTaskStatus = (taskId: number, currentStatus: string, newStatus: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const finalStatus = currentStatus === newStatus ? 'pending' : newStatus;
    
    fetch(`/api/internal/task/${taskId}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: finalStatus }),
    })
    .then(res => res.json())
    .then(() => {
      // Update local state
      setRegistrations(prev => 
        prev.map(reg => ({
          ...reg,
          tasks: reg.tasks.map(task => 
            task.id === taskId 
              ? { ...task, status: finalStatus }
              : task
          )
        }))
      );
    })
    .catch(error => {
      console.error('Error updating task status:', error);
    });
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        Carregando...
      </div>
    );
  }

  const pendingTasks = registrations.reduce((acc, reg) => 
    acc + reg.tasks.filter(t => t.status === 'pending').length, 0);
  const inProgressTasks = registrations.reduce((acc, reg) => 
    acc + reg.tasks.filter(t => t.status === 'in_progress').length, 0);
  const completedTasks = registrations.reduce((acc, reg) => 
    acc + reg.tasks.filter(t => t.status === 'completed').length, 0);

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
          <h1 style={{
            fontSize: '24px',
            fontWeight: '600',
            margin: '0',
            color: '#ffffff'
          }}>
            Sistema Dark
          </h1>
          <button
            onClick={() => window.location.href = '/equipe'}
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
              {registrations.length}
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
              {pendingTasks}
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
              {inProgressTasks}
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
              {completedTasks}
            </div>
            <div style={{ fontSize: '14px', color: '#666666' }}>Concluídas</div>
          </div>
        </div>

        {/* Companies */}
        <div style={{ display: 'grid', gap: '30px' }}>
          {registrations.map((registration) => (
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
                borderBottom: '1px solid #222222',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '6px' }}>
                    {registration.razaoSocial}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666666' }}>
                    {registration.nomeFantasia && `${registration.nomeFantasia} • `}
                    ID: {registration.id} • {registration.emailEmpresa}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditingCompany(registration);
                    setShowEditModal(true);
                  }}
                  style={{
                    background: '#333333',
                    border: '1px solid #555555',
                    color: '#ffffff',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  Editar
                </button>
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
                  {registration.tasks.filter(task => task.department === 'societario').map(task => (
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
                          onClick={() => updateTaskStatus(task.id, task.status, 'pending')}
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
                          onClick={() => updateTaskStatus(task.id, task.status, 'in_progress')}
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
                          onClick={() => updateTaskStatus(task.id, task.status, 'completed')}
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
                  {registration.tasks.filter(task => task.department === 'fiscal').map(task => (
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
                          onClick={() => updateTaskStatus(task.id, task.status, 'pending')}
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
                          onClick={() => updateTaskStatus(task.id, task.status, 'in_progress')}
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
                          onClick={() => updateTaskStatus(task.id, task.status, 'completed')}
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
                  {registration.tasks.filter(task => task.department === 'pessoal').map(task => (
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
                          onClick={() => updateTaskStatus(task.id, task.status, 'pending')}
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
                          onClick={() => updateTaskStatus(task.id, task.status, 'in_progress')}
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
                          onClick={() => updateTaskStatus(task.id, task.status, 'completed')}
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

      {/* Edit Modal */}
      {showEditModal && editingCompany && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#111111',
            border: '1px solid #333333',
            borderRadius: '8px',
            padding: '30px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{
                color: '#ffffff',
                fontSize: '20px',
                fontWeight: '600',
                margin: 0
              }}>
                Editar Empresa
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#666666',
                  fontSize: '20px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const updatedData = {
                razaoSocial: formData.get('razaoSocial') as string,
                nomeFantasia: formData.get('nomeFantasia') as string,
                emailEmpresa: formData.get('emailEmpresa') as string,
              };
              
              const token = localStorage.getItem('token');
              if (!token) return;

              fetch(`/api/internal/registration/${editingCompany.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedData)
              })
              .then(res => res.json())
              .then(() => {
                // Update local state
                setRegistrations(prev =>
                  prev.map(reg =>
                    reg.id === editingCompany.id
                      ? { ...reg, ...updatedData }
                      : reg
                  )
                );
                setShowEditModal(false);
                setEditingCompany(null);
              })
              .catch(error => {
                console.error('Error updating company:', error);
              });
            }}>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  color: '#cccccc',
                  fontSize: '14px',
                  marginBottom: '8px'
                }}>
                  Razão Social
                </label>
                <input
                  type="text"
                  name="razaoSocial"
                  defaultValue={editingCompany.razaoSocial}
                  style={{
                    width: '100%',
                    background: '#222222',
                    border: '1px solid #444444',
                    color: '#ffffff',
                    padding: '12px',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  color: '#cccccc',
                  fontSize: '14px',
                  marginBottom: '8px'
                }}>
                  Nome Fantasia
                </label>
                <input
                  type="text"
                  name="nomeFantasia"
                  defaultValue={editingCompany.nomeFantasia}
                  style={{
                    width: '100%',
                    background: '#222222',
                    border: '1px solid #444444',
                    color: '#ffffff',
                    padding: '12px',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '30px' }}>
                <label style={{
                  display: 'block',
                  color: '#cccccc',
                  fontSize: '14px',
                  marginBottom: '8px'
                }}>
                  Email da Empresa
                </label>
                <input
                  type="email"
                  name="emailEmpresa"
                  defaultValue={editingCompany.emailEmpresa}
                  style={{
                    width: '100%',
                    background: '#222222',
                    border: '1px solid #444444',
                    color: '#ffffff',
                    padding: '12px',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{
                    background: '#333333',
                    border: '1px solid #555555',
                    color: '#ffffff',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    background: '#198754',
                    border: 'none',
                    color: '#ffffff',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
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

  useEffect(() => {
    // Simulate data with tasks for demonstration
    const mockData: BusinessRegistration[] = [
      {
        id: 6,
        razaoSocial: "Sucesso Empresa LTDA",
        nomeFantasia: "Sucesso Empresa",
        emailEmpresa: "sucesso@empresa.com",
        tasks: [
          {
            id: 1,
            title: "Abertura de empresa",
            department: "societario",
            status: "pending"
          },
          {
            id: 2,
            title: "Registro na Junta Comercial",
            department: "societario", 
            status: "in_progress"
          },
          {
            id: 3,
            title: "CNPJ na Receita Federal",
            department: "fiscal",
            status: "completed"
          },
          {
            id: 4,
            title: "Inscrição Estadual",
            department: "fiscal",
            status: "pending"
          },
          {
            id: 5,
            title: "Registro de funcionários",
            department: "pessoal",
            status: "pending"
          }
        ]
      }
    ];

    setTimeout(() => {
      setRegistrations(mockData);
      setLoading(false);
    }, 500);
  }, []);

  const updateTaskStatus = (taskId: number, currentStatus: string, newStatus: string) => {
    setRegistrations(prev => 
      prev.map(reg => ({
        ...reg,
        tasks: reg.tasks.map(task => 
          task.id === taskId 
            ? { ...task, status: task.status === newStatus ? 'idle' : newStatus }
            : task
        )
      }))
    );
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
    </div>
  );
}
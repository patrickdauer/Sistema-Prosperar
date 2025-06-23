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
  endereco: string;
  inscricaoImobiliaria: string;
  metragem: number;
  telefoneEmpresa: string;
  emailEmpresa: string;
  capitalSocial: string;
  atividadePrincipal: string;
  atividadesSecundarias: string;
  socios: any[];
  tasks: Task[];
}

export default function SistemaFinal() {
  const [registrations, setRegistrations] = useState<BusinessRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCompany, setEditingCompany] = useState<BusinessRegistration | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskDepartment, setNewTaskDepartment] = useState('');
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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

  const fetchUsers = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('/api/internal/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data) {
        setUsers(Array.isArray(data) ? data : []);
      }
    })
    .catch(error => {
      console.error('Error loading users:', error);
    });
  };

  const createUser = (userData: any) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('/api/internal/users', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(userData),
    })
    .then(res => res.json())
    .then(() => {
      fetchUsers();
      setShowCreateUserModal(false);
    })
    .catch(error => {
      console.error('Error creating user:', error);
    });
  };

  const updateUser = (userId: number, userData: any) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`/api/internal/users/${userId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(userData),
    })
    .then(res => res.json())
    .then(() => {
      fetchUsers();
      setShowEditUserModal(false);
      setEditingUser(null);
    })
    .catch(error => {
      console.error('Error updating user:', error);
    });
  };

  const deleteUser = (userId: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (confirm('Tem certeza que deseja deletar este usuário?')) {
      fetch(`/api/internal/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(() => {
        fetchUsers();
      })
      .catch(error => {
        console.error('Error deleting user:', error);
      });
    }
  };

  const exportToExcel = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Token de autenticação não encontrado. Faça login novamente.');
      return;
    }

    try {
      const response = await fetch('/api/internal/export/excel', {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Arquivo Excel vazio recebido');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `empresas_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Mostrar mensagem de sucesso
      const successMsg = document.createElement('div');
      successMsg.textContent = 'Excel exportado com sucesso!';
      successMsg.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 15px; border-radius: 5px; z-index: 1000; font-size: 14px;';
      document.body.appendChild(successMsg);
      setTimeout(() => document.body.removeChild(successMsg), 3000);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert(`Erro ao exportar Excel: ${error.message}`);
    }
  };

  const exportToPDF = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('/api/internal/export/pdf', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `relatorio-empresas-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    })
    .catch(error => {
      console.error('Error exporting to PDF:', error);
    });
  };

  // Filter registrations based on search term and status
  const filteredRegistrations = registrations.filter(registration => {
    const matchesSearch = searchTerm === '' || 
      registration.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.emailEmpresa.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'all') {
      return matchesSearch;
    }

    const hasStatus = registration.tasks?.some(task => task.status === statusFilter);
    return matchesSearch && hasStatus;
  });

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

  const deleteTask = (taskId: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (!confirm('Tem certeza que deseja deletar esta tarefa?')) return;

    fetch(`/api/internal/task/${taskId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(() => {
      // Remove task from local state
      setRegistrations(prev =>
        prev.map(reg => ({
          ...reg,
          tasks: reg.tasks.filter(task => task.id !== taskId)
        }))
      );
    })
    .catch(error => {
      console.error('Error deleting task:', error);
    });
  };

  const createNewTask = (registrationId: number, department: string, title: string, description: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`/api/internal/registration/${registrationId}/task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, description, department })
    })
    .then(res => res.json())
    .then(newTask => {
      // Add new task to local state
      setRegistrations(prev =>
        prev.map(reg =>
          reg.id === registrationId
            ? { ...reg, tasks: [...reg.tasks, newTask] }
            : reg
        )
      );
      setShowNewTaskModal(false);
    })
    .catch(error => {
      console.error('Error creating task:', error);
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
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                setShowUserManagement(true);
                fetchUsers();
              }}
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
              Usuários
            </button>
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

        {/* Filters and Export Section */}
        <div style={{
          background: '#111111',
          border: '1px solid #222222',
          borderRadius: '6px',
          padding: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '15px'
          }}>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '5px' }}>
                <input
                  type="text"
                  placeholder="Pesquisar empresas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && setSearchTerm(searchTerm)}
                  style={{
                    background: '#222222',
                    border: '1px solid #444444',
                    color: '#ffffff',
                    padding: '10px 15px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    width: '300px'
                  }}
                />
                <button
                  onClick={() => setSearchTerm(searchTerm)}
                  style={{
                    background: '#0d6efd',
                    border: 'none',
                    color: '#ffffff',
                    padding: '10px 15px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Buscar
                </button>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    style={{
                      background: '#6c757d',
                      border: 'none',
                      color: '#ffffff',
                      padding: '10px 15px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Limpar
                  </button>
                )}
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    background: '#222222',
                    border: '1px solid #444444',
                    color: '#ffffff',
                    padding: '10px 15px',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="all">Todas as empresas</option>
                  <option value="pending">Com tarefas pendentes</option>
                  <option value="in_progress">Com tarefas em andamento</option>
                  <option value="completed">Com tarefas concluídas</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={exportToExcel}
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
                Exportar Excel
              </button>
              <button
                onClick={exportToPDF}
                style={{
                  background: '#dc3545',
                  border: 'none',
                  color: '#ffffff',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Exportar PDF
              </button>
            </div>
          </div>
          
          {filteredRegistrations.length !== registrations.length && (
            <div style={{
              marginTop: '15px',
              color: '#cccccc',
              fontSize: '13px'
            }}>
              Mostrando {filteredRegistrations.length} de {registrations.length} empresas
            </div>
          )}
        </div>

        {/* Companies */}
        <div style={{ display: 'grid', gap: '30px' }}>
          {filteredRegistrations.map((registration) => (
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
                    borderBottom: '1px solid #222222',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>Societário</span>
                    <button
                      onClick={() => {
                        setEditingCompany(registration);
                        setNewTaskDepartment('societario');
                        setShowNewTaskModal(true);
                      }}
                      style={{
                        background: '#333333',
                        border: '1px solid #555555',
                        color: '#ffffff',
                        padding: '4px 8px',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '10px'
                      }}
                    >
                      + Nova
                    </button>
                  </div>
                  {registration.tasks.filter(task => task.department === 'societario').map(task => (
                    <div key={task.id} style={{ marginBottom: '16px' }}>
                      <div style={{
                        fontSize: '13px',
                        color: '#cccccc',
                        marginBottom: '10px',
                        lineHeight: '1.4',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>{task.title}</span>
                        <button
                          onClick={() => deleteTask(task.id)}
                          style={{
                            background: '#dc3545',
                            border: 'none',
                            color: '#ffffff',
                            padding: '2px 6px',
                            borderRadius: '2px',
                            cursor: 'pointer',
                            fontSize: '10px'
                          }}
                        >
                          ×
                        </button>
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
                    borderBottom: '1px solid #222222',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>Fiscal</span>
                    <button
                      onClick={() => {
                        setEditingCompany(registration);
                        setNewTaskDepartment('fiscal');
                        setShowNewTaskModal(true);
                      }}
                      style={{
                        background: '#333333',
                        border: '1px solid #555555',
                        color: '#ffffff',
                        padding: '4px 8px',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '10px'
                      }}
                    >
                      + Nova
                    </button>
                  </div>
                  {registration.tasks.filter(task => task.department === 'fiscal').map(task => (
                    <div key={task.id} style={{ marginBottom: '16px' }}>
                      <div style={{
                        fontSize: '13px',
                        color: '#cccccc',
                        marginBottom: '10px',
                        lineHeight: '1.4',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>{task.title}</span>
                        <button
                          onClick={() => deleteTask(task.id)}
                          style={{
                            background: '#dc3545',
                            border: 'none',
                            color: '#ffffff',
                            padding: '2px 6px',
                            borderRadius: '2px',
                            cursor: 'pointer',
                            fontSize: '10px'
                          }}
                        >
                          ×
                        </button>
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
                    borderBottom: '1px solid #222222',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>Pessoal</span>
                    <button
                      onClick={() => {
                        setEditingCompany(registration);
                        setNewTaskDepartment('pessoal');
                        setShowNewTaskModal(true);
                      }}
                      style={{
                        background: '#333333',
                        border: '1px solid #555555',
                        color: '#ffffff',
                        padding: '4px 8px',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '10px'
                      }}
                    >
                      + Nova
                    </button>
                  </div>
                  {registration.tasks.filter(task => task.department === 'pessoal').map(task => (
                    <div key={task.id} style={{ marginBottom: '16px' }}>
                      <div style={{
                        fontSize: '13px',
                        color: '#cccccc',
                        marginBottom: '10px',
                        lineHeight: '1.4',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>{task.title}</span>
                        <button
                          onClick={() => deleteTask(task.id)}
                          style={{
                            background: '#dc3545',
                            border: 'none',
                            color: '#ffffff',
                            padding: '2px 6px',
                            borderRadius: '2px',
                            cursor: 'pointer',
                            fontSize: '10px'
                          }}
                        >
                          ×
                        </button>
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
              // Collect partners data
              const socios = editingCompany.socios.map((socio: any, index: number) => ({
                nomeCompleto: formData.get(`socio_${index}_nomeCompleto`) as string || socio.nomeCompleto,
                nacionalidade: formData.get(`socio_${index}_nacionalidade`) as string || socio.nacionalidade,
                cpf: formData.get(`socio_${index}_cpf`) as string || socio.cpf,
                rg: formData.get(`socio_${index}_rg`) as string || socio.rg,
                dataNascimento: formData.get(`socio_${index}_dataNascimento`) as string || socio.dataNascimento,
                filiacao: formData.get(`socio_${index}_filiacao`) as string || socio.filiacao,
                profissao: formData.get(`socio_${index}_profissao`) as string || socio.profissao,
                estadoCivil: formData.get(`socio_${index}_estadoCivil`) as string || socio.estadoCivil,
                enderecoPessoal: formData.get(`socio_${index}_enderecoPessoal`) as string || socio.enderecoPessoal,
                telefonePessoal: formData.get(`socio_${index}_telefonePessoal`) as string || socio.telefonePessoal,
                emailPessoal: formData.get(`socio_${index}_emailPessoal`) as string || socio.emailPessoal,
                percentualSociedade: formData.get(`socio_${index}_percentualSociedade`) as string || socio.percentualSociedade,
                // Keep existing file URLs
                documentoComFotoUrl: socio.documentoComFotoUrl,
                certidaoCasamentoUrl: socio.certidaoCasamentoUrl,
                documentosAdicionaisUrls: socio.documentosAdicionaisUrls
              }));

              const updatedData = {
                razaoSocial: formData.get('razaoSocial') as string,
                nomeFantasia: formData.get('nomeFantasia') as string,
                endereco: formData.get('endereco') as string,
                inscricaoImobiliaria: formData.get('inscricaoImobiliaria') as string,
                metragem: parseInt(formData.get('metragem') as string) || 0,
                telefoneEmpresa: formData.get('telefoneEmpresa') as string,
                emailEmpresa: formData.get('emailEmpresa') as string,
                capitalSocial: formData.get('capitalSocial') as string,
                atividadePrincipal: formData.get('atividadePrincipal') as string,
                atividadesSecundarias: formData.get('atividadesSecundarias') as string,
                socios: socios
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

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  color: '#cccccc',
                  fontSize: '14px',
                  marginBottom: '8px'
                }}>
                  Endereço
                </label>
                <input
                  type="text"
                  name="endereco"
                  defaultValue={editingCompany.endereco}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    color: '#cccccc',
                    fontSize: '14px',
                    marginBottom: '8px'
                  }}>
                    Inscrição Imobiliária
                  </label>
                  <input
                    type="text"
                    name="inscricaoImobiliaria"
                    defaultValue={editingCompany.inscricaoImobiliaria}
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
                <div>
                  <label style={{
                    display: 'block',
                    color: '#cccccc',
                    fontSize: '14px',
                    marginBottom: '8px'
                  }}>
                    Metragem (m²)
                  </label>
                  <input
                    type="number"
                    name="metragem"
                    defaultValue={editingCompany.metragem}
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
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    color: '#cccccc',
                    fontSize: '14px',
                    marginBottom: '8px'
                  }}>
                    Telefone da Empresa
                  </label>
                  <input
                    type="text"
                    name="telefoneEmpresa"
                    defaultValue={editingCompany.telefoneEmpresa}
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
                <div>
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
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  color: '#cccccc',
                  fontSize: '14px',
                  marginBottom: '8px'
                }}>
                  Capital Social
                </label>
                <input
                  type="text"
                  name="capitalSocial"
                  defaultValue={editingCompany.capitalSocial}
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

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  color: '#cccccc',
                  fontSize: '14px',
                  marginBottom: '8px'
                }}>
                  Atividade Principal
                </label>
                <input
                  type="text"
                  name="atividadePrincipal"
                  defaultValue={editingCompany.atividadePrincipal}
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
                  Atividades Secundárias
                </label>
                <textarea
                  name="atividadesSecundarias"
                  defaultValue={editingCompany.atividadesSecundarias}
                  rows={3}
                  style={{
                    width: '100%',
                    background: '#222222',
                    border: '1px solid #444444',
                    color: '#ffffff',
                    padding: '12px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Partners Section */}
              <div style={{
                borderTop: '1px solid #333333',
                paddingTop: '30px',
                marginTop: '30px',
                marginBottom: '30px'
              }}>
                <h3 style={{
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '20px',
                  margin: 0
                }}>
                  Dados dos Sócios
                </h3>
                
                {editingCompany.socios.map((socio: any, index: number) => (
                  <div key={index} style={{
                    background: '#1a1a1a',
                    border: '1px solid #333333',
                    borderRadius: '6px',
                    padding: '20px',
                    marginBottom: '20px'
                  }}>
                    <h4 style={{
                      color: '#cccccc',
                      fontSize: '14px',
                      fontWeight: '600',
                      marginBottom: '15px',
                      margin: '0 0 15px 0'
                    }}>
                      Sócio {index + 1}
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                      <div>
                        <label style={{
                          display: 'block',
                          color: '#cccccc',
                          fontSize: '13px',
                          marginBottom: '6px'
                        }}>
                          Nome Completo
                        </label>
                        <input
                          type="text"
                          name={`socio_${index}_nomeCompleto`}
                          defaultValue={socio.nomeCompleto}
                          style={{
                            width: '100%',
                            background: '#222222',
                            border: '1px solid #444444',
                            color: '#ffffff',
                            padding: '10px',
                            borderRadius: '4px',
                            fontSize: '13px'
                          }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          color: '#cccccc',
                          fontSize: '13px',
                          marginBottom: '6px'
                        }}>
                          Nacionalidade
                        </label>
                        <input
                          type="text"
                          name={`socio_${index}_nacionalidade`}
                          defaultValue={socio.nacionalidade}
                          style={{
                            width: '100%',
                            background: '#222222',
                            border: '1px solid #444444',
                            color: '#ffffff',
                            padding: '10px',
                            borderRadius: '4px',
                            fontSize: '13px'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                      <div>
                        <label style={{
                          display: 'block',
                          color: '#cccccc',
                          fontSize: '13px',
                          marginBottom: '6px'
                        }}>
                          CPF
                        </label>
                        <input
                          type="text"
                          name={`socio_${index}_cpf`}
                          defaultValue={socio.cpf}
                          style={{
                            width: '100%',
                            background: '#222222',
                            border: '1px solid #444444',
                            color: '#ffffff',
                            padding: '10px',
                            borderRadius: '4px',
                            fontSize: '13px'
                          }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          color: '#cccccc',
                          fontSize: '13px',
                          marginBottom: '6px'
                        }}>
                          RG
                        </label>
                        <input
                          type="text"
                          name={`socio_${index}_rg`}
                          defaultValue={socio.rg}
                          style={{
                            width: '100%',
                            background: '#222222',
                            border: '1px solid #444444',
                            color: '#ffffff',
                            padding: '10px',
                            borderRadius: '4px',
                            fontSize: '13px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          color: '#cccccc',
                          fontSize: '13px',
                          marginBottom: '6px'
                        }}>
                          Data de Nascimento
                        </label>
                        <input
                          type="date"
                          name={`socio_${index}_dataNascimento`}
                          defaultValue={socio.dataNascimento}
                          style={{
                            width: '100%',
                            background: '#222222',
                            border: '1px solid #444444',
                            color: '#ffffff',
                            padding: '10px',
                            borderRadius: '4px',
                            fontSize: '13px'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                      <div>
                        <label style={{
                          display: 'block',
                          color: '#cccccc',
                          fontSize: '13px',
                          marginBottom: '6px'
                        }}>
                          Filiação
                        </label>
                        <input
                          type="text"
                          name={`socio_${index}_filiacao`}
                          defaultValue={socio.filiacao}
                          style={{
                            width: '100%',
                            background: '#222222',
                            border: '1px solid #444444',
                            color: '#ffffff',
                            padding: '10px',
                            borderRadius: '4px',
                            fontSize: '13px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          color: '#cccccc',
                          fontSize: '13px',
                          marginBottom: '6px'
                        }}>
                          Profissão
                        </label>
                        <input
                          type="text"
                          name={`socio_${index}_profissao`}
                          defaultValue={socio.profissao}
                          style={{
                            width: '100%',
                            background: '#222222',
                            border: '1px solid #444444',
                            color: '#ffffff',
                            padding: '10px',
                            borderRadius: '4px',
                            fontSize: '13px'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                      <div>
                        <label style={{
                          display: 'block',
                          color: '#cccccc',
                          fontSize: '13px',
                          marginBottom: '6px'
                        }}>
                          Estado Civil
                        </label>
                        <select
                          name={`socio_${index}_estadoCivil`}
                          defaultValue={socio.estadoCivil}
                          style={{
                            width: '100%',
                            background: '#222222',
                            border: '1px solid #444444',
                            color: '#ffffff',
                            padding: '10px',
                            borderRadius: '4px',
                            fontSize: '13px'
                          }}
                        >
                          <option value="solteiro">Solteiro(a)</option>
                          <option value="casado">Casado(a)</option>
                          <option value="divorciado">Divorciado(a)</option>
                          <option value="viuvo">Viúvo(a)</option>
                          <option value="uniao_estavel">União Estável</option>
                        </select>
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          color: '#cccccc',
                          fontSize: '13px',
                          marginBottom: '6px'
                        }}>
                          Percentual Sociedade (%)
                        </label>
                        <input
                          type="number"
                          name={`socio_${index}_percentualSociedade`}
                          defaultValue={socio.percentualSociedade}
                          style={{
                            width: '100%',
                            background: '#222222',
                            border: '1px solid #444444',
                            color: '#ffffff',
                            padding: '10px',
                            borderRadius: '4px',
                            fontSize: '13px'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <label style={{
                        display: 'block',
                        color: '#cccccc',
                        fontSize: '13px',
                        marginBottom: '6px'
                      }}>
                        Endereço Pessoal
                      </label>
                      <input
                        type="text"
                        name={`socio_${index}_enderecoPessoal`}
                        defaultValue={socio.enderecoPessoal}
                        style={{
                          width: '100%',
                          background: '#222222',
                          border: '1px solid #444444',
                          color: '#ffffff',
                          padding: '10px',
                          borderRadius: '4px',
                          fontSize: '13px'
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      <div>
                        <label style={{
                          display: 'block',
                          color: '#cccccc',
                          fontSize: '13px',
                          marginBottom: '6px'
                        }}>
                          Telefone Pessoal
                        </label>
                        <input
                          type="text"
                          name={`socio_${index}_telefonePessoal`}
                          defaultValue={socio.telefonePessoal}
                          style={{
                            width: '100%',
                            background: '#222222',
                            border: '1px solid #444444',
                            color: '#ffffff',
                            padding: '10px',
                            borderRadius: '4px',
                            fontSize: '13px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          color: '#cccccc',
                          fontSize: '13px',
                          marginBottom: '6px'
                        }}>
                          Email Pessoal
                        </label>
                        <input
                          type="email"
                          name={`socio_${index}_emailPessoal`}
                          defaultValue={socio.emailPessoal}
                          style={{
                            width: '100%',
                            background: '#222222',
                            border: '1px solid #444444',
                            color: '#ffffff',
                            padding: '10px',
                            borderRadius: '4px',
                            fontSize: '13px'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
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

      {/* New Task Modal */}
      {showNewTaskModal && editingCompany && (
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
            maxWidth: '500px',
            width: '90%'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{
                color: '#ffffff',
                fontSize: '18px',
                fontWeight: '600',
                margin: 0
              }}>
                Nova Tarefa - {newTaskDepartment === 'societario' ? 'Societário' : 
                               newTaskDepartment === 'fiscal' ? 'Fiscal' : 'Pessoal'}
              </h2>
              <button
                onClick={() => setShowNewTaskModal(false)}
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
              const title = formData.get('title') as string;
              const description = formData.get('description') as string;
              
              if (title.trim()) {
                createNewTask(editingCompany.id, newTaskDepartment, title, description || '');
              }
            }}>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  color: '#cccccc',
                  fontSize: '14px',
                  marginBottom: '8px'
                }}>
                  Título da Tarefa
                </label>
                <input
                  type="text"
                  name="title"
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
                  placeholder="Ex: Análise de documentos"
                />
              </div>

              <div style={{ marginBottom: '30px' }}>
                <label style={{
                  display: 'block',
                  color: '#cccccc',
                  fontSize: '14px',
                  marginBottom: '8px'
                }}>
                  Descrição (opcional)
                </label>
                <textarea
                  name="description"
                  rows={3}
                  style={{
                    width: '100%',
                    background: '#222222',
                    border: '1px solid #444444',
                    color: '#ffffff',
                    padding: '12px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                  placeholder="Descrição detalhada da tarefa..."
                />
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
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
                  Criar Tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Management Modal */}
      {showUserManagement && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
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
            maxWidth: '800px',
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
              <h3 style={{
                color: '#ffffff',
                fontSize: '18px',
                fontWeight: '600',
                margin: 0
              }}>
                Gerenciar Usuários
              </h3>
              <button
                onClick={() => setShowUserManagement(false)}
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

            <button
              onClick={() => setShowCreateUserModal(true)}
              style={{
                background: '#198754',
                border: 'none',
                color: '#ffffff',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '20px'
              }}
            >
              + Novo Usuário
            </button>

            <div style={{
              background: '#0a0a0a',
              border: '1px solid #222222',
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              <div style={{
                background: '#222222',
                padding: '12px 20px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr 120px',
                gap: '15px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#cccccc',
                textTransform: 'uppercase'
              }}>
                <div>Nome</div>
                <div>Username</div>
                <div>Email</div>
                <div>Cargo/Depto</div>
                <div>Ações</div>
              </div>

              {users.map((user: any) => (
                <div key={user.id} style={{
                  padding: '15px 20px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 1fr 120px',
                  gap: '15px',
                  borderBottom: '1px solid #222222',
                  alignItems: 'center'
                }}>
                  <div style={{ color: '#ffffff', fontSize: '14px' }}>
                    {user.name}
                  </div>
                  <div style={{ color: '#cccccc', fontSize: '13px' }}>
                    {user.username}
                  </div>
                  <div style={{ color: '#cccccc', fontSize: '13px' }}>
                    {user.email || '-'}
                  </div>
                  <div style={{ color: '#cccccc', fontSize: '13px' }}>
                    {user.role} {user.department && `/ ${user.department}`}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setEditingUser(user);
                        setShowEditUserModal(true);
                      }}
                      style={{
                        background: '#333333',
                        border: '1px solid #555555',
                        color: '#ffffff',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Editar
                    </button>
                    {user.username !== 'admin' && (
                      <button
                        onClick={() => deleteUser(user.id)}
                        style={{
                          background: '#dc3545',
                          border: 'none',
                          color: '#ffffff',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{
            background: '#111111',
            border: '1px solid #333333',
            borderRadius: '8px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{
                color: '#ffffff',
                fontSize: '18px',
                fontWeight: '600',
                margin: 0
              }}>
                Criar Novo Usuário
              </h3>
              <button
                onClick={() => setShowCreateUserModal(false)}
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
              const userData = {
                username: formData.get('username') as string,
                password: formData.get('password') as string,
                name: formData.get('name') as string,
                email: formData.get('email') as string,
                role: formData.get('role') as string,
                department: formData.get('department') as string,
              };
              createUser(userData);
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    color: '#cccccc',
                    fontSize: '13px',
                    marginBottom: '6px'
                  }}>
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    style={{
                      width: '100%',
                      background: '#222222',
                      border: '1px solid #444444',
                      color: '#ffffff',
                      padding: '10px',
                      borderRadius: '4px',
                      fontSize: '13px'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    color: '#cccccc',
                    fontSize: '13px',
                    marginBottom: '6px'
                  }}>
                    Username *
                  </label>
                  <input
                    type="text"
                    name="username"
                    required
                    style={{
                      width: '100%',
                      background: '#222222',
                      border: '1px solid #444444',
                      color: '#ffffff',
                      padding: '10px',
                      borderRadius: '4px',
                      fontSize: '13px'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  color: '#cccccc',
                  fontSize: '13px',
                  marginBottom: '6px'
                }}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  style={{
                    width: '100%',
                    background: '#222222',
                    border: '1px solid #444444',
                    color: '#ffffff',
                    padding: '10px',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  color: '#cccccc',
                  fontSize: '13px',
                  marginBottom: '6px'
                }}>
                  Senha *
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  style={{
                    width: '100%',
                    background: '#222222',
                    border: '1px solid #444444',
                    color: '#ffffff',
                    padding: '10px',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    color: '#cccccc',
                    fontSize: '13px',
                    marginBottom: '6px'
                  }}>
                    Cargo
                  </label>
                  <select
                    name="role"
                    style={{
                      width: '100%',
                      background: '#222222',
                      border: '1px solid #444444',
                      color: '#ffffff',
                      padding: '10px',
                      borderRadius: '4px',
                      fontSize: '13px'
                    }}
                  >
                    <option value="user">Usuário</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    color: '#cccccc',
                    fontSize: '13px',
                    marginBottom: '6px'
                  }}>
                    Departamento
                  </label>
                  <select
                    name="department"
                    style={{
                      width: '100%',
                      background: '#222222',
                      border: '1px solid #444444',
                      color: '#ffffff',
                      padding: '10px',
                      borderRadius: '4px',
                      fontSize: '13px'
                    }}
                  >
                    <option value="">Selecionar</option>
                    <option value="Societário">Societário</option>
                    <option value="Fiscal">Fiscal</option>
                    <option value="Pessoal">Pessoal</option>
                  </select>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
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
                  Criar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && editingUser && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{
            background: '#111111',
            border: '1px solid #333333',
            borderRadius: '8px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{
                color: '#ffffff',
                fontSize: '18px',
                fontWeight: '600',
                margin: 0
              }}>
                Editar Usuário
              </h3>
              <button
                onClick={() => {
                  setShowEditUserModal(false);
                  setEditingUser(null);
                }}
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
              const userData: any = {
                username: formData.get('username') as string,
                name: formData.get('name') as string,
                email: formData.get('email') as string,
                role: formData.get('role') as string,
                department: formData.get('department') as string,
              };
              
              const password = formData.get('password') as string;
              if (password) {
                userData.password = password;
              }
              
              updateUser(editingUser.id, userData);
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    color: '#cccccc',
                    fontSize: '13px',
                    marginBottom: '6px'
                  }}>
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingUser.name}
                    required
                    style={{
                      width: '100%',
                      background: '#222222',
                      border: '1px solid #444444',
                      color: '#ffffff',
                      padding: '10px',
                      borderRadius: '4px',
                      fontSize: '13px'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    color: '#cccccc',
                    fontSize: '13px',
                    marginBottom: '6px'
                  }}>
                    Username *
                  </label>
                  <input
                    type="text"
                    name="username"
                    defaultValue={editingUser.username}
                    required
                    style={{
                      width: '100%',
                      background: '#222222',
                      border: '1px solid #444444',
                      color: '#ffffff',
                      padding: '10px',
                      borderRadius: '4px',
                      fontSize: '13px'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  color: '#cccccc',
                  fontSize: '13px',
                  marginBottom: '6px'
                }}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  defaultValue={editingUser.email}
                  style={{
                    width: '100%',
                    background: '#222222',
                    border: '1px solid #444444',
                    color: '#ffffff',
                    padding: '10px',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  color: '#cccccc',
                  fontSize: '13px',
                  marginBottom: '6px'
                }}>
                  Nova Senha (deixe em branco para manter a atual)
                </label>
                <input
                  type="password"
                  name="password"
                  style={{
                    width: '100%',
                    background: '#222222',
                    border: '1px solid #444444',
                    color: '#ffffff',
                    padding: '10px',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    color: '#cccccc',
                    fontSize: '13px',
                    marginBottom: '6px'
                  }}>
                    Cargo
                  </label>
                  <select
                    name="role"
                    defaultValue={editingUser.role}
                    style={{
                      width: '100%',
                      background: '#222222',
                      border: '1px solid #444444',
                      color: '#ffffff',
                      padding: '10px',
                      borderRadius: '4px',
                      fontSize: '13px'
                    }}
                  >
                    <option value="user">Usuário</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    color: '#cccccc',
                    fontSize: '13px',
                    marginBottom: '6px'
                  }}>
                    Departamento
                  </label>
                  <select
                    name="department"
                    defaultValue={editingUser.department}
                    style={{
                      width: '100%',
                      background: '#222222',
                      border: '1px solid #444444',
                      color: '#ffffff',
                      padding: '10px',
                      borderRadius: '4px',
                      fontSize: '13px'
                    }}
                  >
                    <option value="">Selecionar</option>
                    <option value="Societário">Societário</option>
                    <option value="Fiscal">Fiscal</option>
                    <option value="Pessoal">Pessoal</option>
                  </select>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditUserModal(false);
                    setEditingUser(null);
                  }}
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
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
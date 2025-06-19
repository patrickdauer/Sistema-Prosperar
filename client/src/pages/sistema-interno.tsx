import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  User, 
  LogOut, 
  Search,
  Filter,
  Plus,
  Settings,
  Calendar,
  Mail,
  Phone
} from "lucide-react";

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

// Componente de botão de status customizado
const TaskStatusButton = ({ 
  status, 
  currentStatus, 
  onClick, 
  children 
}: { 
  status: string;
  currentStatus: string; 
  onClick: () => void;
  children: React.ReactNode;
}) => {
  const isActive = currentStatus === status;
  
  const getColors = () => {
    if (!isActive) {
      return {
        backgroundColor: '#f8fafc',
        color: '#64748b',
        border: '1px solid #e2e8f0'
      };
    }
    
    switch (status) {
      case 'pending':
        return {
          backgroundColor: '#dc2626',
          color: '#ffffff',
          border: '1px solid #dc2626'
        };
      case 'in_progress':
        return {
          backgroundColor: '#ca8a04',
          color: '#ffffff', 
          border: '1px solid #ca8a04'
        };
      case 'completed':
        return {
          backgroundColor: '#16a34a',
          color: '#ffffff',
          border: '1px solid #16a34a'
        };
      default:
        return {
          backgroundColor: '#f8fafc',
          color: '#64748b',
          border: '1px solid #e2e8f0'
        };
    }
  };

  return (
    <button
      onClick={onClick}
      style={{
        ...getColors(),
        padding: '4px 8px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: '600',
        cursor: 'pointer',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        minWidth: '70px',
        textAlign: 'center',
        transition: 'all 0.2s',
        marginRight: '4px'
      }}
    >
      {children}
    </button>
  );
};

export default function SistemaInterno() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  // Fetch registrations
  const { data: registrations, isLoading } = useQuery({
    queryKey: ['registrations'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/internal/registrations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erro ao carregar dados');
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
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      toast({ title: "Status atualizado!" });
    }
  });

  const departments = [
    { id: 'societario', name: 'Societário', color: '#3b82f6', icon: Building2 },
    { id: 'fiscal', name: 'Fiscal', color: '#10b981', icon: CheckCircle2 },
    { id: 'pessoal', name: 'Pessoal', color: '#8b5cf6', icon: User }
  ];

  const filteredData = registrations?.filter((reg: BusinessRegistration) => {
    const matchesSearch = reg.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reg.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedDepartment === 'all') return matchesSearch;
    
    const hasDepartmentTasks = reg.tasks?.some(task => task.department === selectedDepartment);
    return matchesSearch && hasDepartmentTasks;
  }) || [];

  const getTaskStats = () => {
    const allTasks = registrations?.flatMap((reg: BusinessRegistration) => reg.tasks || []) || [];
    return {
      total: allTasks.length,
      pending: allTasks.filter((t: Task) => t.status === 'pending').length,
      inProgress: allTasks.filter((t: Task) => t.status === 'in_progress').length,
      completed: allTasks.filter((t: Task) => t.status === 'completed').length
    };
  };

  const stats = getTaskStats();

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid rgba(255,255,255,0.3)',
            borderTop: '3px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p>Carregando Sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      {/* Header moderno */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px 0'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
                Sistema de Gestão
              </h1>
              <p style={{ opacity: 0.9, margin: '4px 0 0 0' }}>
                Controle de Abertura de Empresas
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                background: 'rgba(255,255,255,0.1)', 
                padding: '8px 16px', 
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <User size={16} />
                <span>{user?.name}</span>
                <Badge style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  border: 'none'
                }}>
                  {user?.role}
                </Badge>
              </div>
              <button
                onClick={logout}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                <LogOut size={16} style={{ marginRight: '8px' }} />
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}>
        {/* Cards de estatísticas */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px',
          marginBottom: '24px'
        }}>
          <Card style={{ padding: '20px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#3b82f6', padding: '12px', borderRadius: '8px' }}>
                <Building2 size={24} color="white" />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{registrations?.length || 0}</div>
                <div style={{ color: '#64748b', fontSize: '14px' }}>Empresas</div>
              </div>
            </div>
          </Card>

          <Card style={{ padding: '20px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#dc2626', padding: '12px', borderRadius: '8px' }}>
                <AlertCircle size={24} color="white" />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.pending}</div>
                <div style={{ color: '#64748b', fontSize: '14px' }}>Pendentes</div>
              </div>
            </div>
          </Card>

          <Card style={{ padding: '20px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#ca8a04', padding: '12px', borderRadius: '8px' }}>
                <Clock size={24} color="white" />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.inProgress}</div>
                <div style={{ color: '#64748b', fontSize: '14px' }}>Em Andamento</div>
              </div>
            </div>
          </Card>

          <Card style={{ padding: '20px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#16a34a', padding: '12px', borderRadius: '8px' }}>
                <CheckCircle2 size={24} color="white" />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.completed}</div>
                <div style={{ color: '#64748b', fontSize: '14px' }}>Concluídas</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Filtros */}
        <Card style={{ padding: '20px', marginBottom: '24px', background: 'white', borderRadius: '12px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={20} color="#64748b" />
              <Input
                placeholder="Buscar empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ minWidth: '200px' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setSelectedDepartment('all')}
                style={{
                  background: selectedDepartment === 'all' ? '#3b82f6' : '#f1f5f9',
                  color: selectedDepartment === 'all' ? 'white' : '#64748b',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Todos
              </button>
              {departments.map(dept => (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDepartment(dept.id)}
                  style={{
                    background: selectedDepartment === dept.id ? dept.color : '#f1f5f9',
                    color: selectedDepartment === dept.id ? 'white' : '#64748b',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  {dept.name}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Lista de empresas */}
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredData.map((registration: BusinessRegistration) => (
            <Card key={registration.id} style={{ 
              background: 'white', 
              borderRadius: '12px', 
              overflow: 'hidden',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}>
              {/* Header da empresa */}
              <div style={{ 
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', 
                padding: '20px' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                      {registration.razaoSocial}
                    </h3>
                    <p style={{ color: '#64748b', margin: '0 0 8px 0' }}>
                      {registration.nomeFantasia}
                    </p>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '14px' }}>
                        <Mail size={14} />
                        {registration.emailEmpresa}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '14px' }}>
                        <Phone size={14} />
                        {registration.telefoneEmpresa}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '14px' }}>
                        <Calendar size={14} />
                        {new Date(registration.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  <Badge style={{ background: '#3b82f6', color: 'white' }}>
                    ID: {registration.id}
                  </Badge>
                </div>
              </div>

              {/* Departamentos */}
              <div style={{ padding: '20px' }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                  gap: '20px' 
                }}>
                  {departments.map(dept => {
                    const deptTasks = registration.tasks?.filter(task => task.department === dept.id) || [];
                    const IconComponent = dept.icon;
                    
                    return (
                      <div key={dept.id} style={{ 
                        border: `2px solid ${dept.color}`, 
                        borderRadius: '8px',
                        background: `${dept.color}10`
                      }}>
                        <div style={{ 
                          background: dept.color, 
                          color: 'white', 
                          padding: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <IconComponent size={18} />
                          <span style={{ fontWeight: 'bold' }}>Depto. {dept.name}</span>
                        </div>
                        
                        <div style={{ padding: '16px' }}>
                          {deptTasks.length === 0 ? (
                            <p style={{ color: '#64748b', textAlign: 'center', margin: 0 }}>
                              Nenhuma tarefa
                            </p>
                          ) : (
                            <div style={{ display: 'grid', gap: '12px' }}>
                              {deptTasks.map(task => (
                                <div key={task.id} style={{ 
                                  background: 'white', 
                                  padding: '12px', 
                                  borderRadius: '6px',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                }}>
                                  <div style={{ marginBottom: '8px' }}>
                                    <h5 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold' }}>
                                      {task.title}
                                    </h5>
                                    {task.description && (
                                      <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                                        {task.description}
                                      </p>
                                    )}
                                  </div>
                                  
                                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                    <TaskStatusButton
                                      status="pending"
                                      currentStatus={task.status}
                                      onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'pending' })}
                                    >
                                      Pendente
                                    </TaskStatusButton>
                                    <TaskStatusButton
                                      status="in_progress"
                                      currentStatus={task.status}
                                      onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'in_progress' })}
                                    >
                                      Andamento
                                    </TaskStatusButton>
                                    <TaskStatusButton
                                      status="completed"
                                      currentStatus={task.status}
                                      onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'completed' })}
                                    >
                                      Concluída
                                    </TaskStatusButton>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
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
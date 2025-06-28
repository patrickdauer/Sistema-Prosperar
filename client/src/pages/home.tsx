import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, FileText, Settings, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useLocation } from "wouter";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1a5f3f 0%, #0f3027 100%)' }}>
      <header style={{ 
        background: 'rgba(26, 95, 63, 0.95)', 
        borderBottom: '2px solid #ff8c42',
        backdropFilter: 'blur(10px)'
      }}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Sistema Interno</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-orange-200">
              {user?.name || user?.username || 'Usuário'}
            </span>
            <ThemeToggle />
            <Button 
              onClick={handleLogout}
              style={{ 
                backgroundColor: '#ff8c42', 
                color: 'white',
                border: 'none',
                transition: 'all 0.3s ease'
              }}
              className="hover:opacity-90"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold mb-4 text-white">
            Bem-vindo ao Sistema de Gestão
          </h2>
          <p className="text-xl text-orange-200">
            Acesse as funcionalidades do sistema através das opções abaixo.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card 
            className="cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl" 
            style={{ 
              background: 'rgba(255, 255, 255, 0.95)', 
              border: '2px solid #ff8c42',
              borderRadius: '12px'
            }}
            onClick={() => window.open('/dashboard', '_blank')}>
            <CardHeader style={{ borderBottom: '1px solid #ff8c42' }}>
              <CardTitle className="flex items-center gap-2" style={{ color: '#1a5f3f' }}>
                <Building2 className="h-5 w-5" style={{ color: '#ff8c42' }} />
                Dashboard Geral
              </CardTitle>
              <CardDescription style={{ color: '#2d7a4f' }}>
                Visão geral dos cadastros e estatísticas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm" style={{ color: '#1a5f3f' }}>
                Acompanhe todos os registros empresariais e seus status
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl" 
            style={{ 
              background: 'rgba(255, 255, 255, 0.95)', 
              border: '2px solid #ff8c42',
              borderRadius: '12px'
            }}
            onClick={() => window.open('/sistema-final', '_blank')}>
            <CardHeader style={{ borderBottom: '1px solid #ff8c42' }}>
              <CardTitle className="flex items-center gap-2" style={{ color: '#1a5f3f' }}>
                <FileText className="h-5 w-5" style={{ color: '#ff8c42' }} />
                Sistema de Tarefas
              </CardTitle>
              <CardDescription style={{ color: '#2d7a4f' }}>
                Gerenciamento completo de workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm" style={{ color: '#1a5f3f' }}>
                Controle de tarefas por departamento e status
              </p>
            </CardContent>
          </Card>

          {user?.role === 'admin' && (
            <Card 
              className="cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl" 
              style={{ 
                background: 'rgba(255, 255, 255, 0.95)', 
                border: '2px solid #ff8c42',
                borderRadius: '12px'
              }}
              onClick={() => window.open('/dashboard-interno', '_blank')}>
              <CardHeader style={{ borderBottom: '1px solid #ff8c42' }}>
                <CardTitle className="flex items-center gap-2" style={{ color: '#1a5f3f' }}>
                  <Users className="h-5 w-5" style={{ color: '#ff8c42' }} />
                  Gestão de Usuários
                </CardTitle>
                <CardDescription style={{ color: '#2d7a4f' }}>
                  Administração de equipe (Admin)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm" style={{ color: '#1a5f3f' }}>
                  Criar, editar e gerenciar usuários do sistema
                </p>
              </CardContent>
            </Card>
          )}

          <Card 
            className="cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl" 
            style={{ 
              background: 'rgba(255, 255, 255, 0.95)', 
              border: '2px solid #ff8c42',
              borderRadius: '12px'
            }}
            onClick={() => window.open('/business-registration', '_blank')}>
            <CardHeader style={{ borderBottom: '1px solid #ff8c42' }}>
              <CardTitle className="flex items-center gap-2" style={{ color: '#1a5f3f' }}>
                <Building2 className="h-5 w-5" style={{ color: '#ff8c42' }} />
                Cadastro Empresarial
              </CardTitle>
              <CardDescription style={{ color: '#2d7a4f' }}>
                Formulário público de registro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm" style={{ color: '#1a5f3f' }}>
                Acesso ao formulário de cadastro de empresas
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl" 
            style={{ 
              background: 'rgba(255, 255, 255, 0.95)', 
              border: '2px solid #ff8c42',
              borderRadius: '12px'
            }}
            onClick={() => window.open('/contratacao-funcionarios', '_blank')}>
            <CardHeader style={{ borderBottom: '1px solid #ff8c42' }}>
              <CardTitle className="flex items-center gap-2" style={{ color: '#1a5f3f' }}>
                <Users className="h-5 w-5" style={{ color: '#ff8c42' }} />
                Contratação
              </CardTitle>
              <CardDescription style={{ color: '#2d7a4f' }}>
                Formulário de contratação de funcionários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm" style={{ color: '#1a5f3f' }}>
                Cadastro de novos colaboradores
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl" 
            style={{ 
              background: 'rgba(255, 255, 255, 0.95)', 
              border: '2px solid #ff8c42',
              borderRadius: '12px'
            }}
            onClick={() => window.open('/simulador-custo', '_blank')}>
            <CardHeader style={{ borderBottom: '1px solid #ff8c42' }}>
              <CardTitle className="flex items-center gap-2" style={{ color: '#1a5f3f' }}>
                <Settings className="h-5 w-5" style={{ color: '#ff8c42' }} />
                Simulador de Custos
              </CardTitle>
              <CardDescription style={{ color: '#2d7a4f' }}>Ferramenta de cálculo de custos de Funcionário e comparativo CLT x PJ</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm" style={{ color: '#1a5f3f' }}>
                Simule custos de contratação e benefícios
              </p>
            </CardContent>
          </Card>
        </div>

        <div 
          className="mt-12 p-6 rounded-lg"
          style={{ 
            background: 'rgba(255, 255, 255, 0.9)', 
            border: '2px solid #ff8c42',
            borderRadius: '12px'
          }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#1a5f3f' }}>Status do Sistema</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div style={{ color: '#1a5f3f' }}>
              <span className="font-medium" style={{ color: '#ff8c42' }}>Usuário:</span> {user?.name || user?.username || 'N/A'}
            </div>
            <div style={{ color: '#1a5f3f' }}>
              <span className="font-medium" style={{ color: '#ff8c42' }}>Perfil:</span> {user?.role || 'employee'}
            </div>
            <div style={{ color: '#1a5f3f' }}>
              <span className="font-medium" style={{ color: '#ff8c42' }}>Departamento:</span> {user?.department || 'Geral'}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
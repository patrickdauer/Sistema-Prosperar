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
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      <header style={{ 
        background: '#1a1a1a', 
        borderBottom: '1px solid #333'
      }}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold" style={{ color: '#22c55e' }}>Sistema Interno</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white">
              {user?.name || user?.username || 'Usuário'}
            </span>
            <ThemeToggle />
            <Button 
              onClick={handleLogout}
              style={{ 
                backgroundColor: '#333', 
                color: 'white',
                border: '1px solid #555'
              }}
              className="hover:bg-gray-600"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold mb-4" style={{ color: '#22c55e' }}>
            Bem-vindo ao Sistema de Gestão
          </h2>
          <p className="text-xl text-white">
            Acesse as funcionalidades do sistema através das opções abaixo.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card 
            className="cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl" 
            style={{ 
              background: '#1a1a1a', 
              border: '1px solid #333',
              borderRadius: '8px'
            }}
            onClick={() => window.open('/dashboard?v=' + Date.now(), '_blank')}>
            <CardHeader style={{ borderBottom: '1px solid #333' }}>
              <CardTitle className="flex items-center gap-2" style={{ color: '#22c55e' }}>
                <Building2 className="h-5 w-5" style={{ color: '#ff8c42' }} />
                Dashboard Geral
              </CardTitle>
              <CardDescription style={{ color: '#888' }}>
                Visão geral dos cadastros e estatísticas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-white">
                Acompanhe todos os registros empresariais e seus status
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl" 
            style={{ 
              background: '#1a1a1a', 
              border: '1px solid #333',
              borderRadius: '8px'
            }}
            onClick={() => window.open('/sistema-final', '_blank')}>
            <CardHeader style={{ borderBottom: '1px solid #333' }}>
              <CardTitle className="flex items-center gap-2" style={{ color: '#22c55e' }}>
                <FileText className="h-5 w-5" style={{ color: '#ff8c42' }} />
                Sistema de Tarefas
              </CardTitle>
              <CardDescription style={{ color: '#888' }}>
                Gerenciamento completo de workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-white">
                Controle de tarefas por departamento e status
              </p>
            </CardContent>
          </Card>

          {user?.role === 'admin' && (
            <Card 
              className="cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl" 
              style={{ 
                background: '#1a1a1a', 
                border: '1px solid #333',
                borderRadius: '8px'
              }}
              onClick={() => window.open('/sistema-final', '_blank')}>
              <CardHeader style={{ borderBottom: '1px solid #333' }}>
                <CardTitle className="flex items-center gap-2" style={{ color: '#22c55e' }}>
                  <Users className="h-5 w-5" style={{ color: '#ff8c42' }} />
                  Gestão de Usuários
                </CardTitle>
                <CardDescription style={{ color: '#888' }}>
                  Administração de equipe (Admin)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-white">
                  Criar, editar e gerenciar usuários do sistema
                </p>
              </CardContent>
            </Card>
          )}

          <Card 
            className="cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl" 
            style={{ 
              background: '#1a1a1a', 
              border: '1px solid #333',
              borderRadius: '8px'
            }}
            onClick={() => window.open('/business-registration', '_blank')}>
            <CardHeader style={{ borderBottom: '1px solid #333' }}>
              <CardTitle className="flex items-center gap-2" style={{ color: '#22c55e' }}>
                <Building2 className="h-5 w-5" style={{ color: '#ff8c42' }} />
                Cadastro Empresarial
              </CardTitle>
              <CardDescription style={{ color: '#888' }}>
                Formulário público de registro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-white">
                Acesso ao formulário de cadastro de empresas
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl" 
            style={{ 
              background: '#1a1a1a', 
              border: '1px solid #333',
              borderRadius: '8px'
            }}
            onClick={() => window.open('/contratacao-funcionarios', '_blank')}>
            <CardHeader style={{ borderBottom: '1px solid #333' }}>
              <CardTitle className="flex items-center gap-2" style={{ color: '#22c55e' }}>
                <Users className="h-5 w-5" style={{ color: '#ff8c42' }} />
                Contratação
              </CardTitle>
              <CardDescription style={{ color: '#888' }}>
                Formulário de contratação de funcionários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-white">
                Cadastro de novos colaboradores
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl" 
            style={{ 
              background: '#1a1a1a', 
              border: '1px solid #333',
              borderRadius: '8px'
            }}
            onClick={() => window.open('https://dark-simulador-patrickdauer.replit.app/', '_blank')}>
            <CardHeader style={{ borderBottom: '1px solid #333' }}>
              <CardTitle className="flex items-center gap-2" style={{ color: '#22c55e' }}>
                <Settings className="h-5 w-5" style={{ color: '#ff8c42' }} />
                Simulador de Custos
              </CardTitle>
              <CardDescription style={{ color: '#888' }}>Ferramenta de cálculo de custos de Funcionário e comparativo CLT x PJ</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-white">
                Simule custos de contratação e benefícios
              </p>
            </CardContent>
          </Card>
        </div>

        <div 
          className="mt-12 p-6 rounded-lg"
          style={{ 
            background: '#1a1a1a', 
            border: '1px solid #333',
            borderRadius: '8px'
          }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#22c55e' }}>Status do Sistema</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="text-white">
              <span className="font-medium" style={{ color: '#ff8c42' }}>Usuário:</span> {user?.name || user?.username || 'N/A'}
            </div>
            <div className="text-white">
              <span className="font-medium" style={{ color: '#ff8c42' }}>Perfil:</span> {user?.role || 'employee'}
            </div>
            <div className="text-white">
              <span className="font-medium" style={{ color: '#ff8c42' }}>Departamento:</span> {user?.department || 'Geral'}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
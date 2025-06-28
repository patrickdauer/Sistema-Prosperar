import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, FileText, Settings, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Sistema Interno</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user?.email || 'Usuário'}
            </span>
            <ThemeToggle />
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Bem-vindo ao Sistema de Gestão
          </h2>
          <p className="text-muted-foreground">
            Acesse as funcionalidades do sistema através das opções abaixo.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                onClick={() => window.location.href = '/dashboard'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Dashboard Geral
              </CardTitle>
              <CardDescription>
                Visão geral dos cadastros e estatísticas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Acompanhe todos os registros empresariais e seus status
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                onClick={() => window.location.href = '/sistema-final'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Sistema de Tarefas
              </CardTitle>
              <CardDescription>
                Gerenciamento completo de workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Controle de tarefas por departamento e status
              </p>
            </CardContent>
          </Card>

          {user?.role === 'admin' && (
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                  onClick={() => window.location.href = '/dashboard-interno'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Gestão de Usuários
                </CardTitle>
                <CardDescription>
                  Administração de equipe (Admin)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Criar, editar e gerenciar usuários do sistema
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                onClick={() => window.location.href = '/business-registration'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Cadastro Empresarial
              </CardTitle>
              <CardDescription>
                Formulário público de registro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Acesso ao formulário de cadastro de empresas
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                onClick={() => window.location.href = '/contratacao-funcionarios'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Contratação
              </CardTitle>
              <CardDescription>
                Formulário de contratação de funcionários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Cadastro de novos colaboradores
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                onClick={() => window.open('https://dark-simulador-patrickdauer.replit.app/', '_blank')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Simulador de Custos
              </CardTitle>
              <CardDescription>
                Ferramenta de cálculo de custos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Simule custos de contratação e benefícios
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 p-6 bg-muted rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Status do Sistema</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Usuário:</span> {user?.email || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Perfil:</span> {user?.role || 'employee'}
            </div>
            <div>
              <span className="font-medium">Departamento:</span> {user?.department || 'Geral'}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
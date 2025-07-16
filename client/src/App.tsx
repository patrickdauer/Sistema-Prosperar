import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";

// Pages
import BusinessRegistration from "@/pages/business-registration-new";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import DashboardInterno from "@/pages/sistema-novo";
import SistemaFinal from "@/pages/sistema-final";
import ContratacaoFuncionarios from "@/pages/contratacao-funcionarios";
import SimuladorCusto from "@/pages/simulador-custo";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import UserManagement from "@/pages/user-management";
import Profile from "@/pages/profile";
import Clientes from "@/pages/clientes";
import ClienteDetails from "@/pages/cliente-details-fixed";
import NovoCliente from "@/pages/novo-cliente";
import ClienteTasks from "@/pages/cliente-tasks";
import DASMEIPage from "@/pages/das-mei";

function ProtectedDashboardInterno() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#ff0000',
        color: '#00ff00',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '50px',
        fontWeight: 'bold'
      }}>
        <div>🔥 NOVO SISTEMA CARREGANDO 🔥</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <DashboardInterno />;
}

function ProtectedSistemaFinal() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#0f0f23',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        fontWeight: 'bold'
      }}>
        <div>🔄 SISTEMA FINAL CARREGANDO...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <SistemaFinal />;
}

function ProtectedSistemaDark() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#0a0a0a',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px'
      }}>
        Carregando...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <SistemaFinal />;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show landing page when loading or not authenticated
  if (isLoading || !isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/business-registration" component={BusinessRegistration} />
        <Route path="/contratacao-funcionarios" component={ContratacaoFuncionarios} />
        <Route path="/simulador-custo" component={SimuladorCusto} />
        <Route component={Landing} />
      </Switch>
    );
  }

  // Show authenticated routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/home" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/business-registration" component={BusinessRegistration} />
      <Route path="/contratacao-funcionarios" component={ContratacaoFuncionarios} />
      <Route path="/simulador-custo" component={SimuladorCusto} />
      <Route path="/equipe" component={Login} />
      <Route path="/dashboard-interno" component={ProtectedDashboardInterno} />
      <Route path="/interno" component={ProtectedDashboardInterno} />
      <Route path="/novo-sistema" component={ProtectedSistemaFinal} />
      <Route path="/sistema-final" component={ProtectedSistemaFinal} />
      <Route path="/user-management" component={UserManagement} />
      <Route path="/profile" component={Profile} />
      <Route path="/clientes" component={Clientes} />
      <Route path="/novo-cliente" component={NovoCliente} />
      <Route path="/clientes/:id" component={ClienteDetails} />
      <Route path="/cliente-tasks" component={ClienteTasks} />
      <Route path="/das-mei" component={DASMEIPage} />
      <Route component={Home} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="business-form-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;

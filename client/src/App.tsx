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
import DASMEIAutomationPage from "@/pages/dasmei-automation";
import LinksPage from "@/pages/links";

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

  return (
    <Switch>
      {/* Public routes - always accessible */}
      <Route path="/business-registration" component={BusinessRegistration} />
      <Route path="/contratacao-funcionarios" component={ContratacaoFuncionarios} />
      <Route path="/simulador-custo" component={SimuladorCusto} />
      <Route path="/login" component={Login} />
      <Route path="/equipe" component={Login} />
      
      {/* Landing page for unauthenticated users at root and common URLs */}
      <Route path="/">
        {({ params }) => {
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
            return <Landing />;
          }
          
          return <Home />;
        }}
      </Route>
      
      {/* Authenticated routes */}
      <Route path="/home">
        {() => isAuthenticated ? <Home /> : <Login />}
      </Route>
      <Route path="/dashboard">
        {() => isAuthenticated ? <Dashboard /> : <Landing />}
      </Route>
      <Route path="/dashboard-interno" component={ProtectedDashboardInterno} />
      <Route path="/interno" component={ProtectedDashboardInterno} />
      <Route path="/novo-sistema" component={ProtectedSistemaFinal} />
      <Route path="/sistema-final" component={ProtectedSistemaFinal} />
      <Route path="/user-management">
        {() => isAuthenticated ? <UserManagement /> : <Landing />}
      </Route>
      <Route path="/profile">
        {() => isAuthenticated ? <Profile /> : <Landing />}
      </Route>
      <Route path="/clientes">
        {() => isAuthenticated ? <Clientes /> : <Landing />}
      </Route>
      <Route path="/novo-cliente">
        {() => isAuthenticated ? <NovoCliente /> : <Landing />}
      </Route>
      <Route path="/clientes/:id">
        {() => isAuthenticated ? <ClienteDetails /> : <Landing />}
      </Route>
      <Route path="/cliente-tasks">
        {() => isAuthenticated ? <ClienteTasks /> : <Landing />}
      </Route>
      <Route path="/das-mei">
        {() => isAuthenticated ? <DASMEIAutomationPage /> : <Landing />}
      </Route>
      <Route path="/links">
        {() => isAuthenticated ? <LinksPage /> : <Landing />}
      </Route>
      
      {/* Fallback to Landing for unknown routes when not authenticated */}
      <Route>
        {() => isAuthenticated ? <Home /> : <Landing />}
      </Route>
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

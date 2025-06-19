import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

// Pages
import BusinessRegistration from "@/pages/business-registration-new";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import DashboardInterno from "@/pages/sistema-novo";
import SistemaFinal from "@/pages/sistema-final";
import NotFound from "@/pages/not-found";

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

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="business-form-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Switch>
              <Route path="/" component={BusinessRegistration} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/equipe" component={Login} />
              <Route path="/dashboard-interno" component={ProtectedDashboardInterno} />
              <Route path="/novo-sistema" component={SistemaFinal} />
              <Route path="/dark" component={SistemaFinal} />
              <Route component={NotFound} />
            </Switch>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;

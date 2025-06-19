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
import DashboardInterno from "@/pages/dashboard-interno";
import NotFound from "@/pages/not-found";

function ProtectedDashboardInterno() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#1a1a2e',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>Carregando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <DashboardInterno />;
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
              <Route component={NotFound} />
            </Switch>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
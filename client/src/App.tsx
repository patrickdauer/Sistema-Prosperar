import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import BusinessRegistration from "@/pages/business-registration-new";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import InternalDashboard from "@/pages/sistema-interno";

function Router() {
  return (
    <Switch>
      <Route path="/" component={BusinessRegistration} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/equipe" component={Login} />
      <Route path="/interno" component={ProtectedRoute} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ProtectedRoute() {
  try {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-muted-foreground">Carregando...</div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return <Login />;
    }

    return <InternalDashboard />;
  } catch (error) {
    // Fallback if auth hook fails
    return <Login />;
  }
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="business-form-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;

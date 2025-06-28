import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  name: string;
  email: string | null;
  role: string;
  department: string | null;
  isActive: boolean | null;
}

export function useAuth() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/login", credentials);
      const data = await response.json();
      
      // Store token in localStorage
      if (data.token) {
        localStorage.setItem("auth_token", data.token);
      }
      
      return data.user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo, ${user.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logout = () => {
    localStorage.removeItem("auth_token");
    queryClient.setQueryData(["/api/user"], null);
    queryClient.clear();
    window.location.href = "/login";
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    logout,
    isLoginLoading: loginMutation.isPending,
  };
}
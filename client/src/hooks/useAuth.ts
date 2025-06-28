import { useQuery } from "@tanstack/react-query";

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
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user"],
    retry: false,
    onError: (error: Error) => {
      // Clear invalid token if user endpoint fails
      if (error.message.includes('401')) {
        localStorage.removeItem('token');
      }
    }
  });

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
  };
}
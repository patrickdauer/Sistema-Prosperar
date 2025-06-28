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
  const token = localStorage.getItem('token');
  
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user"],
    enabled: !!token,
    retry: false,
    queryFn: async () => {
      const response = await fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        localStorage.removeItem('token');
        throw new Error('Authentication failed');
      }
      return response.json();
    }
  });

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user && !!token,
  };
}
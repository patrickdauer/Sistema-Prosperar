import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface UserProfile {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UpdateProfileData {
  name: string;
  email: string;
  department?: string;
  currentPassword?: string;
  newPassword?: string;
}

// Hook para buscar perfil do usuário
export function useUserProfile() {
  return useQuery<UserProfile>({
    queryKey: ['/api/user/profile'],
    queryFn: async () => {
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar perfil do usuário');
      }
      
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
  });
}

// Hook para atualizar perfil do usuário
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation<UserProfile, Error, UpdateProfileData>({
    mutationFn: async (data: UpdateProfileData) => {
      return apiRequest('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: (data) => {
      // Atualiza o cache com os novos dados
      queryClient.setQueryData(['/api/user/profile'], data);
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error) => {
      console.error('Erro ao atualizar perfil:', error);
    },
  });
}

// Hook para verificar se o usuário pode editar seu perfil
export function useCanEditProfile() {
  const { data: profile } = useUserProfile();
  
  return {
    canEdit: profile?.isActive === true,
    isAdmin: profile?.role === 'admin',
    currentUser: profile,
  };
}
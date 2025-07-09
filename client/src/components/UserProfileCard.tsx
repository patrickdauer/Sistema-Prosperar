import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Calendar, Shield, Building2, Edit } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserProfileCardProps {
  onEdit?: () => void;
  showEditButton?: boolean;
}

export function UserProfileCard({ onEdit, showEditButton = true }: UserProfileCardProps) {
  const { data: profile, isLoading, error } = useUserProfile();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            Erro ao carregar perfil do usuário
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Perfil não encontrado
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'user':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true,
      locale: ptBR 
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Perfil do Usuário</CardTitle>
          {showEditButton && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Avatar e informações básicas */}
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-gray-500" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{profile.name}</h3>
            <p className="text-sm text-gray-600">@{profile.username}</p>
          </div>
        </div>

        {/* Informações detalhadas */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Mail className="h-4 w-4 text-gray-500" />
            <span className="text-sm">{profile.email}</span>
          </div>

          <div className="flex items-center space-x-3">
            <Shield className="h-4 w-4 text-gray-500" />
            <Badge className={getRoleBadgeColor(profile.role)}>
              {profile.role === 'admin' ? 'Administrador' : 
               profile.role === 'manager' ? 'Gerente' : 'Usuário'}
            </Badge>
          </div>

          {profile.department && (
            <div className="flex items-center space-x-3">
              <Building2 className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{profile.department}</span>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm">
              Criado {formatDate(profile.createdAt)}
            </span>
          </div>

          {profile.updatedAt !== profile.createdAt && (
            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                Atualizado {formatDate(profile.updatedAt)}
              </span>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="pt-3 border-t">
          <Badge variant={profile.isActive ? "default" : "secondary"}>
            {profile.isActive ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
import { useState } from 'react';
import { UserProfileCard } from '@/components/UserProfileCard';
import { UserProfileForm } from '@/components/UserProfileForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

// Exemplo de como usar os endpoints de perfil do usuário
export default function UserProfileExample() {
  const [isEditing, setIsEditing] = useState(false);

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveSuccess = () => {
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Perfil do Usuário
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gerencie suas informações pessoais e configurações de conta
            </p>
          </div>

          {/* Content */}
          <div className="grid gap-8 md:grid-cols-2">
            {/* Profile Card */}
            <div>
              {isEditing ? (
                <UserProfileForm
                  onCancel={handleCancelEdit}
                  onSuccess={handleSaveSuccess}
                />
              ) : (
                <UserProfileCard
                  onEdit={handleEditProfile}
                  showEditButton={true}
                />
              )}
            </div>

            {/* API Usage Examples */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Como usar os endpoints</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm mb-2">
                      GET /api/user/profile
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Retorna informações do perfil do usuário autenticado
                    </p>
                    <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                      <code>
                        {`fetch('/api/user/profile', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
})`}
                      </code>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm mb-2">
                      PUT /api/user/profile
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Atualiza informações do perfil do usuário
                    </p>
                    <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                      <code>
                        {`fetch('/api/user/profile', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Novo Nome',
    email: 'novo@email.com',
    department: 'contabilidade'
  })
})`}
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recursos de Segurança</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Autenticação obrigatória via JWT</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Verificação de usuário ativo</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Validação de senha atual para alterações</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Dados sensíveis nunca retornados</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Hash seguro de senhas</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Campos Editáveis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm">
                    <strong>✓ Nome:</strong> Pode ser alterado
                  </div>
                  <div className="text-sm">
                    <strong>✓ Email:</strong> Pode ser alterado
                  </div>
                  <div className="text-sm">
                    <strong>✓ Departamento:</strong> Pode ser alterado
                  </div>
                  <div className="text-sm">
                    <strong>✓ Senha:</strong> Pode ser alterada (com verificação)
                  </div>
                  <div className="text-sm text-gray-500">
                    <strong>✗ Username:</strong> Não pode ser alterado
                  </div>
                  <div className="text-sm text-gray-500">
                    <strong>✗ Role:</strong> Apenas admins podem alterar
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth.tsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Users, UserPlus, Edit, Trash2, LogOut, Home, Settings, Key } from 'lucide-react';
import { BackToHomeButton } from '@/components/back-to-home-button';

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  department: string;
  isActive: boolean;
}

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  
  const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/equipe';
  };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [changingPasswordUser, setChangingPasswordUser] = useState<User | null>(null);
  const [editUserData, setEditUserData] = useState({
    name: '',
    email: '',
    role: 'user',
    department: ''
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [newUserData, setNewUserData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'user',
    department: ''
  });
  const [customDepartment, setCustomDepartment] = useState('');
  const [showCustomDepartment, setShowCustomDepartment] = useState(false);
  const [editCustomDepartment, setEditCustomDepartment] = useState('');
  const [showEditCustomDepartment, setShowEditCustomDepartment] = useState(false);

  // Debug - vamos ver os dados do usuário
  console.log('Current user data:', currentUser);
  console.log('User role:', currentUser?.role);
  console.log('Is admin check:', currentUser?.role === 'admin');

  // Verificar se é admin - vamos temporariamente permitir acesso para debugar
  // if (currentUser && currentUser.role !== 'admin') {
  //   return (
  //     <div 
  //       className="min-h-screen flex items-center justify-center"
  //       style={{ background: '#0a0a0a' }}
  //     >
  //       <Card style={{ background: '#1a1a1a', border: '1px solid #333' }}>
  //         <CardContent className="p-8 text-center">
  //           <h2 className="text-xl font-bold mb-4" style={{ color: '#22c55e' }}>
  //             Acesso Negado
  //           </h2>
  //           <p className="text-white mb-4">
  //             Apenas administradores podem acessar a gestão de usuários.
  //           </p>
  //           <BackToHomeButton />
  //         </CardContent>
  //       </Card>
  //     </div>
  //   );
  // }

  // Buscar usuários
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erro ao carregar usuários');
      return response.json() as Promise<User[]>;
    }
  });

  // Criar usuário
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUserData) => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });
      if (!response.ok) throw new Error('Erro ao criar usuário');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateDialogOpen(false);
      resetCreateForm();
      toast({ title: "Usuário criado com sucesso!" });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao criar usuário", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Editar usuário
  const editUserMutation = useMutation({
    mutationFn: async (userData: { id: number; data: typeof editUserData }) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${userData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData.data)
      });
      if (!response.ok) throw new Error('Erro ao editar usuário');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
      setEditUserData({ name: '', email: '', role: 'user', department: '' });
      toast({ title: "Usuário editado com sucesso!" });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao editar usuário", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Deletar usuário
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erro ao deletar usuário');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: "Usuário deletado com sucesso!" });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao deletar usuário", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Alterar senha do usuário
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { userId: number; newPassword: string }) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${data.userId}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: data.newPassword })
      });
      if (!response.ok) throw new Error('Erro ao alterar senha');
      return response.json();
    },
    onSuccess: () => {
      setChangingPasswordUser(null);
      setPasswordData({ newPassword: '', confirmPassword: '' });
      toast({ title: "Senha alterada com sucesso!" });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao alterar senha", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleCreateUser = () => {
    createUserMutation.mutate(newUserData);
  };

  const resetCreateForm = () => {
    setNewUserData({
      username: '',
      password: '',
      name: '',
      email: '',
      role: 'user',
      department: ''
    });
    setCustomDepartment('');
    setShowCustomDepartment(false);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditUserData({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department
    });
    setEditCustomDepartment('');
    setShowEditCustomDepartment(false);
  };

  const resetEditForm = () => {
    setEditingUser(null);
    setEditUserData({ name: '', email: '', role: 'user', department: '' });
    setEditCustomDepartment('');
    setShowEditCustomDepartment(false);
  };

  const handleSaveEditUser = () => {
    if (editingUser) {
      editUserMutation.mutate({ id: editingUser.id, data: editUserData });
    }
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm('Tem certeza que deseja deletar este usuário?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleChangePassword = (user: User) => {
    setChangingPasswordUser(user);
    setPasswordData({ newPassword: '', confirmPassword: '' });
  };

  const handleSavePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ 
        title: "Erro", 
        description: "As senhas não coincidem",
        variant: "destructive" 
      });
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast({ 
        title: "Erro", 
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive" 
      });
      return;
    }

    if (changingPasswordUser) {
      changePasswordMutation.mutate({ 
        userId: changingPasswordUser.id, 
        newPassword: passwordData.newPassword 
      });
    }
  };

  // Loading state - mostrar a página mesmo se estiver carregando
  // if (isLoading) {
  //   return (
  //     <div 
  //       className="min-h-screen flex items-center justify-center"
  //       style={{ background: '#0a0a0a' }}
  //     >
  //       <div className="text-white">Carregando...</div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <header style={{ background: '#1a1a1a', borderBottom: '1px solid #333' }}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold" style={{ color: '#22c55e' }}>
            Gestão de Usuários
          </h1>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/home'}
              style={{ borderColor: '#22c55e', color: '#22c55e' }}
            >
              <Home className="h-4 w-4 mr-2" />
              Voltar ao Menu
            </Button>
            <Button variant="outline" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">
              Usuários do Sistema
            </h2>
            <p className="text-gray-400">
              Gerencie usuários, permissões e departamentos
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button style={{ backgroundColor: '#22c55e', color: 'white' }}>
                <UserPlus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent style={{ background: '#1a1a1a', border: '1px solid #333' }}>
              <DialogHeader>
                <DialogTitle style={{ color: '#22c55e' }}>Criar Novo Usuário</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Nome de usuário</Label>
                    <Input
                      value={newUserData.username}
                      onChange={(e) => setNewUserData({...newUserData, username: e.target.value})}
                      style={{ background: '#333', border: '1px solid #555', color: 'white' }}
                    />
                  </div>
                  <div>
                    <Label className="text-white">Senha</Label>
                    <Input
                      type="password"
                      value={newUserData.password}
                      onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                      style={{ background: '#333', border: '1px solid #555', color: 'white' }}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-white">Nome completo</Label>
                  <Input
                    value={newUserData.name}
                    onChange={(e) => setNewUserData({...newUserData, name: e.target.value})}
                    style={{ background: '#333', border: '1px solid #555', color: 'white' }}
                  />
                </div>
                <div>
                  <Label className="text-white">Email</Label>
                  <Input
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                    style={{ background: '#333', border: '1px solid #555', color: 'white' }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Perfil</Label>
                    <Select value={newUserData.role} onValueChange={(value) => setNewUserData({...newUserData, role: value})}>
                      <SelectTrigger style={{ background: '#333', border: '1px solid #555', color: 'white' }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent style={{ background: '#333', border: '1px solid #555' }}>
                        <SelectItem value="user" style={{ color: 'white' }}>Usuário</SelectItem>
                        <SelectItem value="admin" style={{ color: 'white' }}>Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-white">Departamento</Label>
                    <Select 
                      value={showCustomDepartment ? 'custom' : newUserData.department} 
                      onValueChange={(value) => {
                        if (value === 'custom') {
                          setShowCustomDepartment(true);
                          setNewUserData({...newUserData, department: ''});
                        } else {
                          setShowCustomDepartment(false);
                          setNewUserData({...newUserData, department: value});
                          setCustomDepartment('');
                        }
                      }}
                    >
                      <SelectTrigger style={{ background: '#333', border: '1px solid #555', color: 'white' }}>
                        <SelectValue placeholder="Selecione um departamento" />
                      </SelectTrigger>
                      <SelectContent style={{ background: '#333', border: '1px solid #555' }}>
                        <SelectItem value="contabilidade" style={{ color: 'white' }}>Contabilidade</SelectItem>
                        <SelectItem value="fiscal" style={{ color: 'white' }}>Fiscal</SelectItem>
                        <SelectItem value="rh" style={{ color: 'white' }}>Recursos Humanos</SelectItem>
                        <SelectItem value="societario" style={{ color: 'white' }}>Societário</SelectItem>
                        <SelectItem value="financeiro" style={{ color: 'white' }}>Financeiro</SelectItem>
                        <SelectItem value="juridico" style={{ color: 'white' }}>Jurídico</SelectItem>
                        <SelectItem value="auditoria" style={{ color: 'white' }}>Auditoria</SelectItem>
                        <SelectItem value="consultoria" style={{ color: 'white' }}>Consultoria</SelectItem>
                        <SelectItem value="ti" style={{ color: 'white' }}>Tecnologia da Informação</SelectItem>
                        <SelectItem value="marketing" style={{ color: 'white' }}>Marketing</SelectItem>
                        <SelectItem value="comercial" style={{ color: 'white' }}>Comercial</SelectItem>
                        <SelectItem value="custom" style={{ color: '#22c55e', fontWeight: 'bold' }}>+ Criar Novo Departamento</SelectItem>
                      </SelectContent>
                    </Select>
                    {showCustomDepartment && (
                      <div className="mt-2">
                        <Input
                          placeholder="Digite o nome do novo departamento"
                          value={customDepartment}
                          onChange={(e) => {
                            setCustomDepartment(e.target.value);
                            setNewUserData({...newUserData, department: e.target.value});
                          }}
                          style={{ background: '#333', border: '1px solid #555', color: 'white' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => {
                    setIsCreateDialogOpen(false);
                    resetCreateForm();
                  }}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCreateUser}
                    disabled={createUserMutation.isPending}
                    style={{ backgroundColor: '#22c55e', color: 'white' }}
                  >
                    {createUserMutation.isPending ? 'Criando...' : 'Criar Usuário'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit User Dialog */}
        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent style={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <DialogHeader>
              <DialogTitle style={{ color: '#22c55e' }}>Editar Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-white">Nome completo</Label>
                <Input
                  value={editUserData.name}
                  onChange={(e) => setEditUserData({...editUserData, name: e.target.value})}
                  style={{ background: '#333', border: '1px solid #555', color: 'white' }}
                />
              </div>
              <div>
                <Label className="text-white">Email</Label>
                <Input
                  type="email"
                  value={editUserData.email}
                  onChange={(e) => setEditUserData({...editUserData, email: e.target.value})}
                  style={{ background: '#333', border: '1px solid #555', color: 'white' }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Perfil</Label>
                  <Select value={editUserData.role} onValueChange={(value) => setEditUserData({...editUserData, role: value})}>
                    <SelectTrigger style={{ background: '#333', border: '1px solid #555', color: 'white' }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ background: '#333', border: '1px solid #555' }}>
                      <SelectItem value="user" style={{ color: 'white' }}>Usuário</SelectItem>
                      <SelectItem value="admin" style={{ color: 'white' }}>Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white">Departamento</Label>
                  <Select 
                    value={showEditCustomDepartment ? 'custom' : editUserData.department} 
                    onValueChange={(value) => {
                      if (value === 'custom') {
                        setShowEditCustomDepartment(true);
                        setEditUserData({...editUserData, department: ''});
                      } else {
                        setShowEditCustomDepartment(false);
                        setEditUserData({...editUserData, department: value});
                        setEditCustomDepartment('');
                      }
                    }}
                  >
                    <SelectTrigger style={{ background: '#333', border: '1px solid #555', color: 'white' }}>
                      <SelectValue placeholder="Selecione um departamento" />
                    </SelectTrigger>
                    <SelectContent style={{ background: '#333', border: '1px solid #555' }}>
                      <SelectItem value="contabilidade" style={{ color: 'white' }}>Contabilidade</SelectItem>
                      <SelectItem value="fiscal" style={{ color: 'white' }}>Fiscal</SelectItem>
                      <SelectItem value="rh" style={{ color: 'white' }}>Recursos Humanos</SelectItem>
                      <SelectItem value="societario" style={{ color: 'white' }}>Societário</SelectItem>
                      <SelectItem value="financeiro" style={{ color: 'white' }}>Financeiro</SelectItem>
                      <SelectItem value="juridico" style={{ color: 'white' }}>Jurídico</SelectItem>
                      <SelectItem value="auditoria" style={{ color: 'white' }}>Auditoria</SelectItem>
                      <SelectItem value="consultoria" style={{ color: 'white' }}>Consultoria</SelectItem>
                      <SelectItem value="ti" style={{ color: 'white' }}>Tecnologia da Informação</SelectItem>
                      <SelectItem value="marketing" style={{ color: 'white' }}>Marketing</SelectItem>
                      <SelectItem value="comercial" style={{ color: 'white' }}>Comercial</SelectItem>
                      <SelectItem value="custom" style={{ color: '#22c55e', fontWeight: 'bold' }}>+ Criar Novo Departamento</SelectItem>
                    </SelectContent>
                  </Select>
                  {showEditCustomDepartment && (
                    <div className="mt-2">
                      <Input
                        placeholder="Digite o nome do novo departamento"
                        value={editCustomDepartment}
                        onChange={(e) => {
                          setEditCustomDepartment(e.target.value);
                          setEditUserData({...editUserData, department: e.target.value});
                        }}
                        style={{ background: '#333', border: '1px solid #555', color: 'white' }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingUser(null)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSaveEditUser}
                  disabled={editUserMutation.isPending}
                  style={{ backgroundColor: '#22c55e', color: 'white' }}
                >
                  {editUserMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Change Password Dialog */}
        <Dialog open={!!changingPasswordUser} onOpenChange={(open) => !open && setChangingPasswordUser(null)}>
          <DialogContent style={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <DialogHeader>
              <DialogTitle style={{ color: '#22c55e' }}>
                Alterar Senha - {changingPasswordUser?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-white">Nova Senha</Label>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  style={{ background: '#333', border: '1px solid #555', color: 'white' }}
                  placeholder="Digite a nova senha (mínimo 6 caracteres)"
                />
              </div>
              <div>
                <Label className="text-white">Confirmar Nova Senha</Label>
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  style={{ background: '#333', border: '1px solid #555', color: 'white' }}
                  placeholder="Digite novamente a nova senha"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setChangingPasswordUser(null)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSavePassword}
                  disabled={changePasswordMutation.isPending}
                  style={{ backgroundColor: '#22c55e', color: 'white' }}
                >
                  {changePasswordMutation.isPending ? 'Alterando...' : 'Alterar Senha'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Users Grid */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-white">Carregando usuários...</div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users?.map((user) => (
              <Card 
                key={user.id}
                style={{ background: '#1a1a1a', border: '1px solid #333' }}
              >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" style={{ color: '#ff8c42' }} />
                    <span style={{ color: '#22c55e' }}>{user.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleEditUser(user)}
                      title="Editar usuário"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleChangePassword(user)}
                      title="Alterar senha"
                      style={{ color: '#ff8c42' }}
                    >
                      <Key className="h-4 w-4" />
                    </Button>
                    {user.id !== currentUser?.id && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={deleteUserMutation.isPending}
                        title="Deletar usuário"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-white">
                    <span className="text-gray-400">Usuário:</span> {user.username}
                  </p>
                  <p className="text-white">
                    <span className="text-gray-400">Email:</span> {user.email}
                  </p>
                  <div className="flex gap-2">
                    <Badge 
                      variant={user.role === 'admin' ? 'default' : 'secondary'}
                      style={{ 
                        backgroundColor: user.role === 'admin' ? '#ff8c42' : '#666',
                        color: 'white'
                      }}
                    >
                      {user.role === 'admin' ? 'Admin' : 'Usuário'}
                    </Badge>
                    <Badge variant="outline" style={{ borderColor: '#22c55e', color: '#22c55e' }}>
                      {user.department}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
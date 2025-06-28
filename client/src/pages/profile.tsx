import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User, Key, Save, X, ArrowLeft } from "lucide-react";
import { BackToHomeButton } from "@/components/back-to-home-button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const DEPARTMENTS = [
  { value: 'contabilidade', label: 'Contabilidade' },
  { value: 'fiscal', label: 'Fiscal' },
  { value: 'rh', label: 'Recursos Humanos' },
  { value: 'societario', label: 'Societário' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'juridico', label: 'Jurídico' },
  { value: 'auditoria', label: 'Auditoria' },
  { value: 'consultoria', label: 'Consultoria' },
  { value: 'ti', label: 'Tecnologia da Informação' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'comercial', label: 'Comercial' }
];

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    department: ''
  });
  
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [customDepartment, setCustomDepartment] = useState('');
  const [showCustomDepartment, setShowCustomDepartment] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        department: user.department || ''
      });
      
      // Parse existing departments
      const existingDepts = user.department ? user.department.split(', ').filter(d => d.trim()) : [];
      setSelectedDepartments(existingDepts);
    }
  }, [user]);

  const handleDepartmentToggle = (department: string) => {
    setSelectedDepartments(prev => {
      if (prev.includes(department)) {
        return prev.filter(d => d !== department);
      } else {
        return [...prev, department];
      }
    });
  };

  const addCustomDepartment = (customDept: string) => {
    if (customDept.trim() && !selectedDepartments.includes(customDept.trim())) {
      setSelectedDepartments(prev => [...prev, customDept.trim()]);
      setCustomDepartment('');
      setShowCustomDepartment(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const updatedProfile = {
        ...profileData,
        department: selectedDepartments.join(', ')
      };
      
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedProfile)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso!"
      });
      
      // Refresh user data
      window.location.reload();
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive"
      });
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${user.id}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to change password');
      }
      
      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso!"
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordDialog(false);
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar a senha. Verifique sua senha atual.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div className="text-white">Carregando...</div>;
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      <header style={{ 
        background: '#1a1a1a', 
        borderBottom: '1px solid #333'
      }}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <BackToHomeButton />
            <h1 className="text-2xl font-bold" style={{ color: '#22c55e' }}>Meu Perfil</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white">
              {user.name || user.username}
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Profile Information Card */}
          <Card style={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" style={{ color: '#ff8c42' }} />
                <span style={{ color: '#22c55e' }}>Informações Pessoais</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white">Nome Completo</Label>
                <Input
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  style={{ background: '#333', border: '1px solid #555', color: 'white' }}
                />
              </div>
              
              <div>
                <Label className="text-white">Email</Label>
                <Input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  style={{ background: '#333', border: '1px solid #555', color: 'white' }}
                />
              </div>
              
              <div>
                <Label className="text-white">Usuário</Label>
                <Input
                  value={user.username}
                  disabled
                  style={{ background: '#222', border: '1px solid #444', color: '#888' }}
                />
                <p className="text-xs text-gray-400 mt-1">O nome de usuário não pode ser alterado</p>
              </div>
              
              <div>
                <Label className="text-white">Departamentos</Label>
                <div style={{ background: '#333', border: '1px solid #555', borderRadius: '6px', padding: '12px', minHeight: '120px', maxHeight: '200px', overflowY: 'auto' }}>
                  <div className="space-y-2">
                    {DEPARTMENTS.map((dept) => (
                      <div key={dept.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`dept-${dept.value}`}
                          checked={selectedDepartments.includes(dept.value)}
                          onChange={() => handleDepartmentToggle(dept.value)}
                          style={{ accentColor: '#22c55e' }}
                        />
                        <label htmlFor={`dept-${dept.value}`} className="text-white text-sm cursor-pointer">
                          {dept.label}
                        </label>
                      </div>
                    ))}
                    <div className="border-t border-gray-600 pt-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCustomDepartment(!showCustomDepartment)}
                          style={{ borderColor: '#22c55e', color: '#22c55e', fontSize: '12px' }}
                        >
                          + Adicionar Departamento
                        </Button>
                      </div>
                      {showCustomDepartment && (
                        <div className="mt-2 flex gap-2">
                          <Input
                            placeholder="Nome do departamento"
                            value={customDepartment}
                            onChange={(e) => setCustomDepartment(e.target.value)}
                            style={{ background: '#222', border: '1px solid #555', color: 'white', fontSize: '12px' }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addCustomDepartment(customDepartment);
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={() => addCustomDepartment(customDepartment)}
                            style={{ backgroundColor: '#22c55e', color: 'white', fontSize: '12px' }}
                          >
                            Add
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {selectedDepartments.length > 0 && (
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-1">
                      {selectedDepartments.map((dept) => (
                        <Badge 
                          key={dept} 
                          variant="outline" 
                          style={{ borderColor: '#22c55e', color: '#22c55e', fontSize: '11px' }}
                          className="flex items-center gap-1"
                        >
                          {DEPARTMENTS.find(d => d.value === dept)?.label || dept}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => handleDepartmentToggle(dept)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                  style={{ backgroundColor: '#22c55e', color: 'white' }}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
                
                <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline"
                      style={{ borderColor: '#ff8c42', color: '#ff8c42' }}
                      className="flex items-center gap-2"
                    >
                      <Key className="h-4 w-4" />
                      Alterar Senha
                    </Button>
                  </DialogTrigger>
                  <DialogContent style={{ background: '#1a1a1a', border: '1px solid #333', color: 'white' }}>
                    <DialogHeader>
                      <DialogTitle style={{ color: '#22c55e' }}>Alterar Senha</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-white">Senha Atual</Label>
                        <Input
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                          style={{ background: '#333', border: '1px solid #555', color: 'white' }}
                        />
                      </div>
                      <div>
                        <Label className="text-white">Nova Senha</Label>
                        <Input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                          style={{ background: '#333', border: '1px solid #555', color: 'white' }}
                        />
                      </div>
                      <div>
                        <Label className="text-white">Confirmar Nova Senha</Label>
                        <Input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                          style={{ background: '#333', border: '1px solid #555', color: 'white' }}
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowPasswordDialog(false)}
                          style={{ borderColor: '#666', color: '#666' }}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleChangePassword}
                          disabled={isLoading}
                          style={{ backgroundColor: '#22c55e', color: 'white' }}
                        >
                          {isLoading ? 'Alterando...' : 'Alterar Senha'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
          
          {/* Account Info Card */}
          <Card style={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardHeader>
              <CardTitle style={{ color: '#22c55e' }}>Informações da Conta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Perfil:</span>
                  <Badge 
                    variant={user.role === 'admin' ? 'default' : 'secondary'}
                    style={{ 
                      backgroundColor: user.role === 'admin' ? '#ff8c42' : '#666',
                      color: 'white'
                    }}
                  >
                    {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <Badge style={{ backgroundColor: '#22c55e', color: 'white' }}>
                    Ativo
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
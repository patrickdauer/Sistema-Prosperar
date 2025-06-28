import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Building2, User, Lock } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if already authenticated
  if (isAuthenticated) {
    setLocation("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await login(username, password);
      setLocation("/");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Building2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">
            Sistema de Gestão <span className="text-green-500">Prosperar</span>
          </h1>
          <p className="text-gray-400">Acesso restrito para equipe interna</p>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-white">Entrar no Sistema</CardTitle>
            <CardDescription className="text-center text-gray-400">
              Digite suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-200 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Usuário
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  placeholder="Digite seu usuário"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-200 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  placeholder="Digite sua senha"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-600 text-red-400 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-700">
              <p className="text-sm text-gray-400 text-center">
                Acesso público disponível em:
              </p>
              <div className="flex gap-2 mt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLocation("/business-registration")}
                  className="flex-1 border-orange-500 text-orange-400 hover:bg-orange-500/10"
                >
                  Cadastro Empresarial
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLocation("/contratacao-funcionarios")}
                  className="flex-1 border-green-500 text-green-400 hover:bg-green-500/10"
                >
                  Contratação
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
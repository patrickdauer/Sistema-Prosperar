import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, User, Lock } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      queryClient.setQueryData(['/api/user'], data.user);
      window.location.href = "/";
    },
    onError: (err: any) => {
      setError(err.message || "Erro no login");
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Sistema de Gestão <span className="text-green-400">Prosperar</span>
          </h1>
          <p className="text-gray-400">Acesso restrito para equipe interna</p>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-white">Entrar no Sistema</h2>
            <p className="text-gray-400 text-sm mt-1">Digite suas credenciais para acessar o sistema</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
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

            <div>
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
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Entrando..." : "Entrar"}
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
                onClick={() => window.location.href = "/business-registration"}
                className="flex-1 border-orange-500 text-orange-400 hover:bg-orange-500/10"
              >
                Cadastro Empresarial
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = "/contratacao-funcionarios"}
                className="flex-1 border-orange-500 text-orange-400 hover:bg-orange-500/10"
              >
                Contratação
              </Button>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          © 2025 Prosperar Contabilidade. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
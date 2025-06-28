import { Button } from "@/components/ui/button";
import { Building2, Users, FileText, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-6">
            Sistema de Gestão <span className="text-green-500">Prosperar Contabilidade</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Plataforma completa para gerenciamento de cadastros empresariais, 
            tarefas departamentais e workflows internos.
          </p>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg"
          >
            Entrar com Replit
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-gray-800 p-6 rounded-lg text-center">
            <Building2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Cadastro Empresarial
            </h3>
            <p className="text-gray-400">
              Sistema completo para registro de empresas e sócios
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg text-center">
            <Users className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Gestão de Equipe
            </h3>
            <p className="text-gray-400">
              Controle de usuários e permissões por departamento
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg text-center">
            <FileText className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Workflow de Tarefas
            </h3>
            <p className="text-gray-400">
              Acompanhamento completo de processos empresariais
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg text-center">
            <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Segurança
            </h3>
            <p className="text-gray-400">
              Autenticação segura com Replit Auth
            </p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-400 mb-4">
            Acesso público disponível para:
          </p>
          <div className="flex justify-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/business-registration'}
              className="border-orange-500 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300"
            >
              Cadastro de Empresa
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/contratacao-funcionarios'}
              className="border-green-500 text-green-400 hover:bg-green-500/10 hover:text-green-300"
            >
              Contratação de Funcionários
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
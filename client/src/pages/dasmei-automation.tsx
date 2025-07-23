import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Users, 
  FileText, 
  MessageSquare, 
  Settings, 
  History, 
  RefreshCw,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Send,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BackToHomeButton } from '@/components/back-to-home-button';
import { ThemeToggle } from '@/components/theme-toggle';

// Componentes específicos
import { DashboardTab } from '@/components/dasmei/dashboard-tab';
import { ClientesTab } from '@/components/dasmei/clientes-tab';
import { BoletosTab } from '@/components/dasmei/boletos-tab';
import { MensagensTab } from '@/components/dasmei/mensagens-tab';
import { ConfiguracoesTab } from '@/components/dasmei/configuracoes-tab';
import { LogsTab } from '@/components/dasmei/logs-tab';
import { RetryCenterTab } from '@/components/dasmei/retry-center-tab';

export default function DASMEIAutomationPage() {
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const queryClient = useQueryClient();

  // Query para status geral do sistema
  const { data: systemStatus } = useQuery({
    queryKey: ['/api/dasmei/status'],
    refetchInterval: 30000 // Atualizar a cada 30 segundos
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BackToHomeButton />
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                  <FileText className="h-7 w-7 text-emerald-400" />
                  Automação DASMEI
                </h1>
                <p className="text-slate-400 mt-1">
                  Sistema completo de geração e envio de boletos DAS para clientes MEI
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {systemStatus && (
                <Badge 
                  variant={systemStatus.isRunning ? "default" : "destructive"}
                  className="px-3 py-1"
                >
                  {systemStatus.isRunning ? "Sistema Ativo" : "Sistema Inativo"}
                </Badge>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-slate-800 border border-slate-700">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="clientes" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="boletos" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Boletos
            </TabsTrigger>
            <TabsTrigger value="mensagens" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Mensagens
            </TabsTrigger>
            <TabsTrigger value="configuracoes" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="retry" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry Center
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardTab />
          </TabsContent>

          <TabsContent value="clientes">
            <ClientesTab />
          </TabsContent>

          <TabsContent value="boletos">
            <BoletosTab />
          </TabsContent>

          <TabsContent value="mensagens">
            <MensagensTab />
          </TabsContent>

          <TabsContent value="configuracoes">
            <ConfiguracoesTab />
          </TabsContent>

          <TabsContent value="logs">
            <LogsTab />
          </TabsContent>

          <TabsContent value="retry">
            <RetryCenterTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
import { dasmeiStorage } from '../dasmei-storage.js';
import { 
  ClienteMei, 
  InsertDasGuia, 
  InsertEnvioLog
} from '../../shared/das-schema.js';
import {
  InsertSystemLog,
  InsertRetryQueue,
  InsertEvolutionInstance,
  InsertMessageTemplate,
  InsertAutomationSetting,
  InsertFeriado
} from '../../shared/dasmei-schema.js';

export interface DASMEIResponse {
  success: boolean;
  data?: {
    cnpj: string;
    razaoSocial: string;
    periodo: string;
    periodos: {
      [key: string]: {
        urlDas: string;
        dataVencimento: string;
        valorTotalDas: string;
        situacao: string;
        principal: string;
        multas: string;
        juros: string;
        total: string;
      }
    }
  }[];
  error?: string;
}

export class DASMEIAutomationService {
  private infosimplesToken: string | null = null;

  constructor() {
    this.initializeApiToken();
  }

  private async initializeApiToken() {
    try {
      // Usar o dasStorage original para pegar configurações da API
      const { dasStorage } = await import('../das-storage.js');
      const config = await dasStorage.getApiConfigurationByType('infosimples');
      if (config && config.isActive) {
        const credentials = typeof config.credentials === 'string' 
          ? JSON.parse(config.credentials) 
          : config.credentials;
        this.infosimplesToken = credentials.token;
      }
    } catch (error) {
      console.error('Erro ao inicializar token InfoSimples:', error);
    }
  }

  // Gerar período no formato YYYYMM para o mês anterior
  private getCurrentPeriod(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-based
    
    if (month === 0) {
      // Janeiro - pegar dezembro do ano anterior
      return `${year - 1}12`;
    } else {
      // Outros meses - pegar mês anterior
      const prevMonth = month.toString().padStart(2, '0');
      return `${year}${prevMonth}`;
    }
  }

  // Verificar se é dia útil (não fim de semana nem feriado)
  private async isDiaUtil(data: Date): Promise<boolean> {
    const dayOfWeek = data.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false; // Domingo ou sábado
    }

    // Verificar feriados
    const feriados = await dasStorage.getFeriadosByData(data);
    return feriados.length === 0;
  }

  // Obter próximo dia útil
  private async getProximoDiaUtil(data: Date): Promise<Date> {
    let proximaData = new Date(data);
    
    while (!(await this.isDiaUtil(proximaData))) {
      proximaData.setDate(proximaData.getDate() + 1);
    }
    
    return proximaData;
  }

  // Gerar boleto individual via InfoSimples
  async gerarBoletoIndividual(cnpj: string, periodo?: string): Promise<DASMEIResponse> {
    if (!this.infosimplesToken) {
      await this.initializeApiToken();
      if (!this.infosimplesToken) {
        return { success: false, error: 'Token InfoSimples não configurado' };
      }
    }

    const periodoFinal = periodo || this.getCurrentPeriod();
    
    try {
      const response = await fetch('https://api.infosimples.com/api/v2/consultas/receita-federal/simples-das', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cnpj: cnpj.replace(/[^\d]/g, ''), // Somente números
          token: this.infosimplesToken,
          periodo: periodoFinal,
          timeout: 600,
          ignore_site_receipt: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.code !== 200) {
        throw new Error(result.code_message || 'Erro na API InfoSimples');
      }

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  // Processar e salvar boleto no banco
  async processarESalvarBoleto(cliente: ClienteMei, apiResponse: DASMEIResponse): Promise<number | null> {
    if (!apiResponse.success || !apiResponse.data || apiResponse.data.length === 0) {
      return null;
    }

    const data = apiResponse.data[0];
    const periodo = this.getCurrentPeriod();
    const periodData = data.periodos[periodo];

    if (!periodData) {
      return null;
    }

    try {
      const dasGuia: InsertDasGuia = {
        clienteMeiId: cliente.id,
        mesAno: periodo,
        dataVencimento: new Date(periodData.dataVencimento.split('/').reverse().join('-')),
        valor: periodData.valorTotalDas,
        filePath: periodData.urlDas,
        fileName: `DAS_${cliente.cnpj}_${periodo}.pdf`,
        downloadedAt: new Date(),
        downloadStatus: 'success',
        provider: 'infosimples',
      };

      const guia = await dasmeiStorage.createDasGuia(dasGuia);
      
      // Log da operação
      await dasmeiStorage.createSystemLog({
        tipoOperacao: 'geracao_boleto',
        clienteId: cliente.id,
        status: 'success',
        detalhes: {
          periodo,
          valor: periodData.valorTotalDas,
          situacao: periodData.situacao,
          razaoSocial: data.razaoSocial,
        },
        periodo,
        operador: 'automatico'
      });

      return guia.id;
    } catch (error) {
      await dasmeiStorage.createSystemLog({
        tipoOperacao: 'geracao_boleto',
        clienteId: cliente.id,
        status: 'failed',
        detalhes: {
          periodo,
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
        },
        periodo,
        operador: 'automatico'
      });
      return null;
    }
  }

  // Automação principal - gerar todos os boletos do mês
  async executarGeracaoAutomatica(): Promise<void> {
    const agora = new Date();
    const diaGeracao = await dasmeiStorage.getAutomationSetting('dia_geracao') || '1';
    
    // Verificar se é o dia correto
    if (agora.getDate() !== parseInt(diaGeracao)) {
      return;
    }

    // Verificar se é dia útil
    if (!(await this.isDiaUtil(agora))) {
      const proximoDiaUtil = await this.getProximoDiaUtil(agora);
      console.log(`Não é dia útil. Próxima execução: ${proximoDiaUtil.toLocaleDateString()}`);
      return;
    }

    const clientesAtivos = await dasmeiStorage.getClientesMeiAtivos();
    const periodo = this.getCurrentPeriod();

    console.log(`Iniciando geração automática para ${clientesAtivos.length} clientes - Período: ${periodo}`);

    for (const cliente of clientesAtivos) {
      try {
        // Verificar se já foi gerado este mês
        const existing = await dasmeiStorage.getDasGuiaByClienteAndPeriodo(cliente.id, periodo);
        if (existing) {
          continue;
        }

        const response = await this.gerarBoletoIndividual(cliente.cnpj, periodo);
        if (response.success) {
          await this.processarESalvarBoleto(cliente, response);
          console.log(`✓ Boleto gerado para ${cliente.nome}`);
        } else {
          // Adicionar à fila de retry
          await dasmeiStorage.createRetryItem({
            tipoOperacao: 'geracao_boleto',
            clienteId: cliente.id,
            dadosOriginais: {
              cnpj: cliente.cnpj,
              periodo,
              erro: response.error,
            },
            erro: response.error,
            proximaTentativa: new Date(Date.now() + 60 * 60 * 1000) // 1 hora
          });
          console.log(`✗ Falha para ${cliente.nome}: ${response.error}`);
        }

        // Delay entre requests para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Erro processando ${cliente.nome}:`, error);
      }
    }
  }

  // Envio automático de WhatsApp
  async executarEnvioAutomatico(): Promise<void> {
    const agora = new Date();
    const diaEnvio = await dasmeiStorage.getAutomationSetting('dia_envio') || '2';
    
    if (agora.getDate() !== parseInt(diaEnvio)) {
      return;
    }

    if (!(await this.isDiaUtil(agora))) {
      return;
    }

    const periodo = this.getCurrentPeriod();
    const guiasParaEnvio = await dasmeiStorage.getDasGuiasSemEnvio(periodo);

    console.log(`Iniciando envio automático para ${guiasParaEnvio.length} guias`);

    for (const guia of guiasParaEnvio) {
      try {
        const cliente = await dasmeiStorage.getClienteMeiById(guia.clienteMeiId);
        if (!cliente || !cliente.telefone) {
          continue;
        }

        // Determinar template baseado na situação
        const templateTipo = guia.valor && parseFloat(guia.valor) > 0 ? 'boleto_disponivel' : 'boleto_pago';
        const template = await dasmeiStorage.getMessageTemplateByTipo(templateTipo);
        
        if (!template) {
          continue;
        }

        const mensagem = await this.processarTemplate(template.conteudo, {
          nome: cliente.nome,
          razaoSocial: cliente.nome,
          valor: guia.valor || '0,00',
          vencimento: guia.dataVencimento.toLocaleDateString('pt-BR'),
          urlBoleto: guia.filePath || '',
        });

        const sucesso = await this.enviarWhatsApp(cliente.telefone, mensagem);
        
        await dasmeiStorage.createEnvioLog({
          dasGuiaId: guia.id,
          tipoEnvio: 'whatsapp',
          status: sucesso ? 'sent' : 'failed',
          mensagem,
          enviadoEm: sucesso ? new Date() : undefined,
        });

        if (sucesso) {
          console.log(`✓ WhatsApp enviado para ${cliente.nome}`);
        } else {
          console.log(`✗ Falha no WhatsApp para ${cliente.nome}`);
        }

        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error(`Erro enviando WhatsApp:`, error);
      }
    }
  }

  // Lembrete de vencimento
  async executarLembreteVencimento(): Promise<void> {
    const agora = new Date();
    const diaLembrete = await dasmeiStorage.getAutomationSetting('dia_lembrete') || '20';
    
    if (agora.getDate() !== parseInt(diaLembrete)) {
      return;
    }

    if (!(await this.isDiaUtil(agora))) {
      return;
    }

    const periodo = this.getCurrentPeriod();
    const guiasProximasVencimento = await dasmeiStorage.getDasGuiasProximasVencimento(periodo);

    console.log(`Enviando lembretes para ${guiasProximasVencimento.length} clientes`);

    for (const guia of guiasProximasVencimento) {
      try {
        const cliente = await dasmeiStorage.getClienteMeiById(guia.clienteMeiId);
        if (!cliente || !cliente.telefone) {
          continue;
        }

        const template = await dasmeiStorage.getMessageTemplateByTipo('lembrete_vencimento');
        if (!template) {
          continue;
        }

        const mensagem = await this.processarTemplate(template.conteudo, {
          nome: cliente.nome,
          valor: guia.valor || '0,00',
          vencimento: guia.dataVencimento.toLocaleDateString('pt-BR'),
        });

        const sucesso = await this.enviarWhatsApp(cliente.telefone, mensagem);
        
        await dasmeiStorage.createEnvioLog({
          dasGuiaId: guia.id,
          tipoEnvio: 'lembrete_whatsapp',
          status: sucesso ? 'sent' : 'failed',
          mensagem,
          enviadoEm: sucesso ? new Date() : undefined,
        });

        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error(`Erro enviando lembrete:`, error);
      }
    }
  }

  // Processar template com variáveis
  private async processarTemplate(template: string, variaveis: Record<string, string>): Promise<string> {
    let mensagem = template;
    
    for (const [chave, valor] of Object.entries(variaveis)) {
      const regex = new RegExp(`{${chave}}`, 'g');
      mensagem = mensagem.replace(regex, valor);
    }
    
    return mensagem;
  }

  // Enviar WhatsApp via Evolution API - VERSÃO CORRIGIDA
  private async enviarWhatsApp(numero: string, mensagem: string): Promise<boolean> {
    try {
      console.log(`📱 Tentando enviar WhatsApp para ${numero}`);
      
      // Primeiro, tentar usar a configuração da nova estrutura
      const configWhatsApp = await dasmeiStorage.getApiConfigurationByType('whatsapp_evolution');
      if (configWhatsApp && configWhatsApp.isActive) {
        const credentials = typeof configWhatsApp.credentials === 'string' 
          ? JSON.parse(configWhatsApp.credentials) 
          : configWhatsApp.credentials;
        
        const { serverUrl, apiKey, instance } = credentials;
        const url = `${serverUrl}/message/sendText/${instance}`;
        
        console.log(`🔗 URL de envio: ${url}`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey,
          },
          body: JSON.stringify({
            number: numero,
            text: mensagem,
          }),
        });
        
        const result = await response.json();
        console.log(`📡 Resposta WhatsApp:`, { status: response.status, result });
        
        if (response.ok) {
          console.log(`✅ WhatsApp enviado com sucesso para ${numero}`);
          return true;
        } else {
          console.error(`❌ Erro no envio WhatsApp:`, result);
          return false;
        }
      }
      
      // Fallback para o método antigo
      const instancia = await dasmeiStorage.getEvolutionInstanceAtiva();
      if (!instancia) {
        console.error('❌ Nenhuma instância WhatsApp configurada');
        return false;
      }

      const response = await fetch(`${instancia.serverUrl}/message/sendText/${instancia.instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': instancia.token,
        },
        body: JSON.stringify({
          number: numero,
          text: mensagem,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Erro enviando WhatsApp:', error);
      return false;
    }
  }

  // Adicionar item ao retry center
  private async adicionarAoRetry(operacao: string, clienteId: number, dados: any): Promise<void> {
    const proximaTentativa = new Date();
    proximaTentativa.setHours(proximaTentativa.getHours() + 1);

    await dasStorage.createRetryItem({
      tipoOperacao: operacao,
      clienteId,
      dadosOriginals: dados,
      erro: dados.erro || 'Erro desconhecido',
      proximaTentativa,
    });
  }

  // Log de operação
  private async logOperacao(
    tipo: string, 
    clienteId: number, 
    status: 'success' | 'failed' | 'pending', 
    detalhes: any
  ): Promise<void> {
    await dasStorage.createSystemLog({
      tipoOperacao: tipo,
      clienteId,
      status,
      detalhes,
      periodo: this.getCurrentPeriod(),
      operador: 'automatico',
    });
  }

  // Processar fila de retry
  async processarFilaRetry(): Promise<void> {
    const itens = await dasStorage.getRetryItemsPendentes();
    
    for (const item of itens) {
      if (item.tentativas >= item.maxTentativas) {
        await dasStorage.updateRetryItem(item.id, { status: 'failed' });
        continue;
      }

      try {
        await dasStorage.updateRetryItem(item.id, { 
          status: 'processing',
          tentativas: item.tentativas + 1,
        });

        let sucesso = false;

        if (item.tipoOperacao === 'geracao_boleto') {
          const cliente = await dasStorage.getClienteMeiById(item.clienteId);
          if (cliente) {
            const response = await this.gerarBoletoIndividual(cliente.cnpj, item.dadosOriginals.periodo);
            if (response.success) {
              await this.processarESalvarBoleto(cliente, response);
              sucesso = true;
            }
          }
        }

        await dasStorage.updateRetryItem(item.id, { 
          status: sucesso ? 'success' : 'pending',
          proximaTentativa: sucesso ? null : new Date(Date.now() + 3600000), // +1 hora
        });

      } catch (error) {
        console.error(`Erro processando retry ${item.id}:`, error);
        await dasStorage.updateRetryItem(item.id, { 
          status: 'pending',
          proximaTentativa: new Date(Date.now() + 3600000),
        });
      }
    }
  }
}

export const dasmeiAutomation = new DASMEIAutomationService();
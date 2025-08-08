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
  private infosimplesToken: string = 'jPxhuUwoTl474Vg1QrYIiktfvFFJplCb2V9zxXbG';

  constructor() {
    console.log('🔑 Token InfoSimples configurado');
  }

  private async initializeApiToken() {
    try {
      console.log('🔑 Inicializando token InfoSimples...');
      if (!this.infosimplesToken) {
        this.infosimplesToken = 'jPxhuUwoTl474Vg1QrYIiktfvFFJplCb2V9zxXbG';
        console.log('🔑 Token InfoSimples configurado via fallback');
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
    // Sem feriados implementados ainda
    const feriados = [];
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

  // Gerar guia individual via InfoSimples
  async gerarGuiaIndividual(cnpj: string, periodo?: string): Promise<DASMEIResponse> {
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

  // Processar e salvar guia no banco
  async processarESalvarGuia(cliente: ClienteMei, apiResponse: DASMEIResponse): Promise<number | null> {
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
        tipoOperacao: 'geracao_guia',
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
        tipoOperacao: 'geracao_guia',
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

  // Automação principal - gerar todas as guias do mês
  async executarGeracaoAutomatica(): Promise<void> {
    try {
      console.log('🚀 Iniciando geração automática de DAS-MEI...');
      
      if (!this.infosimplesToken) {
        this.infosimplesToken = 'jPxhuUwoTl474Vg1QrYIiktfvFFJplCb2V9zxXbG';
        console.log('🔑 Token InfoSimples configurado durante execução');
      }

      const periodo = this.getCurrentPeriod();
      console.log(`📅 Gerando DAS para período: ${periodo}`);
      
      const clientes = await dasmeiStorage.getClientesMeiAtivos();
      console.log(`👥 Total de clientes: ${clientes.length}`);

      if (clientes.length === 0) {
        console.log('⚠️ Nenhum cliente encontrado');
        return;
      }

      let gerados = 0;
      let erros = 0;

      for (const cliente of clientes) {
        try {
          console.log(`🔄 Processando cliente: ${cliente.nome} (${cliente.cnpj})`);
          
          // Verificar se já existe guia para este período
          const guiaExistente = await dasmeiStorage.getDasGuiaByClienteAndPeriodo(cliente.id, periodo);
          if (guiaExistente) {
            console.log(`ℹ️ Guia já existe para ${cliente.nome} no período ${periodo}`);
            continue;
          }

          const response = await this.gerarGuiaIndividual(cliente.cnpj, periodo);
          
          if (response.success && response.data && response.data.length > 0) {
            const dasData = response.data[0];
            const periodoData = dasData.periodos[periodo];
            
            if (periodoData) {
              await dasmeiStorage.createDasGuia({
                clienteMeiId: cliente.id,
                mesAno: periodo,
                valor: periodoData.valorTotalDas,
                dataVencimento: periodoData.dataVencimento ? new Date(periodoData.dataVencimento) : new Date(),
                status: 'generated',
                filePath: periodoData.urlDas,
              });

              await this.logOperacao('geracao_guia', cliente.id, 'success', {
                periodo,
                valor: periodoData.valorTotalDas,
                url: periodoData.urlDas,
              });

              console.log(`✅ Guia gerada para ${cliente.nome} - Valor: R$ ${periodoData.valorTotalDas}`);
              gerados++;
            }
          } else {
            console.log(`❌ Erro na geração para ${cliente.nome}: ${response.error}`);
            erros++;
            
            await this.adicionarAoRetry('geracao_guia', cliente.id, {
              periodo,
              erro: response.error,
            });

            await this.logOperacao('geracao_guia', cliente.id, 'failed', {
              periodo,
              erro: response.error,
            });
          }

          // Delay entre requisições para não sobrecarregar a API
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`❌ Erro gerando guia para ${cliente.nome}:`, error);
          erros++;
          
          await this.adicionarAoRetry('geracao_guia', cliente.id, {
            periodo,
            erro: error instanceof Error ? error.message : 'Erro desconhecido',
          });
        }
      }

      console.log(`🎯 Geração concluída: ${gerados} sucessos, ${erros} erros`);
    } catch (error) {
      console.error('❌ Erro fatal na geração automática:', error);
      throw error;
    }
  }

  // Envio automático de WhatsApp
  async executarEnvioAutomatico(): Promise<void> {
    try {
      console.log('📧 Iniciando envio automático de mensagens...');

      const periodo = this.getCurrentPeriod();
      console.log(`📅 Enviando mensagens para período: ${periodo}`);
      
      const guiasParaEnvio = await dasmeiStorage.getDasGuiasSemEnvio(periodo);
      console.log(`📋 Total de guias para envio: ${guiasParaEnvio.length}`);

      if (guiasParaEnvio.length === 0) {
        console.log('⚠️ Nenhuma guia encontrada para envio');
        return;
      }

      let enviados = 0;
      let erros = 0;

      for (const guia of guiasParaEnvio) {
        try {
          const cliente = await dasmeiStorage.getClienteMeiById(guia.clienteMeiId);
          if (!cliente) {
            console.log(`❌ Cliente não encontrado para guia ${guia.id}`);
            continue;
          }

          if (!cliente.telefone) {
            console.log(`⚠️ Cliente ${cliente.nome} não possui telefone cadastrado`);
            continue;
          }

          console.log(`📱 Enviando WhatsApp para ${cliente.nome} (${cliente.telefone})`);

          // Determinar template baseado na situação
          const templateTipo = guia.valor && parseFloat(guia.valor) > 0 ? 'boleto_disponivel' : 'boleto_pago';
          const template = await dasmeiStorage.getMessageTemplateByTipo(templateTipo);
          
          if (!template) {
            console.log(`⚠️ Template ${templateTipo} não encontrado`);
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
            console.log(`✅ WhatsApp enviado para ${cliente.nome}`);
            enviados++;
          } else {
            console.log(`❌ Falha no WhatsApp para ${cliente.nome}`);
            erros++;
          }

          await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (error) {
          console.error(`❌ Erro enviando WhatsApp:`, error);
          erros++;
        }
      }

      console.log(`🎯 Envio concluído: ${enviados} sucessos, ${erros} erros`);
    } catch (error) {
      console.error('❌ Erro fatal no envio automático:', error);
      throw error;
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
      
      // Usar configuração manual do WhatsApp
      const configWhatsApp = {
        isActive: true,
        credentials: {
          apiKey: 'D041F72DEA1C-4319-ACC3-88532EB9E7A5',
          instance: 'ADRIANA-PROSPERAR',
          serverUrl: 'https://apiw.aquiprospera.com.br'
        }
      };
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

    await dasmeiStorage.createRetryItem({
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
    await dasmeiStorage.createSystemLog({
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
    const itens = await dasmeiStorage.getRetryItemsPendentes();
    
    for (const item of itens) {
      if (item.tentativas >= item.maxTentativas) {
        await dasmeiStorage.updateRetryItem(item.id, { status: 'failed' });
        continue;
      }

      try {
        await dasmeiStorage.updateRetryItem(item.id, { 
          status: 'processing',
          tentativas: item.tentativas + 1,
        });

        let sucesso = false;

        if (item.tipoOperacao === 'geracao_guia') {
          const cliente = await dasmeiStorage.getClienteMeiById(item.clienteId);
          if (cliente) {
            const response = await this.gerarGuiaIndividual(cliente.cnpj, item.dadosOriginals.periodo);
            if (response.success) {
              await this.processarESalvarGuia(cliente, response);
              sucesso = true;
            }
          }
        }

        await dasmeiStorage.updateRetryItem(item.id, { 
          status: sucesso ? 'success' : 'pending',
          proximaTentativa: sucesso ? null : new Date(Date.now() + 3600000), // +1 hora
        });

      } catch (error) {
        console.error(`Erro processando retry ${item.id}:`, error);
        await dasmeiStorage.updateRetryItem(item.id, { 
          status: 'pending',
          proximaTentativa: new Date(Date.now() + 3600000),
        });
      }
    }
  }
}

export const dasmeiAutomationService = new DASMEIAutomationService();
export const dasmeiAutomation = dasmeiAutomationService;
export default dasmeiAutomationService;
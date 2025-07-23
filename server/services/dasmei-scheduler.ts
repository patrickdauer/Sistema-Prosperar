import cron from 'node-cron';
import { db } from '../db';
import { clientesMeiExpanded, boletosGerados, enviosWhatsapp, systemLogs } from '@shared/dasmei-schema';
import { InfoSimplesProvider } from './api-providers/infosimples-provider';
import { EvolutionProvider } from './api-providers/evolution-provider';
import { eq, and } from 'drizzle-orm';
import { format, isWeekend, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

class DASMEIScheduler {
  private isRunning = false;
  private providers: {
    das?: InfoSimplesProvider;
    whatsapp?: EvolutionProvider;
  } = {};

  constructor() {
    this.initializeProviders();
  }

  private async initializeProviders() {
    // Carregar configurações das APIs do banco
    // Por enquanto, usar configurações hardcoded para teste
    this.providers.das = new InfoSimplesProvider(process.env.INFOSIMPLES_TOKEN || '');
  }

  start() {
    if (this.isRunning) return;
    
    console.log('🚀 Iniciando scheduler DASMEI...');
    
    // Dia 1 de cada mês - Gerar boletos
    cron.schedule('0 8 1 * *', () => {
      this.gerarBoletosMensais();
    });
    
    // Dia 2 de cada mês - Enviar boletos (ou próximo dia útil)
    cron.schedule('0 9 2 * *', () => {
      this.enviarBoletosMensais();
    });
    
    // Dia 20 de cada mês - Enviar lembretes
    cron.schedule('0 10 20 * *', () => {
      this.enviarLembretesMensais();
    });
    
    // Verificação diária para dias úteis
    cron.schedule('0 9 * * 1-5', () => {
      this.verificarPendencias();
    });
    
    this.isRunning = true;
    console.log('✅ Scheduler DASMEI iniciado com sucesso');
  }

  stop() {
    this.isRunning = false;
    console.log('⏹️ Scheduler DASMEI parado');
  }

  private async gerarBoletosMensais() {
    console.log('📋 Iniciando geração mensal de boletos DASMEI...');
    
    try {
      // Buscar todos os clientes MEI ativos
      const clientes = await db
        .select()
        .from(clientesMeiExpanded)
        .where(eq(clientesMeiExpanded.ativoAutomacao, true));

      const periodo = this.getPeriodoAnterior();
      
      for (const cliente of clientes) {
        await this.gerarBoletoCliente(cliente.id, cliente.cnpj, periodo);
        // Delay entre requisições para não sobrecarregar a API
        await this.delay(2000);
      }
      
      await this.logOperacao('gerar_boletos_mensais', null, 'success', {
        periodo,
        totalClientes: clientes.length
      });
      
    } catch (error) {
      console.error('Erro na geração mensal de boletos:', error);
      await this.logOperacao('gerar_boletos_mensais', null, 'error', {
        erro: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  private async enviarBoletosMensais() {
    if (!this.isDiaUtil()) {
      console.log('📅 Não é dia útil, adiando envio de boletos...');
      return;
    }
    
    console.log('📤 Iniciando envio mensal de boletos DASMEI...');
    
    try {
      const periodo = this.getPeriodoAnterior();
      
      // Buscar boletos gerados no período atual que ainda não foram enviados
      const boletos = await db
        .select({
          boleto: boletosGerados,
          cliente: clientesMeiExpanded
        })
        .from(boletosGerados)
        .innerJoin(clientesMeiExpanded, eq(boletosGerados.clienteId, clientesMeiExpanded.id))
        .where(
          and(
            eq(boletosGerados.periodo, periodo),
            eq(boletosGerados.statusApi, 'success')
          )
        );
      
      for (const { boleto, cliente } of boletos) {
        await this.enviarBoletoWhatsapp(boleto, cliente);
        await this.delay(3000); // Delay entre envios
      }
      
    } catch (error) {
      console.error('Erro no envio mensal de boletos:', error);
    }
  }

  private async enviarLembretesMensais() {
    console.log('🔔 Iniciando envio de lembretes de vencimento...');
    
    try {
      const periodo = this.getPeriodoAnterior();
      
      // Buscar boletos que vencem em breve e ainda não foram pagos
      const boletos = await db
        .select({
          boleto: boletosGerados,
          cliente: clientesMeiExpanded
        })
        .from(boletosGerados)
        .innerJoin(clientesMeiExpanded, eq(boletosGerados.clienteId, clientesMeiExpanded.id))
        .where(
          and(
            eq(boletosGerados.periodo, periodo),
            eq(boletosGerados.situacao, 'Devedor')
          )
        );
      
      for (const { boleto, cliente } of boletos) {
        await this.enviarLembreteWhatsapp(boleto, cliente);
        await this.delay(3000);
      }
      
    } catch (error) {
      console.error('Erro no envio de lembretes:', error);
    }
  }

  private async gerarBoletoCliente(clienteId: number, cnpj: string, periodo: string) {
    if (!this.providers.das) {
      throw new Error('Provider DAS não configurado');
    }
    
    try {
      const result = await this.providers.das.generateDas(cnpj, periodo);
      
      if (result.success && result.data) {
        await db.insert(boletosGerados).values({
          clienteId,
          periodo,
          urlBoleto: result.data.urlDas,
          valor: result.data.valorTotal,
          situacao: result.data.situacao,
          dataVencimento: new Date(result.data.dataVencimento),
          statusApi: 'success',
          provider: 'infosimples'
        });
        
        await this.logOperacao('gerar_boleto', clienteId, 'success', {
          periodo,
          cnpj,
          valor: result.data.valorTotal,
          situacao: result.data.situacao
        });
      } else {
        await db.insert(boletosGerados).values({
          clienteId,
          periodo,
          statusApi: 'error',
          erroApi: result.error,
          provider: 'infosimples'
        });
        
        await this.logOperacao('gerar_boleto', clienteId, 'error', {
          periodo,
          cnpj,
          erro: result.error
        });
      }
    } catch (error) {
      console.error(`Erro ao gerar boleto para cliente ${clienteId}:`, error);
    }
  }

  private async enviarBoletoWhatsapp(boleto: any, cliente: any) {
    if (!cliente.telefone) {
      console.log(`Cliente ${cliente.razaoSocial} não possui telefone cadastrado`);
      return;
    }
    
    const tipoMensagem = boleto.situacao === 'Pago' ? 'boleto_pago' : 'boleto_disponivel';
    const mensagem = this.gerarMensagem(tipoMensagem, {
      nome: cliente.razaoSocial,
      valor: boleto.valor,
      vencimento: format(new Date(boleto.dataVencimento), 'dd/MM/yyyy', { locale: ptBR }),
      razao_social: cliente.razaoSocial,
      url_boleto: boleto.urlBoleto
    });
    
    // Implementar envio via Evolution API
    // Por enquanto, apenas registrar o log
    await db.insert(enviosWhatsapp).values({
      clienteId: cliente.id,
      boletoId: boleto.id,
      tipoMensagem,
      statusEnvio: 'pending'
    });
  }

  private async enviarLembreteWhatsapp(boleto: any, cliente: any) {
    if (!cliente.telefone) return;
    
    const mensagem = this.gerarMensagem('lembrete_vencimento', {
      nome: cliente.razaoSocial,
      valor: boleto.valor,
      vencimento: format(new Date(boleto.dataVencimento), 'dd/MM/yyyy', { locale: ptBR }),
      razao_social: cliente.razaoSocial
    });
    
    await db.insert(enviosWhatsapp).values({
      clienteId: cliente.id,
      boletoId: boleto.id,
      tipoMensagem: 'lembrete_vencimento',
      statusEnvio: 'pending'
    });
  }

  private gerarMensagem(tipo: string, variaveis: any): string {
    const templates = {
      boleto_disponivel: `🏦 *Boleto DAS-MEI Disponível*\n\nOlá {nome}!\n\nSeu boleto DAS-MEI está disponível:\n\n💰 Valor: R$ {valor}\n📅 Vencimento: {vencimento}\n\n🔗 Link para download:\n{url_boleto}\n\n_Mensagem automática - Prosperar Contabilidade_`,
      boleto_pago: `✅ *DAS-MEI Quitado*\n\nOlá {nome}!\n\nSeu DAS-MEI já está quitado!\n\n💰 Valor: R$ {valor}\n📅 Vencimento: {vencimento}\n\n_Mensagem automática - Prosperar Contabilidade_`,
      lembrete_vencimento: `⚠️ *Lembrete: DAS-MEI Vence Hoje*\n\nOlá {nome}!\n\nLembramos que seu DAS-MEI vence hoje:\n\n💰 Valor: R$ {valor}\n📅 Vencimento: {vencimento}\n\nNão esqueça de efetuar o pagamento!\n\n_Mensagem automática - Prosperar Contabilidade_`
    };
    
    let mensagem = templates[tipo as keyof typeof templates] || '';
    
    // Substituir variáveis
    Object.entries(variaveis).forEach(([key, value]) => {
      mensagem = mensagem.replace(new RegExp(`{${key}}`, 'g'), String(value));
    });
    
    return mensagem;
  }

  private getPeriodoAnterior(): string {
    const now = new Date();
    const mesAnterior = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const anoAnterior = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    return `${anoAnterior}${String(mesAnterior + 1).padStart(2, '0')}`;
  }

  private isDiaUtil(): boolean {
    const hoje = new Date();
    return !isWeekend(hoje);
  }

  private async verificarPendencias() {
    // Verificar se há envios pendentes para processar
    console.log('🔍 Verificando pendências...');
  }

  private async logOperacao(tipo: string, clienteId: number | null, status: string, detalhes: any) {
    await db.insert(systemLogs).values({
      tipoOperacao: tipo,
      clienteId,
      status,
      detalhes
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const dasmeiScheduler = new DASMEIScheduler();
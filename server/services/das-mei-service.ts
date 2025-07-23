import { db } from '../db';
import { 
  clientesMei, 
  dasGuias, 
  envioLogs, 
  apiConfigurations,
  programacaoEnvios,
  type ClienteMei,
  type InsertClienteMei,
  type DasGuia,
  type InsertDasGuia,
  type EnvioLog,
  type InsertEnvioLog,
  type ApiConfiguration,
  type InsertApiConfiguration
} from '@shared/das-schema';
import { eq, and, gte, lte, desc, count, sql } from 'drizzle-orm';
import { infosimplesProvider } from './api-providers/infosimples-provider';
import { whatsappService } from './whatsapp-service';
import { templateService } from './template-service';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

class DASMeiService {
  // Dashboard e estatísticas
  async getDashboardStats() {
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);
    const startOfLastMonth = startOfMonth(subMonths(now, 1));
    
    // Clientes ativos
    const [clientesAtivos] = await db
      .select({ count: count() })
      .from(clientesMei)
      .where(eq(clientesMei.isActive, true));
    
    // Novos clientes este mês
    const [novosClientesMes] = await db
      .select({ count: count() })
      .from(clientesMei)
      .where(and(
        eq(clientesMei.isActive, true),
        gte(clientesMei.createdAt, startOfCurrentMonth)
      ));
    
    // Boletos gerados este mês
    const [boletosGeradosMes] = await db
      .select({ count: count() })
      .from(dasGuias)
      .where(gte(dasGuias.createdAt, startOfCurrentMonth));
    
    // Taxa de sucesso boletos
    const [boletosComSucesso] = await db
      .select({ count: count() })
      .from(dasGuias)
      .where(and(
        gte(dasGuias.createdAt, startOfCurrentMonth),
        eq(dasGuias.downloadStatus, 'success')
      ));
    
    // Mensagens enviadas este mês
    const [mensagensEnviadasMes] = await db
      .select({ count: count() })
      .from(envioLogs)
      .where(gte(envioLogs.createdAt, startOfCurrentMonth));
    
    // Taxa de sucesso mensagens
    const [mensagensComSucesso] = await db
      .select({ count: count() })
      .from(envioLogs)
      .where(and(
        gte(envioLogs.createdAt, startOfCurrentMonth),
        eq(envioLogs.status, 'sent')
      ));
    
    const taxaSucessoBoletos = boletosGeradosMes.count > 0 
      ? Math.round((boletosComSucesso.count / boletosGeradosMes.count) * 100)
      : 0;
    
    const taxaSucessoMensagens = mensagensEnviadasMes.count > 0
      ? Math.round((mensagensComSucesso.count / mensagensEnviadasMes.count) * 100)
      : 0;
    
    return {
      clientesAtivos: clientesAtivos.count,
      novosClientesMes: novosClientesMes.count,
      boletosGeradosMes: boletosGeradosMes.count,
      taxaSucessoBoletos,
      mensagensEnviadasMes: mensagensEnviadasMes.count,
      taxaSucessoMensagens
    };
  }
  
  // Gestão de clientes MEI
  async getClientesMei() {
    return await db
      .select()
      .from(clientesMei)
      .orderBy(desc(clientesMei.createdAt));
  }
  
  async createClienteMei(data: InsertClienteMei): Promise<ClienteMei> {
    const [cliente] = await db
      .insert(clientesMei)
      .values(data)
      .returning();
    
    await this.logActivity({
      tipo: 'cliente_criado',
      descricao: `Cliente MEI criado: ${cliente.nome} (${cliente.cnpj})`,
      clienteId: cliente.id,
      status: 'success'
    });
    
    return cliente;
  }
  
  async updateClienteMei(id: number, data: Partial<InsertClienteMei>): Promise<ClienteMei> {
    const [cliente] = await db
      .update(clientesMei)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(clientesMei.id, id))
      .returning();
    
    await this.logActivity({
      tipo: 'cliente_atualizado',
      descricao: `Cliente MEI atualizado: ${cliente.nome}`,
      clienteId: cliente.id,
      status: 'success'
    });
    
    return cliente;
  }
  
  async deleteClienteMei(id: number): Promise<void> {
    const [cliente] = await db
      .select()
      .from(clientesMei)
      .where(eq(clientesMei.id, id));
    
    await db
      .delete(clientesMei)
      .where(eq(clientesMei.id, id));
    
    await this.logActivity({
      tipo: 'cliente_deletado',
      descricao: `Cliente MEI deletado: ${cliente?.nome}`,
      clienteId: id,
      status: 'success'
    });
  }
  
  // Gestão de boletos
  async getBoletos(filters: any = {}) {
    let query = db
      .select({
        id: dasGuias.id,
        clienteMeiId: dasGuias.clienteMeiId,
        mesAno: dasGuias.mesAno,
        dataVencimento: dasGuias.dataVencimento,
        valor: dasGuias.valor,
        downloadStatus: dasGuias.downloadStatus,
        downloadError: dasGuias.downloadError,
        provider: dasGuias.provider,
        createdAt: dasGuias.createdAt,
        clienteNome: clientesMei.nome,
        clienteCnpj: clientesMei.cnpj
      })
      .from(dasGuias)
      .leftJoin(clientesMei, eq(dasGuias.clienteMeiId, clientesMei.id))
      .orderBy(desc(dasGuias.createdAt));
    
    return await query;
  }
  
  async generateBoletos(params: { clienteIds?: number[]; periodo?: string; manual?: boolean }) {
    const { clienteIds, periodo, manual = false } = params;
    
    // Determinar período (formato YYYYMM)
    const targetPeriod = periodo || this.getCurrentPeriod();
    
    // Buscar clientes
    let clientes;
    if (clienteIds && clienteIds.length > 0) {
      clientes = await db
        .select()
        .from(clientesMei)
        .where(and(
          eq(clientesMei.isActive, true),
          sql`${clientesMei.id} = ANY(${clienteIds})`
        ));
    } else {
      clientes = await db
        .select()
        .from(clientesMei)
        .where(eq(clientesMei.isActive, true));
    }
    
    const results = {
      total: clientes.length,
      success: 0,
      errors: 0,
      details: [] as any[]
    };
    
    // Buscar API ativa para DAS
    const activeApi = await this.getActiveApiByType('das_provider');
    if (!activeApi) {
      throw new Error('Nenhuma API ativa encontrada para geração de DAS');
    }
    
    for (const cliente of clientes) {
      try {
        // Verificar se já existe boleto para este período
        const existingBoleto = await db
          .select()
          .from(dasGuias)
          .where(and(
            eq(dasGuias.clienteMeiId, cliente.id),
            eq(dasGuias.mesAno, targetPeriod)
          ))
          .limit(1);
        
        if (existingBoleto.length > 0 && !manual) {
          results.details.push({
            cliente: cliente.nome,
            status: 'skipped',
            message: 'Boleto já existe para este período'
          });
          continue;
        }
        
        // Gerar boleto via API
        const boletoData = await infosimplesProvider.generateDAS({
          cnpj: cliente.cnpj,
          periodo: targetPeriod,
          token: activeApi.credentials.token
        });
        
        // Salvar no banco
        const [boleto] = await db
          .insert(dasGuias)
          .values({
            clienteMeiId: cliente.id,
            mesAno: targetPeriod,
            dataVencimento: new Date(boletoData.dataVencimento),
            valor: boletoData.valor,
            filePath: boletoData.filePath,
            fileName: boletoData.fileName,
            downloadedAt: new Date(),
            downloadStatus: 'success',
            provider: activeApi.name
          })
          .returning();
        
        results.success++;
        results.details.push({
          cliente: cliente.nome,
          status: 'success',
          boletoId: boleto.id
        });
        
        await this.logActivity({
          tipo: 'boleto_gerado',
          descricao: `Boleto gerado para ${cliente.nome} - período ${targetPeriod}`,
          clienteId: cliente.id,
          status: 'success',
          metadata: { boletoId: boleto.id, periodo: targetPeriod }
        });
        
      } catch (error) {
        results.errors++;
        results.details.push({
          cliente: cliente.nome,
          status: 'error',
          message: error.message
        });
        
        await this.logActivity({
          tipo: 'boleto_erro',
          descricao: `Erro ao gerar boleto para ${cliente.nome}: ${error.message}`,
          clienteId: cliente.id,
          status: 'error',
          metadata: { periodo: targetPeriod, error: error.message }
        });
      }
    }
    
    return results;
  }
  
  async downloadBoleto(boletoId: number): Promise<string> {
    const [boleto] = await db
      .select()
      .from(dasGuias)
      .where(eq(dasGuias.id, boletoId));
    
    if (!boleto || !boleto.filePath) {
      throw new Error('Boleto não encontrado ou arquivo não disponível');
    }
    
    return boleto.filePath;
  }
  
  // Gestão de envios
  async getEnvios(filters: any = {}) {
    return await db
      .select({
        id: envioLogs.id,
        dasGuiaId: envioLogs.dasGuiaId,
        tipoEnvio: envioLogs.tipoEnvio,
        status: envioLogs.status,
        mensagem: envioLogs.mensagem,
        enviadoEm: envioLogs.enviadoEm,
        tentativas: envioLogs.tentativas,
        ultimoErro: envioLogs.ultimoErro,
        createdAt: envioLogs.createdAt,
        clienteNome: clientesMei.nome,
        clienteCnpj: clientesMei.cnpj
      })
      .from(envioLogs)
      .leftJoin(dasGuias, eq(envioLogs.dasGuiaId, dasGuias.id))
      .leftJoin(clientesMei, eq(dasGuias.clienteMeiId, clientesMei.id))
      .orderBy(desc(envioLogs.createdAt));
  }
  
  async sendMessages(params: { boletoIds?: number[]; templateId: number; manual?: boolean }) {
    const { boletoIds, templateId, manual = false } = params;
    
    // Buscar template
    const template = await templateService.getTemplate(templateId);
    if (!template) {
      throw new Error('Template não encontrado');
    }
    
    // Buscar boletos
    let boletos;
    if (boletoIds && boletoIds.length > 0) {
      boletos = await db
        .select({
          id: dasGuias.id,
          clienteMeiId: dasGuias.clienteMeiId,
          mesAno: dasGuias.mesAno,
          dataVencimento: dasGuias.dataVencimento,
          valor: dasGuias.valor,
          clienteNome: clientesMei.nome,
          clienteTelefone: clientesMei.telefone,
          clienteEmail: clientesMei.email
        })
        .from(dasGuias)
        .leftJoin(clientesMei, eq(dasGuias.clienteMeiId, clientesMei.id))
        .where(and(
          sql`${dasGuias.id} = ANY(${boletoIds})`,
          eq(dasGuias.downloadStatus, 'success')
        ));
    } else {
      // Buscar boletos pendentes de envio
      boletos = await db
        .select({
          id: dasGuias.id,
          clienteMeiId: dasGuias.clienteMeiId,
          mesAno: dasGuias.mesAno,
          dataVencimento: dasGuias.dataVencimento,
          valor: dasGuias.valor,
          clienteNome: clientesMei.nome,
          clienteTelefone: clientesMei.telefone,
          clienteEmail: clientesMei.email
        })
        .from(dasGuias)
        .leftJoin(clientesMei, eq(dasGuias.clienteMeiId, clientesMei.id))
        .leftJoin(envioLogs, eq(dasGuias.id, envioLogs.dasGuiaId))
        .where(and(
          eq(dasGuias.downloadStatus, 'success'),
          eq(clientesMei.isActive, true),
          sql`${envioLogs.id} IS NULL OR ${envioLogs.status} = 'failed'`
        ));
    }
    
    const results = {
      total: boletos.length,
      success: 0,
      errors: 0,
      details: [] as any[]
    };
    
    for (const boleto of boletos) {
      try {
        // Renderizar mensagem com variáveis
        const mensagem = this.renderTemplate(template.conteudo, {
          nome: boleto.clienteNome,
          valor: boleto.valor,
          vencimento: format(new Date(boleto.dataVencimento), 'dd/MM/yyyy'),
          periodo: boleto.mesAno
        });
        
        // Enviar via WhatsApp
        if (boleto.clienteTelefone) {
          await whatsappService.sendMessage({
            to: boleto.clienteTelefone,
            message: mensagem
          });
          
          // Registrar envio
          await db
            .insert(envioLogs)
            .values({
              dasGuiaId: boleto.id,
              tipoEnvio: 'whatsapp',
              status: 'sent',
              mensagem,
              enviadoEm: new Date(),
              tentativas: 1
            });
          
          results.success++;
          results.details.push({
            cliente: boleto.clienteNome,
            status: 'success',
            canal: 'whatsapp'
          });
        } else {
          throw new Error('Cliente não possui telefone cadastrado');
        }
        
      } catch (error) {
        results.errors++;
        results.details.push({
          cliente: boleto.clienteNome,
          status: 'error',
          message: error.message
        });
        
        // Registrar erro
        await db
          .insert(envioLogs)
          .values({
            dasGuiaId: boleto.id,
            tipoEnvio: 'whatsapp',
            status: 'failed',
            mensagem: '',
            tentativas: 1,
            ultimoErro: error.message
          });
      }
    }
    
    return results;
  }
  
  // Configurações de APIs
  async getApiConfigurations() {
    return await db
      .select()
      .from(apiConfigurations)
      .orderBy(desc(apiConfigurations.createdAt));
  }
  
  async createApiConfiguration(data: InsertApiConfiguration, userId: number) {
    const [config] = await db
      .insert(apiConfigurations)
      .values({
        ...data,
        createdBy: userId,
        updatedBy: userId
      })
      .returning();
    
    await this.logActivity({
      tipo: 'api_configurada',
      descricao: `API configurada: ${config.name} (${config.type})`,
      status: 'success',
      metadata: { apiId: config.id, type: config.type }
    });
    
    return config;
  }
  
  async updateApiConfiguration(id: number, data: Partial<InsertApiConfiguration>, userId: number) {
    const [config] = await db
      .update(apiConfigurations)
      .set({
        ...data,
        updatedBy: userId,
        updatedAt: new Date()
      })
      .where(eq(apiConfigurations.id, id))
      .returning();
    
    return config;
  }
  
  async testApiConfiguration(id: number) {
    const [config] = await db
      .select()
      .from(apiConfigurations)
      .where(eq(apiConfigurations.id, id));
    
    if (!config) {
      throw new Error('Configuração não encontrada');
    }
    
    // Testar baseado no tipo
    switch (config.type) {
      case 'das_provider':
        return await infosimplesProvider.testConnection(config.credentials);
      case 'whatsapp':
        return await whatsappService.testConnection(config.credentials);
      default:
        throw new Error('Tipo de API não suportado para teste');
    }
  }
  
  // Sistema de logs
  async getLogs(filters: any = {}) {
    // Implementar busca de logs com filtros
    return [];
  }
  
  async logActivity(data: {
    tipo: string;
    descricao: string;
    clienteId?: number;
    status: 'success' | 'error' | 'warning';
    metadata?: any;
  }) {
    // Implementar sistema de logs
    console.log('LOG:', data);
  }
  
  // Sistema de retry
  async getRetryQueue() {
    // Buscar itens com falha que precisam de retry
    const boletosFalhados = await db
      .select()
      .from(dasGuias)
      .where(eq(dasGuias.downloadStatus, 'failed'));
    
    const enviosFalhados = await db
      .select()
      .from(envioLogs)
      .where(eq(envioLogs.status, 'failed'));
    
    return [
      ...boletosFalhados.map(b => ({ ...b, type: 'boleto' })),
      ...enviosFalhados.map(e => ({ ...e, type: 'envio' }))
    ];
  }
  
  async retryFailed(params: { type: 'boletos' | 'envios'; ids?: number[] }) {
    const { type, ids } = params;
    
    if (type === 'boletos') {
      // Retry geração de boletos falhados
      return await this.generateBoletos({ clienteIds: ids, manual: true });
    } else {
      // Retry envios falhados
      return await this.sendMessages({ boletoIds: ids, templateId: 1, manual: true });
    }
  }
  
  // Métodos auxiliares
  private getCurrentPeriod(): string {
    const now = new Date();
    const lastMonth = subMonths(now, 1);
    return format(lastMonth, 'yyyyMM');
  }
  
  private async getActiveApiByType(type: string): Promise<ApiConfiguration | null> {
    const [api] = await db
      .select()
      .from(apiConfigurations)
      .where(and(
        eq
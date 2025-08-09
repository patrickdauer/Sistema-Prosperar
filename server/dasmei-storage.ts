import { eq, and, desc, asc, gte, lte, isNull, ne, notInArray, or } from "drizzle-orm";
import { db } from "./db.js";
import { 
  messageTemplates,
  evolutionInstances,
  systemLogs,
  automationSettings,
  feriados,
  retryQueue,
  InsertMessageTemplate,
  InsertEvolutionInstance,
  InsertSystemLog,
  InsertAutomationSetting,
  InsertFeriado,
  InsertRetryQueue,
  MessageTemplate,
  EvolutionInstance,
  SystemLog,
  AutomationSetting,
  Feriado,
  RetryQueue
} from "../shared/dasmei-schema.js";
import { 
  clientesMei,
  dasGuias,
  envioLogs,
  ClienteMei,
  InsertClienteMei,
  DasGuia,
  InsertDasGuia,
  EnvioLog,
  InsertEnvioLog
} from "../shared/das-schema.js";

export class DASMEIStorage {
  constructor() {
    // Usar sistema de produção InfoSimples
    process.env.DASMEI_PROVIDER = 'infosimples';
  }

  // Templates de mensagem
  async createMessageTemplate(data: InsertMessageTemplate): Promise<MessageTemplate> {
    const [template] = await db.insert(messageTemplates).values(data).returning();
    return template;
  }

  async getAllMessageTemplates(): Promise<MessageTemplate[]> {
    return await db.select().from(messageTemplates).orderBy(asc(messageTemplates.nome));
  }

  async getMessageTemplateById(id: number): Promise<MessageTemplate | null> {
    const [template] = await db.select().from(messageTemplates).where(eq(messageTemplates.id, id));
    return template || null;
  }

  async getMessageTemplateByTipo(tipo: string): Promise<MessageTemplate | null> {
    const [template] = await db.select()
      .from(messageTemplates)
      .where(and(eq(messageTemplates.tipo, tipo), eq(messageTemplates.ativo, true)));
    return template || null;
  }

  async updateMessageTemplate(id: number, data: Partial<InsertMessageTemplate>): Promise<MessageTemplate> {
    const [template] = await db.update(messageTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(messageTemplates.id, id))
      .returning();
    return template;
  }

  async deleteMessageTemplate(id: number): Promise<void> {
    await db.delete(messageTemplates).where(eq(messageTemplates.id, id));
  }

  // Instâncias Evolution API
  async createEvolutionInstance(data: InsertEvolutionInstance): Promise<EvolutionInstance> {
    const [instance] = await db.insert(evolutionInstances).values(data).returning();
    return instance;
  }

  async getAllEvolutionInstances(): Promise<EvolutionInstance[]> {
    return await db.select().from(evolutionInstances).orderBy(asc(evolutionInstances.nome));
  }

  async getEvolutionInstanceById(id: number): Promise<EvolutionInstance | null> {
    const [instance] = await db.select().from(evolutionInstances).where(eq(evolutionInstances.id, id));
    return instance || null;
  }

  async getEvolutionInstanceAtiva(): Promise<EvolutionInstance | null> {
    const [instance] = await db.select()
      .from(evolutionInstances)
      .where(eq(evolutionInstances.ativo, true))
      .limit(1);
    return instance || null;
  }

  async updateEvolutionInstance(id: number, data: Partial<InsertEvolutionInstance>): Promise<EvolutionInstance> {
    const [instance] = await db.update(evolutionInstances)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(evolutionInstances.id, id))
      .returning();
    return instance;
  }

  async deleteEvolutionInstance(id: number): Promise<void> {
    await db.delete(evolutionInstances).where(eq(evolutionInstances.id, id));
  }

  // System Logs
  async createSystemLog(data: InsertSystemLog): Promise<SystemLog> {
    const [log] = await db.insert(systemLogs).values(data).returning();
    return log;
  }

  async getAllSystemLogs(limit: number = 100): Promise<SystemLog[]> {
    return await db.select()
      .from(systemLogs)
      .orderBy(desc(systemLogs.timestamp))
      .limit(limit);
  }

  async getSystemLogsByCliente(clienteId: number): Promise<SystemLog[]> {
    return await db.select()
      .from(systemLogs)
      .where(eq(systemLogs.clienteId, clienteId))
      .orderBy(desc(systemLogs.timestamp));
  }

  async getSystemLogsByPeriodo(periodo: string): Promise<SystemLog[]> {
    return await db.select()
      .from(systemLogs)
      .where(eq(systemLogs.periodo, periodo))
      .orderBy(desc(systemLogs.timestamp));
  }

  async getSystemLogsByOperacao(operacao: string): Promise<SystemLog[]> {
    return await db.select()
      .from(systemLogs)
      .where(eq(systemLogs.tipoOperacao, operacao))
      .orderBy(desc(systemLogs.timestamp));
  }

  // Configurações de automação
  async createAutomationSetting(data: InsertAutomationSetting): Promise<AutomationSetting> {
    const [setting] = await db.insert(automationSettings).values(data).returning();
    return setting;
  }

  async getAutomationSetting(chave: string): Promise<string | null> {
    const [setting] = await db.select()
      .from(automationSettings)
      .where(eq(automationSettings.chave, chave));
    return setting?.valor || null;
  }

  async getAllAutomationSettings(): Promise<AutomationSetting[]> {
    return await db.select().from(automationSettings).orderBy(asc(automationSettings.chave));
  }

  async updateAutomationSetting(chave: string, valor: string, updatedBy?: number): Promise<AutomationSetting> {
    const [setting] = await db.update(automationSettings)
      .set({ valor, updatedAt: new Date(), updatedBy })
      .where(eq(automationSettings.chave, chave))
      .returning();
    return setting;
  }

  async upsertAutomationSetting(chave: string, valor: string, descricao?: string, updatedBy?: number): Promise<AutomationSetting> {
    const existing = await db.select().from(automationSettings).where(eq(automationSettings.chave, chave));
    
    if (existing.length > 0) {
      return await this.updateAutomationSetting(chave, valor, updatedBy);
    } else {
      return await this.createAutomationSetting({
        chave,
        valor,
        descricao,
        updatedBy
      });
    }
  }

  // Feriados
  async createFeriado(data: InsertFeriado): Promise<Feriado> {
    const [feriado] = await db.insert(feriados).values(data).returning();
    return feriado;
  }

  async getAllFeriados(): Promise<Feriado[]> {
    return await db.select().from(feriados).orderBy(asc(feriados.data));
  }

  async getFeriadosByData(data: Date): Promise<Feriado[]> {
    const startOfDay = new Date(data);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(data);
    endOfDay.setHours(23, 59, 59, 999);

    return await db.select()
      .from(feriados)
      .where(and(
        gte(feriados.data, startOfDay),
        lte(feriados.data, endOfDay)
      ));
  }

  async deleteFeriado(id: number): Promise<void> {
    await db.delete(feriados).where(eq(feriados.id, id));
  }

  // Retry Queue
  async createRetryItem(data: InsertRetryQueue): Promise<RetryQueue> {
    const [item] = await db.insert(retryQueue).values(data).returning();
    return item;
  }

  async getRetryItemsPendentes(): Promise<RetryQueue[]> {
    const now = new Date();
    return await db.select()
      .from(retryQueue)
      .where(and(
        eq(retryQueue.status, 'pending'),
        lte(retryQueue.proximaTentativa, now)
      ))
      .orderBy(asc(retryQueue.proximaTentativa));
  }

  async getAllRetryItems(): Promise<RetryQueue[]> {
    return await db.select()
      .from(retryQueue)
      .orderBy(desc(retryQueue.createdAt));
  }

  async updateRetryItem(id: number, data: Partial<InsertRetryQueue>): Promise<RetryQueue> {
    const [item] = await db.update(retryQueue)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(retryQueue.id, id))
      .returning();
    return item;
  }

  async deleteRetryItem(id: number): Promise<void> {
    await db.delete(retryQueue).where(eq(retryQueue.id, id));
  }

  // Funcionalidades estendidas do DAS
  async getClientesMeiAtivos(): Promise<ClienteMei[]> {
    return await db.select()
      .from(clientesMei)
      .where(eq(clientesMei.isActive, true))
      .orderBy(asc(clientesMei.nome));
  }

  async getAllClientesMei(): Promise<ClienteMei[]> {
    return await db.select()
      .from(clientesMei)
      .orderBy(asc(clientesMei.nome));
  }

  async getClienteMeiById(id: number): Promise<ClienteMei | null> {
    const [cliente] = await db.select().from(clientesMei).where(eq(clientesMei.id, id));
    return cliente || null;
  }

  async getClienteMeiByCnpj(cnpj: string): Promise<ClienteMei | null> {
    const cleaned = cnpj.replace(/[^\d]/g, '');
    const [cliente] = await db
      .select()
      .from(clientesMei)
      .where(or(
        eq(clientesMei.cnpj, cnpj),
        eq(clientesMei.cnpj, cleaned)
      ));
    return cliente || null;
  }

  async getDasGuiaByClienteAndPeriodo(clienteId: number, periodo: string): Promise<DasGuia | null> {
    const [guia] = await db.select()
      .from(dasGuias)
      .where(and(
        eq(dasGuias.clienteMeiId, clienteId),
        eq(dasGuias.mesAno, periodo)
      ));
    return guia || null;
  }

  async getGuiaByClienteAndMes(clienteId: number, mesAno: string): Promise<DasGuia | null> {
    const [guia] = await db.select()
      .from(dasGuias)
      .where(and(
        eq(dasGuias.clienteMeiId, clienteId),
        eq(dasGuias.mesAno, mesAno)
      ));
    return guia || null;
  }

  async getDasGuiasSemEnvio(periodo: string): Promise<DasGuia[]> {
    // Buscar guias que não têm logs de envio WhatsApp bem-sucedidos
    const guiasComEnvio = await db.select({ guiaId: envioLogs.dasGuiaId })
      .from(envioLogs)
      .where(and(
        eq(envioLogs.tipoEnvio, 'whatsapp'),
        eq(envioLogs.status, 'sent')
      ));

    const guiaIdsComEnvio = guiasComEnvio.map(g => g.guiaId);

    if (guiaIdsComEnvio.length === 0) {
      return await db.select()
        .from(dasGuias)
        .where(eq(dasGuias.mesAno, periodo));
    }

    return await db.select()
      .from(dasGuias)
      .where(and(
        eq(dasGuias.mesAno, periodo),
        notInArray(dasGuias.id, guiaIdsComEnvio)
      ));
  }

  async getDasGuiasProximasVencimento(periodo: string): Promise<DasGuia[]> {
    const hoje = new Date();
    const proximosDias = new Date();
    proximosDias.setDate(hoje.getDate() + 5); // Próximos 5 dias

    return await db.select()
      .from(dasGuias)
      .where(and(
        eq(dasGuias.mesAno, periodo),
        gte(dasGuias.dataVencimento, hoje),
        lte(dasGuias.dataVencimento, proximosDias)
      ));
  }

  async createDasGuia(data: InsertDasGuia): Promise<DasGuia> {
    const [guia] = await db.insert(dasGuias).values(data).returning();
    return guia;
  }

  async updateDasGuia(id: number, data: Partial<InsertDasGuia>): Promise<DasGuia> {
    const [guia] = await db
      .update(dasGuias)
      .set({ ...data })
      .where(eq(dasGuias.id, id))
      .returning();
    return guia;
  }

  async createEnvioLog(data: InsertEnvioLog): Promise<EnvioLog> {
    const [log] = await db.insert(envioLogs).values(data).returning();
    return log;
  }

  // Utilidade: buscar guia por ID (para cache posterior/reattempt)
  async getDasGuiaById(id: number): Promise<DasGuia | null> {
    const [guia] = await db.select().from(dasGuias).where(eq(dasGuias.id, id));
    return guia || null;
  }

  // Estatísticas do sistema
  async getEstatisticasPeriodo(periodo: string): Promise<{
    totalClientes: number;
    guiasGeradas: number;
    whatsappEnviados: number;
    falhas: number;
  }> {
    const totalClientes = await db.select()
      .from(clientesMei)
      .where(eq(clientesMei.isActive, true));

    const guiasGeradas = await db.select()
      .from(dasGuias)
      .where(eq(dasGuias.mesAno, periodo));

    const whatsappEnviados = await db.select()
      .from(envioLogs)
      .where(and(
        eq(envioLogs.tipoEnvio, 'whatsapp'),
        eq(envioLogs.status, 'sent')
      ));

    const falhas = await db.select()
      .from(systemLogs)
      .where(and(
        eq(systemLogs.periodo, periodo),
        eq(systemLogs.status, 'failed')
      ));

    return {
      totalClientes: totalClientes.length,
      guiasGeradas: guiasGeradas.length,
      whatsappEnviados: whatsappEnviados.length,
      falhas: falhas.length,
    };
  }

  // Status por CNPJs (somente BD): retorna se há guia com PDF salvo (filePath) para o mesAno informado
  // Se mesAno não for informado, considera a guia mais recente do cliente que tenha filePath
  async getDasStatusByCnpjs(
    cnpjs: string[],
    mesAno?: string
  ): Promise<Record<string, { disponivel: boolean; mesAno?: string; fileName?: string }>> {
    const resultado: Record<string, { disponivel: boolean; mesAno?: string; fileName?: string }> = {};
    if (!cnpjs || cnpjs.length === 0) return resultado;

    for (const cnpj of cnpjs) {
      try {
        const cliente = await this.getClienteMeiByCnpj(cnpj);
        if (!cliente) {
          resultado[cnpj] = { disponivel: false };
          continue;
        }

        let guia: DasGuia | null = null;
        if (mesAno) {
          guia = await this.getGuiaByClienteAndMes(cliente.id, mesAno);
        } else {
          const [g] = await db
            .select()
            .from(dasGuias)
            .where(eq(dasGuias.clienteMeiId, cliente.id))
            .orderBy(desc(dasGuias.createdAt))
            .limit(1);
          guia = g || null;
        }

        // DAS disponível se tem filePath OU se status é 'completed'
        if (guia && ((guia as any).filePath || (guia as any).downloadStatus === 'completed')) {
          resultado[cnpj] = {
            disponivel: true,
            mesAno: guia.mesAno as any,
            fileName: (guia as any).fileName || undefined
          };
        } else {
          resultado[cnpj] = { disponivel: false };
        }
      } catch (error) {
        resultado[cnpj] = { disponivel: false };
      }
    }

    return resultado;
  }
}

export const dasmeiStorage = new DASMEIStorage();
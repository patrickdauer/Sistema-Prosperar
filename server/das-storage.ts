import { db } from './db';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { 
  apiConfigurations, 
  apiChangeLogs, 
  clientesMei, 
  dasGuias, 
  envioLogs,
  InsertApiConfiguration,
  InsertApiChangeLog,
  InsertClienteMei,
  InsertDasGuia,
  InsertEnvioLog,
  ApiConfiguration,
  ApiChangeLog,
  ClienteMei,
  DasGuia,
  EnvioLog
} from '../shared/das-schema';

export class DASStorage {
  // API Configurations
  async createApiConfiguration(data: InsertApiConfiguration): Promise<ApiConfiguration> {
    const [config] = await db.insert(apiConfigurations).values(data).returning();
    return config;
  }

  async getApiConfiguration(id: number): Promise<ApiConfiguration | undefined> {
    const [config] = await db.select().from(apiConfigurations).where(eq(apiConfigurations.id, id));
    return config;
  }

  async getApiConfigurationByType(type: string): Promise<ApiConfiguration | undefined> {
    const [config] = await db.select().from(apiConfigurations)
      .where(and(eq(apiConfigurations.type, type), eq(apiConfigurations.isActive, true)));
    return config;
  }

  async getAllApiConfigurations(): Promise<ApiConfiguration[]> {
    return await db.select().from(apiConfigurations).orderBy(desc(apiConfigurations.createdAt));
  }

  async updateApiConfiguration(id: number, data: Partial<ApiConfiguration>): Promise<ApiConfiguration> {
    const [config] = await db.update(apiConfigurations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(apiConfigurations.id, id))
      .returning();
    return config;
  }

  async deleteApiConfiguration(id: number): Promise<void> {
    await db.delete(apiConfigurations).where(eq(apiConfigurations.id, id));
  }

  async activateApiConfiguration(id: number, userId: number): Promise<ApiConfiguration> {
    // Desativar outras configurações do mesmo tipo
    const config = await this.getApiConfiguration(id);
    if (config) {
      await db.update(apiConfigurations)
        .set({ isActive: false })
        .where(eq(apiConfigurations.type, config.type));
    }

    // Ativar a configuração específica
    const [activatedConfig] = await db.update(apiConfigurations)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(apiConfigurations.id, id))
      .returning();

    // Log da alteração
    await this.createApiChangeLog({
      apiId: id,
      action: 'activated',
      changes: { isActive: true },
      userId
    });

    return activatedConfig;
  }

  // API Change Logs
  async createApiChangeLog(data: InsertApiChangeLog): Promise<ApiChangeLog> {
    const [log] = await db.insert(apiChangeLogs).values(data).returning();
    return log;
  }

  async getApiChangeLogs(apiId: number): Promise<ApiChangeLog[]> {
    return await db.select().from(apiChangeLogs)
      .where(eq(apiChangeLogs.apiId, apiId))
      .orderBy(desc(apiChangeLogs.timestamp));
  }

  // Clientes MEI
  async createClienteMei(data: InsertClienteMei): Promise<ClienteMei> {
    const [cliente] = await db.insert(clientesMei).values(data).returning();
    return cliente;
  }

  async getClienteMei(id: number): Promise<ClienteMei | undefined> {
    const [cliente] = await db.select().from(clientesMei).where(eq(clientesMei.id, id));
    return cliente;
  }

  async getClienteMeiById(id: number): Promise<ClienteMei | undefined> {
    return this.getClienteMei(id);
  }

  async getAllClientesMei(): Promise<ClienteMei[]> {
    return await db.select().from(clientesMei).orderBy(clientesMei.nome);
  }

  async updateClienteMei(id: number, data: Partial<ClienteMei>): Promise<ClienteMei> {
    const [cliente] = await db.update(clientesMei)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(clientesMei.id, id))
      .returning();
    return cliente;
  }

  async deleteClienteMei(id: number): Promise<void> {
    await db.delete(clientesMei).where(eq(clientesMei.id, id));
  }

  // DAS Guias
  async createDasGuia(data: InsertDasGuia): Promise<DasGuia> {
    const [guia] = await db.insert(dasGuias).values(data).returning();
    return guia;
  }

  async getDasGuiaById(id: number): Promise<DasGuia | undefined> {
    const [guia] = await db.select().from(dasGuias).where(eq(dasGuias.id, id));
    return guia;
  }

  async getDasGuiaByClienteAndMes(clienteId: number, mesAno: string): Promise<DasGuia | undefined> {
    const [guia] = await db.select().from(dasGuias)
      .where(and(
        eq(dasGuias.clienteMeiId, clienteId),
        eq(dasGuias.mesAno, mesAno)
      ));
    return guia;
  }

  async getDasGuiasByCliente(clienteId: number): Promise<DasGuia[]> {
    return await db.select().from(dasGuias)
      .where(eq(dasGuias.clienteMeiId, clienteId))
      .orderBy(desc(dasGuias.mesAno));
  }

  async getAllDasGuias(): Promise<DasGuia[]> {
    return await db.select().from(dasGuias).orderBy(desc(dasGuias.createdAt));
  }

  async updateDasGuia(id: number, data: Partial<DasGuia>): Promise<DasGuia> {
    const [guia] = await db.update(dasGuias)
      .set(data)
      .where(eq(dasGuias.id, id))
      .returning();
    return guia;
  }

  async getDasGuiasVencendoHoje(data: Date): Promise<DasGuia[]> {
    const startOfDay = new Date(data);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(data);
    endOfDay.setHours(23, 59, 59, 999);

    return await db.select().from(dasGuias)
      .where(and(
        gte(dasGuias.dataVencimento, startOfDay),
        lte(dasGuias.dataVencimento, endOfDay)
      ));
  }

  async deleteDasGuia(id: number): Promise<void> {
    // Primeiro deletar os logs de envio relacionados
    await db.delete(envioLogs).where(eq(envioLogs.dasGuiaId, id));
    // Depois deletar a guia DAS
    await db.delete(dasGuias).where(eq(dasGuias.id, id));
  }

  // Envio Logs
  async createEnvioLog(data: InsertEnvioLog): Promise<EnvioLog> {
    const [log] = await db.insert(envioLogs).values(data).returning();
    return log;
  }

  async getEnvioLogsByGuia(guiaId: number): Promise<EnvioLog[]> {
    return await db.select().from(envioLogs)
      .where(eq(envioLogs.dasGuiaId, guiaId))
      .orderBy(desc(envioLogs.createdAt));
  }

  async getAllEnvioLogs(): Promise<EnvioLog[]> {
    return await db.select().from(envioLogs).orderBy(desc(envioLogs.createdAt));
  }



  async getDasGuiaByClienteAndPeriodo(clienteId: number, periodo: string): Promise<DasGuia | undefined> {
    const [guia] = await db.select().from(dasGuias)
      .where(and(
        eq(dasGuias.clienteMeiId, clienteId),
        eq(dasGuias.mesAno, periodo)
      ));
    return guia;
  }
}

export const dasStorage = new DASStorage();
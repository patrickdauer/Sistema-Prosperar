import { CronJob } from 'cron';
import { storage } from '../storage';
import { dasProviderManager } from './das-provider';
import { messageManager } from './messaging';
import { promises as fs } from 'fs';
import { join } from 'path';

export class DASScheduler {
  private downloadJob: CronJob | null = null;
  private sendJob: CronJob | null = null;
  private reminderJob: CronJob | null = null;

  constructor() {
    this.initializeJobs();
  }

  private initializeJobs(): void {
    // Job para baixar DAS todo dia 1º às 8h
    this.downloadJob = new CronJob('0 8 1 * *', this.downloadAllDAS.bind(this), null, false, 'America/Sao_Paulo');
    
    // Job para enviar DAS diariamente às 9h (verifica se há algo para enviar)
    this.sendJob = new CronJob('0 9 * * *', this.sendScheduledDAS.bind(this), null, false, 'America/Sao_Paulo');
    
    // Job para lembretes diariamente às 8h
    this.reminderJob = new CronJob('0 8 * * *', this.sendReminders.bind(this), null, false, 'America/Sao_Paulo');
  }

  public start(): void {
    console.log('Iniciando scheduler DAS...');
    this.downloadJob?.start();
    this.sendJob?.start();
    this.reminderJob?.start();
    console.log('Scheduler DAS iniciado com sucesso');
  }

  public stop(): void {
    console.log('Parando scheduler DAS...');
    this.downloadJob?.stop();
    this.sendJob?.stop();
    this.reminderJob?.stop();
    console.log('Scheduler DAS parado');
  }

  private async downloadAllDAS(): Promise<void> {
    try {
      console.log('Iniciando download automático de DAS...');
      
      if (!dasProviderManager.isConfigured()) {
        console.error('Provedor DAS não configurado');
        return;
      }

      const clientes = await storage.getAllClientesMei();
      const today = new Date();
      const mesAno = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

      for (const cliente of clientes) {
        if (!cliente.isActive) continue;

        try {
          console.log(`Baixando DAS para ${cliente.nome} (${cliente.cnpj})`);
          
          // Verificar se já existe guia para este mês
          const guiaExistente = await storage.getDasGuiaByClienteAndMes(cliente.id, mesAno);
          if (guiaExistente) {
            console.log(`DAS já existe para ${cliente.nome} - ${mesAno}`);
            continue;
          }

          // Baixar DAS
          const result = await dasProviderManager.downloadDAS(cliente.cnpj, mesAno);
          
          if (result.success && result.pdfBuffer) {
            // Salvar arquivo
            const fileName = result.fileName || `DAS_MEI_${cliente.cnpj}_${mesAno}.pdf`;
            const filePath = await this.saveFile(result.pdfBuffer, fileName);
            
            // Criar registro no banco
            await storage.createDasGuia({
              clienteMeiId: cliente.id,
              mesAno,
              dataVencimento: result.dataVencimento || new Date(today.getFullYear(), today.getMonth(), cliente.dataVencimento),
              valor: result.valor,
              filePath,
              fileName,
              downloadedAt: new Date(),
              downloadStatus: 'success',
              provider: dasProviderManager.getProviderName()
            });

            // Programar envio
            const dataEnvio = new Date(today.getFullYear(), today.getMonth(), cliente.dataEnvio);
            await storage.createProgramacaoEnvio({
              dasGuiaId: (await storage.getDasGuiaByClienteAndMes(cliente.id, mesAno))!.id,
              dataAgendada: dataEnvio,
              tipoEnvio: 'das_envio'
            });

            console.log(`DAS baixado com sucesso para ${cliente.nome}`);
          } else {
            // Registrar erro
            await storage.createDasGuia({
              clienteMeiId: cliente.id,
              mesAno,
              dataVencimento: new Date(today.getFullYear(), today.getMonth(), cliente.dataVencimento),
              downloadStatus: 'failed',
              downloadError: result.error,
              provider: dasProviderManager.getProviderName()
            });

            console.error(`Erro ao baixar DAS para ${cliente.nome}: ${result.error}`);
          }
        } catch (error) {
          console.error(`Erro ao processar cliente ${cliente.nome}:`, error);
        }
      }

      console.log('Download automático de DAS concluído');
    } catch (error) {
      console.error('Erro no download automático de DAS:', error);
    }
  }

  private async sendScheduledDAS(): Promise<void> {
    try {
      console.log('Verificando envios programados...');
      
      const today = new Date();
      const enviosProgramados = await storage.getProgramacaoEnviosByData(today);

      for (const envio of enviosProgramados) {
        if (envio.status !== 'agendado') continue;

        try {
          const dasGuia = await storage.getDasGuiaById(envio.dasGuiaId);
          if (!dasGuia) continue;

          const cliente = await storage.getClienteMeiById(dasGuia.clienteMeiId);
          if (!cliente) continue;

          if (envio.tipoEnvio === 'das_envio') {
            await this.sendDASToClient(dasGuia, cliente);
          }

          // Marcar como processado
          await storage.updateProgramacaoEnvio(envio.id, {
            status: 'processado',
            processadoEm: new Date()
          });

        } catch (error) {
          console.error(`Erro ao processar envio ${envio.id}:`, error);
        }
      }

      console.log('Verificação de envios programados concluída');
    } catch (error) {
      console.error('Erro na verificação de envios programados:', error);
    }
  }

  private async sendReminders(): Promise<void> {
    try {
      console.log('Verificando lembretes de vencimento...');
      
      const today = new Date();
      const guiasVencendoHoje = await storage.getDasGuiasVencendoHoje(today);

      for (const guia of guiasVencendoHoje) {
        const cliente = await storage.getClienteMeiById(guia.clienteMeiId);
        if (!cliente) continue;

        try {
          await this.sendVencimentoReminder(guia, cliente);
        } catch (error) {
          console.error(`Erro ao enviar lembrete para ${cliente.nome}:`, error);
        }
      }

      console.log('Verificação de lembretes concluída');
    } catch (error) {
      console.error('Erro na verificação de lembretes:', error);
    }
  }

  private async sendDASToClient(dasGuia: any, cliente: any): Promise<void> {
    const mesAno = dasGuia.mesAno;
    const [ano, mes] = mesAno.split('-');
    const nomesMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                       'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const mesNome = nomesMeses[parseInt(mes) - 1];

    const message = `Olá, ${cliente.nome}! 👋

Segue em anexo sua Guia DAS-MEI referente ao mês de ${mesNome}/${ano}.

🗓️ Data de vencimento: ${dasGuia.dataVencimento.toLocaleDateString('pt-BR')}

Por favor, realize o pagamento até a data informada para evitar multas.

Qualquer dúvida, estamos à disposição!

Abraços,
Prosperar Contabilidade`;

    let pdfBuffer: Buffer | undefined;
    if (dasGuia.filePath) {
      try {
        pdfBuffer = await fs.readFile(dasGuia.filePath);
      } catch (error) {
        console.error('Erro ao ler arquivo PDF:', error);
      }
    }

    // Enviar WhatsApp
    if (cliente.telefone && messageManager.isWhatsAppConfigured()) {
      const whatsappResult = await messageManager.sendWhatsApp(
        cliente.telefone,
        message,
        pdfBuffer,
        dasGuia.fileName
      );

      await storage.createEnvioLog({
        dasGuiaId: dasGuia.id,
        tipoEnvio: 'whatsapp',
        status: whatsappResult.success ? 'sent' : 'failed',
        mensagem: message,
        resposta: whatsappResult.response,
        enviadoEm: new Date(),
        ultimoErro: whatsappResult.error
      });
    }

    // Enviar Email
    if (cliente.email && messageManager.isEmailConfigured()) {
      const emailResult = await messageManager.sendEmail(
        cliente.email,
        `DAS-MEI ${mesNome}/${ano} - ${cliente.nome}`,
        message,
        pdfBuffer,
        dasGuia.fileName
      );

      await storage.createEnvioLog({
        dasGuiaId: dasGuia.id,
        tipoEnvio: 'email',
        status: emailResult.success ? 'sent' : 'failed',
        mensagem: message,
        resposta: emailResult.response,
        enviadoEm: new Date(),
        ultimoErro: emailResult.error
      });
    }
  }

  private async sendVencimentoReminder(dasGuia: any, cliente: any): Promise<void> {
    const message = `Olá, ${cliente.nome}! ⚠️

Lembrete: sua guia DAS-MEI **vence hoje**.

Se ainda não pagou, utilize a guia que enviamos anteriormente.

Conte conosco para o que precisar!

Abraços,
Prosperar Contabilidade`;

    // Enviar WhatsApp
    if (cliente.telefone && messageManager.isWhatsAppConfigured()) {
      const whatsappResult = await messageManager.sendWhatsApp(cliente.telefone, message);

      await storage.createEnvioLog({
        dasGuiaId: dasGuia.id,
        tipoEnvio: 'lembrete_whatsapp',
        status: whatsappResult.success ? 'sent' : 'failed',
        mensagem: message,
        resposta: whatsappResult.response,
        enviadoEm: new Date(),
        ultimoErro: whatsappResult.error
      });
    }

    // Enviar Email
    if (cliente.email && messageManager.isEmailConfigured()) {
      const emailResult = await messageManager.sendEmail(
        cliente.email,
        `Lembrete: DAS-MEI vence hoje - ${cliente.nome}`,
        message
      );

      await storage.createEnvioLog({
        dasGuiaId: dasGuia.id,
        tipoEnvio: 'lembrete_email',
        status: emailResult.success ? 'sent' : 'failed',
        mensagem: message,
        resposta: emailResult.response,
        enviadoEm: new Date(),
        ultimoErro: emailResult.error
      });
    }
  }

  private async saveFile(buffer: Buffer, fileName: string): Promise<string> {
    const uploadsDir = join(process.cwd(), 'uploads', 'das');
    await fs.mkdir(uploadsDir, { recursive: true });
    
    const filePath = join(uploadsDir, fileName);
    await fs.writeFile(filePath, buffer);
    
    return filePath;
  }
}

// Instância singleton
export const dasScheduler = new DASScheduler();
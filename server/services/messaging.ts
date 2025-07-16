// Interfaces para serviços de mensageria
export interface WhatsAppService {
  sendMessage(phone: string, message: string, attachment?: Buffer, filename?: string): Promise<MessageResult>;
  isConfigured(): boolean;
}

export interface EmailService {
  sendEmail(to: string, subject: string, message: string, attachment?: Buffer, filename?: string): Promise<MessageResult>;
  isConfigured(): boolean;
}

export interface MessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  response?: any;
}

// Implementação Evolution API para WhatsApp
export class EvolutionWhatsAppService implements WhatsAppService {
  private apiUrl: string;
  private apiKey: string;
  private instanceName: string;

  constructor(credentials: any) {
    this.apiUrl = credentials.apiUrl;
    this.apiKey = credentials.apiKey;
    this.instanceName = credentials.instanceName;
  }

  isConfigured(): boolean {
    return !!(this.apiUrl && this.apiKey && this.instanceName);
  }

  async sendMessage(phone: string, message: string, attachment?: Buffer, filename?: string): Promise<MessageResult> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'Evolution API não configurada'
        };
      }

      const phoneNumber = phone.replace(/\D/g, ''); // Remove caracteres não numéricos
      const url = `${this.apiUrl}/message/sendText/${this.instanceName}`;

      const payload: any = {
        number: phoneNumber,
        text: message
      };

      // Se há anexo, usar endpoint diferente
      if (attachment && filename) {
        const mediaUrl = `${this.apiUrl}/message/sendMedia/${this.instanceName}`;
        
        const formData = new FormData();
        formData.append('number', phoneNumber);
        formData.append('caption', message);
        formData.append('media', new Blob([attachment]), filename);

        const response = await fetch(mediaUrl, {
          method: 'POST',
          headers: {
            'apikey': this.apiKey
          },
          body: formData
        });

        const result = await response.json();
        
        return {
          success: response.ok,
          messageId: result.messageId,
          error: !response.ok ? result.error : undefined,
          response: result
        };
      }

      // Envio de mensagem de texto
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      return {
        success: response.ok,
        messageId: result.messageId,
        error: !response.ok ? result.error : undefined,
        response: result
      };

    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
}

// Implementação SendGrid para Email
export class SendGridEmailService implements EmailService {
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;

  constructor(credentials: any) {
    this.apiKey = credentials.apiKey;
    this.fromEmail = credentials.fromEmail;
    this.fromName = credentials.fromName || 'Prosperar Contabilidade';
  }

  isConfigured(): boolean {
    return !!(this.apiKey && this.fromEmail);
  }

  async sendEmail(to: string, subject: string, message: string, attachment?: Buffer, filename?: string): Promise<MessageResult> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'SendGrid não configurado'
        };
      }

      const payload: any = {
        personalizations: [{
          to: [{ email: to }],
          subject: subject
        }],
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        content: [{
          type: 'text/html',
          value: message.replace(/\n/g, '<br>')
        }]
      };

      // Adicionar anexo se fornecido
      if (attachment && filename) {
        payload.attachments = [{
          content: attachment.toString('base64'),
          filename: filename,
          type: 'application/pdf',
          disposition: 'attachment'
        }];
      }

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = response.ok ? { success: true } : await response.json();
      
      return {
        success: response.ok,
        messageId: response.headers.get('x-message-id') || undefined,
        error: !response.ok ? result.errors?.[0]?.message : undefined,
        response: result
      };

    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
}

// Gerenciador de mensagens
export class MessageManager {
  private whatsappService: WhatsAppService | null = null;
  private emailService: EmailService | null = null;

  setWhatsAppService(service: WhatsAppService): void {
    this.whatsappService = service;
  }

  setEmailService(service: EmailService): void {
    this.emailService = service;
  }

  async sendWhatsApp(phone: string, message: string, attachment?: Buffer, filename?: string): Promise<MessageResult> {
    if (!this.whatsappService) {
      return {
        success: false,
        error: 'Serviço WhatsApp não configurado'
      };
    }

    return await this.whatsappService.sendMessage(phone, message, attachment, filename);
  }

  async sendEmail(to: string, subject: string, message: string, attachment?: Buffer, filename?: string): Promise<MessageResult> {
    if (!this.emailService) {
      return {
        success: false,
        error: 'Serviço de email não configurado'
      };
    }

    return await this.emailService.sendEmail(to, subject, message, attachment, filename);
  }

  isWhatsAppConfigured(): boolean {
    return this.whatsappService?.isConfigured() || false;
  }

  isEmailConfigured(): boolean {
    return this.emailService?.isConfigured() || false;
  }
}

// Instância singleton
export const messageManager = new MessageManager();
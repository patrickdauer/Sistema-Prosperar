import { WhatsappProvider, WhatsappResult } from './types';

export class EvolutionProvider implements WhatsappProvider {
  private serverUrl: string;
  private apiKey: string;
  private instance: string;
  private defaultDelay: number;

  constructor(config: {
    serverUrl: string;
    apiKey: string;
    instance: string;
    defaultDelay?: number;
  }) {
    this.serverUrl = config.serverUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = config.apiKey;
    this.instance = config.instance;
    this.defaultDelay = config.defaultDelay || 1000;
  }

  async sendMessage(phone: string, message: string): Promise<WhatsappResult> {
    try {
      // Formatar telefone (remover caracteres especiais)
      const cleanPhone = phone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;

      const response = await fetch(`${this.serverUrl}/message/sendText/${this.instance}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey
        },
        body: JSON.stringify({
          number: formattedPhone,
          text: message,
          delay: this.defaultDelay,
          linkPreview: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.message || 'Erro na Evolution API');
      }

      return {
        success: true,
        messageId: data.key?.id || data.messageId
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey
        }
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  getName(): string {
    return `Evolution API - ${this.instance}`;
  }
}
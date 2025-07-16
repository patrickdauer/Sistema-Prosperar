// Interface genérica para provedores de DAS-MEI
export interface DASProviderService {
  getName(): string;
  downloadDAS(cnpj: string, mesAno: string): Promise<DASDownloadResult>;
  isConfigured(): boolean;
  validateCredentials(): Promise<boolean>;
}

export interface DASDownloadResult {
  success: boolean;
  pdfBuffer?: Buffer;
  fileName?: string;
  valor?: string;
  dataVencimento?: Date;
  error?: string;
}

// Implementação para InfoSimples
export class InfoSimplesProvider implements DASProviderService {
  private apiKey: string;
  private baseUrl: string;

  constructor(credentials: any) {
    this.apiKey = credentials.apiKey;
    this.baseUrl = credentials.baseUrl || 'https://api.infosimples.com.br';
  }

  getName(): string {
    return 'InfoSimples';
  }

  isConfigured(): boolean {
    return !!(this.apiKey && this.baseUrl);
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/test`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Erro ao validar credenciais InfoSimples:', error);
      return false;
    }
  }

  async downloadDAS(cnpj: string, mesAno: string): Promise<DASDownloadResult> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'InfoSimples não configurado corretamente'
        };
      }

      const response = await fetch(`${this.baseUrl}/das-mei`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cnpj: cnpj,
          mes_ano: mesAno
        })
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Erro HTTP ${response.status}: ${response.statusText}`
        };
      }

      const data = await response.json();
      
      if (data.success && data.pdf_url) {
        // Baixar o PDF
        const pdfResponse = await fetch(data.pdf_url);
        const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
        
        return {
          success: true,
          pdfBuffer,
          fileName: `DAS_MEI_${cnpj}_${mesAno}.pdf`,
          valor: data.valor,
          dataVencimento: data.data_vencimento ? new Date(data.data_vencimento) : undefined
        };
      }

      return {
        success: false,
        error: data.error || 'Erro desconhecido ao baixar DAS'
      };

    } catch (error) {
      console.error('Erro ao baixar DAS via InfoSimples:', error);
      return {
        success: false,
        error: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }
}

// Factory para criar instâncias dos provedores
export class DASProviderFactory {
  static create(providerType: string, credentials: any): DASProviderService {
    switch (providerType.toLowerCase()) {
      case 'infosimples':
        return new InfoSimplesProvider(credentials);
      default:
        throw new Error(`Provedor DAS não suportado: ${providerType}`);
    }
  }
}

// Serviço principal para gerenciar provedores
export class DASProviderManager {
  private currentProvider: DASProviderService | null = null;

  setProvider(provider: DASProviderService): void {
    this.currentProvider = provider;
  }

  getCurrentProvider(): DASProviderService | null {
    return this.currentProvider;
  }

  async downloadDAS(cnpj: string, mesAno: string): Promise<DASDownloadResult> {
    if (!this.currentProvider) {
      return {
        success: false,
        error: 'Nenhum provedor DAS configurado'
      };
    }

    return await this.currentProvider.downloadDAS(cnpj, mesAno);
  }

  isConfigured(): boolean {
    return this.currentProvider?.isConfigured() || false;
  }

  getProviderName(): string {
    return this.currentProvider?.getName() || 'Nenhum';
  }
}

// Instância singleton
export const dasProviderManager = new DASProviderManager();
import { dasStorage } from '../das-storage';
import { providerManager } from './api-providers/provider-manager';
import { BaseApiProvider } from './api-providers/base-provider';

export interface DasProvider {
  configured: boolean;
  name: string;
  displayName: string;
  testConnection(): Promise<boolean>;
  generateGuia(cnpj: string, mesAno: string): Promise<any>;
  getGuiaStatus(guiaId: string): Promise<any>;
  downloadGuia(guiaId: string): Promise<any>;
}

export interface DASDownloadResult {
  success: boolean;
  pdfBuffer?: Buffer;
  fileName?: string;
  valor?: string;
  dataVencimento?: Date;
  error?: string;
}

class DasProviderService implements DasProvider {
  private activeProvider: BaseApiProvider | null = null;

  constructor() {
    this.initializeProvider();
  }

  private async initializeProvider(): Promise<void> {
    try {
      this.activeProvider = await providerManager.loadActiveProvider();
    } catch (error) {
      console.error('Erro ao inicializar provedor DAS:', error);
    }
  }

  get configured(): boolean {
    return this.activeProvider?.isConfigured() ?? false;
  }

  get name(): string {
    return this.activeProvider?.getName() ?? 'Nenhum';
  }

  get displayName(): string {
    return this.activeProvider?.getDisplayName() ?? 'Nenhum provedor configurado';
  }

  async testConnection(): Promise<boolean> {
    if (!this.activeProvider) {
      return false;
    }

    try {
      const result = await this.activeProvider.testConnection();
      return result.success;
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      return false;
    }
  }

  async generateGuia(cnpj: string, mesAno: string): Promise<any> {
    if (!this.activeProvider) {
      throw new Error('Nenhum provedor configurado');
    }

    // Verificar se é InfoSimples
    if (this.activeProvider.getName() === 'infosimples') {
      const infosimplesProvider = this.activeProvider as any;
      const result = await infosimplesProvider.generateDasGuia(cnpj, mesAno);
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao gerar guia DAS');
      }

      return result.data;
    }

    throw new Error('Provedor não suporta geração de guias DAS');
  }

  async getGuiaStatus(guiaId: string): Promise<any> {
    if (!this.activeProvider) {
      throw new Error('Nenhum provedor configurado');
    }

    if (this.activeProvider.getName() === 'infosimples') {
      const infosimplesProvider = this.activeProvider as any;
      const result = await infosimplesProvider.getGuiaStatus(guiaId);
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao consultar status da guia');
      }

      return result.data;
    }

    throw new Error('Provedor não suporta consulta de status');
  }

  async downloadGuia(guiaId: string): Promise<any> {
    if (!this.activeProvider) {
      throw new Error('Nenhum provedor configurado');
    }

    if (this.activeProvider.getName() === 'infosimples') {
      const infosimplesProvider = this.activeProvider as any;
      const result = await infosimplesProvider.downloadGuia(guiaId);
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao baixar guia');
      }

      return result.data;
    }

    throw new Error('Provedor não suporta download de guias');
  }

  async downloadDAS(cnpj: string, mesAno: string): Promise<DASDownloadResult> {
    try {
      if (!this.activeProvider) {
        return {
          success: false,
          error: 'Nenhum provedor configurado'
        };
      }

      if (this.activeProvider.getName() === 'infosimples') {
        const infosimplesProvider = this.activeProvider as any;
        
        // Primeiro gera a guia
        const guiaResult = await infosimplesProvider.generateDasGuia(cnpj, mesAno);
        if (!guiaResult.success) {
          return {
            success: false,
            error: guiaResult.error || 'Erro ao gerar guia DAS'
          };
        }

        // Depois baixa o PDF
        const downloadResult = await infosimplesProvider.downloadGuia(guiaResult.data.id);
        if (!downloadResult.success) {
          return {
            success: false,
            error: downloadResult.error || 'Erro ao baixar guia DAS'
          };
        }

        // Baixar o arquivo PDF
        const pdfResponse = await fetch(downloadResult.data.downloadUrl);
        const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

        return {
          success: true,
          pdfBuffer,
          fileName: `DAS_MEI_${cnpj}_${mesAno}.pdf`,
          valor: guiaResult.data.valor?.toString(),
          dataVencimento: guiaResult.data.dataVencimento ? new Date(guiaResult.data.dataVencimento) : undefined
        };
      }

      return {
        success: false,
        error: 'Provedor não suporta download de DAS'
      };

    } catch (error) {
      console.error('Erro ao baixar DAS:', error);
      return {
        success: false,
        error: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  async refreshProvider(): Promise<void> {
    await this.initializeProvider();
  }

  getProviderStatus(): any {
    return providerManager.getProviderStatus();
  }

  isConfigured(): boolean {
    return this.configured;
  }

  getProviderName(): string {
    return this.name;
  }
}

export const dasProvider = new DasProviderService();

// Compatibilidade com código existente
export const dasProviderManager = dasProvider;
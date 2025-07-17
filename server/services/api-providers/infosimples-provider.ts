import { BaseApiProvider, ApiResponse, ApiCredentials, ApiProviderConfig } from './base-provider';

export interface InfoSimplesCredentials extends ApiCredentials {
  token: string;
}

export interface DasGuiaResponse {
  id: string;
  cnpj: string;
  mesAno: string;
  valor: number;
  dataVencimento: string;
  codigoBarras: string;
  linkBoleto: string;
  status: 'pending' | 'generated' | 'downloaded' | 'error';
}

export interface InfoSimplesApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

export class InfoSimplesProvider extends BaseApiProvider {
  constructor(credentials: InfoSimplesCredentials) {
    const config: ApiProviderConfig = {
      name: 'infosimples',
      displayName: 'InfoSimples',
      description: 'Geração automática de guias DAS-MEI via InfoSimples API',
      requiredCredentials: ['token'],
      baseUrl: 'https://api.infosimples.com/api/v2/',
      rateLimitPerMinute: 60,
      timeout: 30000,
    };

    super(config, credentials);
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.credentials.token}`,
    };
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.testConnection();
      return response.success;
    } catch (error) {
      return false;
    }
  }

  async testConnection(): Promise<ApiResponse> {
    return this.makeRequest('/user/balance');
  }

  async getBalance(): Promise<ApiResponse<{ balance: number }>> {
    return this.makeRequest('/user/balance');
  }

  async generateDasGuia(cnpj: string, mesAno: string): Promise<ApiResponse<DasGuiaResponse>> {
    const endpoint = '/mei/das/generate';
    const payload = {
      cnpj: cnpj.replace(/\D/g, ''), // Remove formatação
      mes_ano: mesAno,
    };

    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getGuiaStatus(guiaId: string): Promise<ApiResponse<DasGuiaResponse>> {
    const endpoint = `/mei/das/status/${guiaId}`;
    return this.makeRequest(endpoint);
  }

  async downloadGuia(guiaId: string): Promise<ApiResponse<{ downloadUrl: string }>> {
    const endpoint = `/mei/das/download/${guiaId}`;
    return this.makeRequest(endpoint);
  }

  async listGuias(cnpj?: string, mesAno?: string): Promise<ApiResponse<DasGuiaResponse[]>> {
    let endpoint = '/mei/das/list';
    const params = new URLSearchParams();
    
    if (cnpj) params.append('cnpj', cnpj.replace(/\D/g, ''));
    if (mesAno) params.append('mes_ano', mesAno);
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    return this.makeRequest(endpoint);
  }

  async bulkGenerateGuias(requests: Array<{cnpj: string, mesAno: string}>): Promise<ApiResponse<DasGuiaResponse[]>> {
    const endpoint = '/mei/das/bulk-generate';
    const payload = {
      requests: requests.map(req => ({
        cnpj: req.cnpj.replace(/\D/g, ''),
        mes_ano: req.mesAno,
      })),
    };

    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Métodos específicos para MEI
  async consultarSituacaoMei(cnpj: string): Promise<ApiResponse> {
    const endpoint = '/mei/situacao';
    const payload = { cnpj: cnpj.replace(/\D/g, '') };

    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async consultarDebitos(cnpj: string): Promise<ApiResponse> {
    const endpoint = '/mei/debitos';
    const payload = { cnpj: cnpj.replace(/\D/g, '') };

    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async consultarHistoricoDeclaracoes(cnpj: string): Promise<ApiResponse> {
    const endpoint = '/mei/declaracoes';
    const payload = { cnpj: cnpj.replace(/\D/g, '') };

    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}
import { BaseApiProvider, ApiResponse, ApiCredentials, ApiProviderConfig } from './base-provider';

export interface InfoSimplesCredentials extends ApiCredentials {
  token: string;
  baseUrl?: string;
  timeout?: number;
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
  boleto?: {
    url: string;
    codigo_barras: string;
    valor: number;
    vencimento: string;
  };
}

export class InfoSimplesProvider extends BaseApiProvider {
  private apiTimeout: number;

  constructor(credentials: InfoSimplesCredentials) {
    const config: ApiProviderConfig = {
      name: 'infosimples',
      displayName: 'InfoSimples',
      description: 'Geração automática de guias DAS-MEI via InfoSimples API',
      requiredCredentials: ['token'],
      baseUrl: credentials.baseUrl || 'https://api.infosimples.com/api/v2',
      rateLimitPerMinute: 60,
      timeout: credentials.timeout || 30000,
    };

    super(config, credentials);
    this.apiTimeout = credentials.timeout || 600;
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
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
    try {
      console.log('Testando conexão InfoSimples com token:', this.credentials.token?.substring(0, 10) + '...');
      
      // Teste com CNPJ fictício para verificar se a API responde
      const testCnpj = '11222333000181';
      const currentDate = new Date();
      const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
      const periodo = `${String(previousMonth.getMonth() + 1).padStart(2, '0')}/${previousMonth.getFullYear()}`;

      const requestData = {
        token: this.credentials.token,
        cnpj: testCnpj,
        periodo: periodo,
        timeout: this.apiTimeout,
        ignore_site_receipt: null
      };

      console.log('Dados da requisição:', { ...requestData, token: requestData.token?.substring(0, 10) + '...' });

      const response = await fetch(`${this.config.baseUrl}/consultas/receita-federal/simples-das`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestData)
      });

      console.log('Resposta da API InfoSimples - Status:', response.status);
      
      // Tentar ler o corpo da resposta para mais detalhes
      let responseBody = '';
      try {
        responseBody = await response.text();
        console.log('Corpo da resposta:', responseBody.substring(0, 200));
      } catch (err) {
        console.log('Erro ao ler corpo da resposta:', err);
      }

      // Aceitar 200, 400 ou 422 como sinais de que a API está funcionando
      const isWorking = response.status === 200 || response.status === 400 || response.status === 422;
      
      return {
        success: isWorking,
        data: { status: response.status, statusText: response.statusText, body: responseBody }
      };
    } catch (error) {
      console.error('Erro no teste de conexão InfoSimples:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  async gerarDAS(cnpj: string, mesAno?: string): Promise<InfoSimplesApiResponse> {
    try {
      // Se não foi fornecido período, usar o mês anterior
      let periodo = mesAno;
      if (!periodo) {
        const currentDate = new Date();
        const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
        periodo = `${String(previousMonth.getMonth() + 1).padStart(2, '0')}/${previousMonth.getFullYear()}`;
      }

      // Converter período para formato AAAAMM se estiver em MM/YYYY
      let periodoFormatado = periodo;
      
      // Se está no formato MM/YYYY, converter para AAAAMM
      const periodoSlashRegex = /^(0[1-9]|1[0-2])\/(\d{4})$/;
      const matchSlash = periodo.match(periodoSlashRegex);
      if (matchSlash) {
        const [, mes, ano] = matchSlash;
        periodoFormatado = `${ano}${mes}`;
      }
      
      // Se já está no formato AAAAMM, validar
      const periodoYearMonthRegex = /^(\d{4})(0[1-9]|1[0-2])$/;
      if (!periodoYearMonthRegex.test(periodoFormatado)) {
        throw new Error('Período deve estar no formato MM/YYYY ou AAAAMM');
      }

      // No método gerarDAS, linha 118-123:
      // Limpar CNPJ (remover pontos e barras)
      const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
      
      if (cnpjLimpo.length !== 14) {
        throw new Error('CNPJ deve ter 14 dígitos');
      }

      const requestData = {
        token: this.credentials.token,
        cnpj: cnpjLimpo,
        periodo: periodoFormatado,
        timeout: this.apiTimeout,
        ignore_site_receipt: null
      };

      console.log('Enviando requisição para InfoSimples:', {
        url: `${this.config.baseUrl}/consultas/receita-federal/simples-das`,
        cnpj: cnpjLimpo,
        periodo: periodoFormatado
      });

      const response = await fetch(`${this.config.baseUrl}/consultas/receita-federal/simples-das`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestData)
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('Erro na resposta da InfoSimples:', responseData);
        return {
          success: false,
          error: responseData.message || `Erro HTTP ${response.status}: ${response.statusText}`
        };
      }

      // Processar resposta da API
      const result: InfoSimplesApiResponse = {
        success: true,
        data: responseData
      };

      // Extrair informações do boleto se disponível
      if (responseData.boleto || responseData.dados_boleto || responseData.data) {
        const boletoData = responseData.boleto || responseData.dados_boleto || responseData.data;
        result.boleto = {
          url: boletoData.url || boletoData.link_boleto || boletoData.link,
          codigo_barras: boletoData.codigo_barras || boletoData.linha_digitavel || boletoData.barcode,
          valor: parseFloat(boletoData.valor || boletoData.value || '0'),
          vencimento: boletoData.vencimento || boletoData.data_vencimento || boletoData.due_date
        };
      }

      return result;
    } catch (error) {
      console.error('Erro ao gerar DAS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // Método para obter período anterior automaticamente
  getPeriodoAnterior(): string {
    const currentDate = new Date();
    const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
    return `${String(previousMonth.getMonth() + 1).padStart(2, '0')}/${previousMonth.getFullYear()}`;
  }

  // Método para validar CNPJ
  validarCNPJ(cnpj: string): boolean {
    const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
    return cnpjLimpo.length === 14;
  }
  
  // Método para limpar CNPJ
  limparCNPJ(cnpj: string): string {
    return cnpj.replace(/[^\d]/g, '');
  }

  // Método para processar geração em lote
  async gerarDASLote(clientes: Array<{id: number, cnpj: string, nome: string}>, mesAno?: string): Promise<Array<{cliente: any, resultado: InfoSimplesApiResponse}>> {
    const resultados = [];
    
    for (const cliente of clientes) {
      try {
        const resultado = await this.gerarDAS(cliente.cnpj, mesAno);
        resultados.push({ cliente, resultado });
        
        // Aguardar um pouco entre requisições para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        resultados.push({ 
          cliente, 
          resultado: { 
            success: false, 
            error: error instanceof Error ? error.message : 'Erro desconhecido' 
          } 
        });
      }
    }
    
    return resultados;
  }
}
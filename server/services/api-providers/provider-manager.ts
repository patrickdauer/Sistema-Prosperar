import { BaseApiProvider, ApiCredentials } from './base-provider';
import { InfoSimplesProvider } from './infosimples-provider';
import { dasStorage } from '../../das-storage.js';

export type ProviderType = 'infosimples' | 'receita-federal' | 'serpro' | 'custom';

export interface ProviderRegistration {
  type: ProviderType;
  name: string;
  displayName: string;
  description: string;
  requiredCredentials: string[];
  createInstance: (credentials: ApiCredentials) => BaseApiProvider;
}

export class ApiProviderManager {
  private static instance: ApiProviderManager;
  private providers: Map<ProviderType, ProviderRegistration> = new Map();
  private activeProvider: BaseApiProvider | null = null;

  private constructor() {
    this.registerDefaultProviders();
  }

  static getInstance(): ApiProviderManager {
    if (!ApiProviderManager.instance) {
      ApiProviderManager.instance = new ApiProviderManager();
    }
    return ApiProviderManager.instance;
  }

  private registerDefaultProviders(): void {
    // InfoSimples Provider
    this.providers.set('infosimples', {
      type: 'infosimples',
      name: 'infosimples',
      displayName: 'InfoSimples',
      description: 'Geração automática de guias DAS-MEI via InfoSimples API',
      requiredCredentials: ['token'],
      createInstance: (credentials) => new InfoSimplesProvider(credentials),
    });

    // Placeholder para futuras integrações
    this.providers.set('receita-federal', {
      type: 'receita-federal',
      name: 'receita-federal',
      displayName: 'Receita Federal',
      description: 'Integração direta com APIs da Receita Federal',
      requiredCredentials: ['certificado', 'senha'],
      createInstance: (credentials) => {
        throw new Error('Provedor Receita Federal ainda não implementado');
      },
    });

    this.providers.set('serpro', {
      type: 'serpro',
      name: 'serpro',
      displayName: 'SERPRO',
      description: 'Integração com APIs do SERPRO',
      requiredCredentials: ['clientId', 'clientSecret'],
      createInstance: (credentials) => {
        throw new Error('Provedor SERPRO ainda não implementado');
      },
    });
  }

  async initializeProvider(type: ProviderType, credentials: ApiCredentials): Promise<BaseApiProvider> {
    const registration = this.providers.get(type);
    if (!registration) {
      throw new Error(`Provedor ${type} não encontrado`);
    }

    const provider = registration.createInstance(credentials);
    
    // Validar credenciais
    const isValid = await provider.validateCredentials();
    if (!isValid) {
      throw new Error(`Credenciais inválidas para o provedor ${registration.displayName}`);
    }

    this.activeProvider = provider;
    return provider;
  }

  async loadActiveProvider(): Promise<BaseApiProvider | null> {
    try {
      // Buscar configuração ativa do banco de dados
      const configs = await dasStorage.getAllApiConfigurations();
      const activeConfig = configs.find(config => config.is_active);

      if (!activeConfig) {
        return null;
      }

      const credentials = JSON.parse(activeConfig.credentials || '{}');
      return await this.initializeProvider(activeConfig.type as ProviderType, credentials);
    } catch (error) {
      console.error('Erro ao carregar provedor ativo:', error);
      return null;
    }
  }

  getActiveProvider(): BaseApiProvider | null {
    return this.activeProvider;
  }

  getAvailableProviders(): ProviderRegistration[] {
    return Array.from(this.providers.values());
  }

  getProviderInfo(type: ProviderType): ProviderRegistration | undefined {
    return this.providers.get(type);
  }

  registerCustomProvider(registration: ProviderRegistration): void {
    this.providers.set(registration.type, registration);
  }

  async switchProvider(type: ProviderType, credentials: ApiCredentials, userId: number): Promise<BaseApiProvider> {
    // Desativar configuração atual
    const configs = await dasStorage.getAllApiConfigurations();
    const activeConfig = configs.find(config => config.is_active);
    
    if (activeConfig) {
      await dasStorage.updateApiConfiguration(activeConfig.id, { is_active: false });
    }

    // Criar nova configuração
    const newConfig = await dasStorage.createApiConfiguration({
      type: type,
      name: this.getProviderInfo(type)?.displayName || type,
      credentials: JSON.stringify(credentials),
      configuration: JSON.stringify({}), // Configuração vazia por padrão
      is_active: true,
      created_by: userId,
    });

    // Registrar mudança
    await dasStorage.createApiChangeLog({
      apiId: newConfig.id,
      userId: userId,
      action: 'activation',
      changes: { provider: type, status: 'activated' },
    });

    return await this.initializeProvider(type, credentials);
  }

  async testProvider(type: ProviderType, credentials: ApiCredentials): Promise<boolean> {
    try {
      const provider = await this.initializeProvider(type, credentials);
      const testResult = await provider.testConnection();
      return testResult.success;
    } catch (error) {
      console.error('Erro ao testar provedor:', error);
      return false;
    }
  }

  getProviderStatus(): {
    configured: boolean;
    name: string;
    displayName: string;
    lastTest?: Date;
  } {
    if (!this.activeProvider) {
      return {
        configured: false,
        name: 'Nenhum',
        displayName: 'Nenhum provedor configurado',
      };
    }

    const info = this.activeProvider.getProviderInfo();
    return {
      configured: this.activeProvider.isConfigured(),
      name: info.name,
      displayName: info.displayName,
      lastTest: new Date(),
    };
  }

  async gerarDAS(cnpj: string, mesAno?: string): Promise<any> {
    if (!this.activeProvider) {
      throw new Error('Nenhum provedor DAS configurado');
    }

    // Usar o método específico da InfoSimples se disponível
    if (this.activeProvider instanceof InfoSimplesProvider) {
      return this.activeProvider.gerarDAS(cnpj, mesAno);
    }

    // Fallback para outros provedores que possam implementar generateDasGuia
    if ('generateDasGuia' in this.activeProvider) {
      return (this.activeProvider as any).generateDasGuia(cnpj, mesAno);
    }

    throw new Error('Provedor atual não suporta geração de DAS');
  }

  async gerarDASLote(clientes: Array<{id: number, cnpj: string, nome: string}>, mesAno?: string): Promise<any> {
    if (!this.activeProvider) {
      throw new Error('Nenhum provedor DAS configurado');
    }

    // Usar o método específico da InfoSimples se disponível
    if (this.activeProvider instanceof InfoSimplesProvider) {
      return this.activeProvider.gerarDASLote(clientes, mesAno);
    }

    // Fallback para processamento sequencial
    const resultados = [];
    for (const cliente of clientes) {
      try {
        const resultado = await this.gerarDAS(cliente.cnpj, mesAno);
        resultados.push({ cliente, resultado });
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

  async deactivateProvider(providerId: string): Promise<void> {
    console.log(`Deactivating provider: ${providerId}`);
    
    if (this.activeProvider && this.activeProvider.getName() === providerId) {
      this.activeProvider = null;
      console.log(`Provider ${providerId} deactivated`);
    }
  }

  async loadSavedConfigurations(): Promise<void> {
    try {
      console.log('🔄 Carregando configurações salvas...');
      const configurations = await dasStorage.getAllApiConfigurations();
      console.log(`📊 Total configurações: ${configurations.length}`);
      
      // Buscar configuração ativa do InfoSimples
      const activeInfosimples = configurations.find(c => 
        (c.name?.toLowerCase().includes('infosimples') || c.type === 'infosimples') && c.isActive
      );
      
      console.log('🔍 Configuração InfoSimples encontrada:', activeInfosimples ? 'SIM' : 'NÃO');
      
      if (activeInfosimples && activeInfosimples.credentials) {
        console.log('🚀 Ativando InfoSimples com credenciais salvas...');
        
        // Parse credentials if they're stored as JSON string
        let credentials = activeInfosimples.credentials;
        if (typeof credentials === 'string') {
          try {
            credentials = JSON.parse(credentials);
          } catch (parseError) {
            console.error('Erro ao fazer parse das credenciais:', parseError);
            return;
          }
        }
        
        console.log('🔑 Credenciais:', { ...credentials, token: credentials.token ? '***HIDDEN***' : undefined });
        
        this.activeProvider = new InfoSimplesProvider(credentials);
        console.log('✅ InfoSimples ativado automaticamente do banco de dados');
      } else {
        console.log('⚠️ Nenhuma configuração InfoSimples ativa encontrada');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar configurações salvas:', error);
    }
  }
}

export const providerManager = ApiProviderManager.getInstance();
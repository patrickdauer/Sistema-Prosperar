import { ApiConfiguration } from '../../das-storage';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export interface ApiCredentials {
  apiKey?: string;
  token?: string;
  username?: string;
  password?: string;
  endpoint?: string;
  [key: string]: any;
}

export interface ApiProviderConfig {
  name: string;
  displayName: string;
  description: string;
  requiredCredentials: string[];
  baseUrl: string;
  rateLimitPerMinute?: number;
  timeout?: number;
}

export abstract class BaseApiProvider {
  protected config: ApiProviderConfig;
  protected credentials: ApiCredentials;

  constructor(config: ApiProviderConfig, credentials: ApiCredentials) {
    this.config = config;
    this.credentials = credentials;
  }

  abstract validateCredentials(): Promise<boolean>;
  abstract testConnection(): Promise<ApiResponse>;
  
  protected async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.config.baseUrl}${endpoint}`;
      
      const response = await fetch(url, {
        timeout: this.config.timeout || 30000,
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
        statusCode: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  protected abstract getAuthHeaders(): Record<string, string>;

  getProviderInfo(): ApiProviderConfig {
    return this.config;
  }

  getName(): string {
    return this.config.name;
  }

  getDisplayName(): string {
    return this.config.displayName;
  }

  isConfigured(): boolean {
    return this.config.requiredCredentials.every(
      key => this.credentials[key] !== undefined && this.credentials[key] !== ''
    );
  }
}
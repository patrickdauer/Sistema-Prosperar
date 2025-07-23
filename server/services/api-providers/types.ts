export interface DasData {
  urlDas: string;
  dataVencimento: string;
  valorTotal: string;
  situacao: string;
  razaoSocial: string;
  periodo: string;
  numeroApuracao?: string;
  numeroDas?: string;
  codigoBarras?: string;
}

export interface DasResult {
  success: boolean;
  data?: DasData;
  error?: string;
}

export interface ApiProvider {
  generateDas(cnpj: string, periodo: string): Promise<DasResult>;
  testConnection(): Promise<boolean>;
  getName(): string;
  getType(): string;
}

export interface WhatsappProvider {
  sendMessage(phone: string, message: string, instanceId?: string): Promise<WhatsappResult>;
  testConnection(): Promise<boolean>;
  getName(): string;
}

export interface WhatsappResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SchedulerConfig {
  diasEnvio: number[]; // [2] para dia 2
  diasLembrete: number[]; // [20] para dia 20
  verificarDiasUteis: boolean;
  feriados: string[]; // ['2025-01-01', '2025-04-21']
}
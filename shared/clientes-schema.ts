import { z } from "zod";
import { pgTable, serial, varchar, text, integer, date, timestamp, boolean, decimal, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

// Tabela principal de clientes
export const clientes = pgTable("clientes", {
  id: serial("id").primaryKey(),
  
  // Informações básicas da empresa
  razaoSocial: varchar("razao_social", { length: 255 }),
  nomeFantasia: varchar("nome_fantasia", { length: 255 }),
  cnpj: varchar("cnpj", { length: 20 }),
  inscricaoEstadual: varchar("inscricao_estadual", { length: 50 }),
  inscricaoMunicipal: varchar("inscricao_municipal", { length: 50 }),
  
  // Endereço
  endereco: text("endereco"),
  cidade: varchar("cidade", { length: 100 }),
  estado: varchar("estado", { length: 2 }),
  cep: varchar("cep", { length: 10 }),
  bairro: varchar("bairro", { length: 100 }),
  complemento: varchar("complemento", { length: 100 }),
  
  // Contato
  telefoneComercial: varchar("telefone_comercial", { length: 20 }),
  telefoneAlternativo: varchar("telefone_alternativo", { length: 20 }),
  email: varchar("email", { length: 255 }),
  emailAlternativo: varchar("email_alternativo", { length: 255 }),
  site: varchar("site", { length: 255 }),
  
  // Informações fiscais
  regimeTributario: varchar("regime_tributario", { length: 50 }), // Simples, Lucro Presumido, Lucro Real
  atividadePrincipal: text("atividade_principal"),
  atividadesSecundarias: text("atividades_secundarias"),
  capitalSocial: decimal("capital_social", { precision: 15, scale: 2 }),
  
  // Dados bancários
  banco: varchar("banco", { length: 100 }),
  agencia: varchar("agencia", { length: 20 }),
  conta: varchar("conta", { length: 30 }),
  tipoConta: varchar("tipo_conta", { length: 20 }), // Corrente, Poupança
  
  // Informações do responsável
  responsavelNome: varchar("responsavel_nome", { length: 255 }),
  responsavelCpf: varchar("responsavel_cpf", { length: 15 }),
  responsavelRg: varchar("responsavel_rg", { length: 20 }),
  responsavelTelefone: varchar("responsavel_telefone", { length: 20 }),
  responsavelEmail: varchar("responsavel_email", { length: 255 }),
  
  // Informações contratuais
  dataInicioContrato: date("data_inicio_contrato"),
  dataFimContrato: date("data_fim_contrato"),
  valorMensalidade: decimal("valor_mensalidade", { precision: 10, scale: 2 }),
  diaVencimento: integer("dia_vencimento"),
  observacoesMensalidade: text("observacoes_mensalidade"), // Observações sobre negociação do cliente
  
  // Status Dívidas Tributárias
  temDebitos: varchar("tem_debitos", { length: 10 }), // sim, nao
  observacoesDebitos: text("observacoes_debitos"),
  temParcelamentos: varchar("tem_parcelamentos", { length: 10 }), // sim, nao
  observacoesParcelamentos: text("observacoes_parcelamentos"),
  temDividaAtiva: varchar("tem_divida_ativa", { length: 10 }), // sim, nao
  observacoesDividaAtiva: text("observacoes_divida_ativa"),
  
  // Status
  status: varchar("status", { length: 20 }).default("ativo"), // ativo, inativo, suspenso
  observacoes: text("observacoes"),

  // Imposto de Renda Pessoa Física
  impostoRenda: varchar("imposto_renda", { length: 10 }), // sim, nao, isento
  irAnoReferencia: varchar("ir_ano_referencia", { length: 4 }),
  irStatus: varchar("ir_status", { length: 30 }), // nao_entregue, entregue, em_processamento, pendente_retificacao
  irDataEntrega: date("ir_data_entrega"),
  irValorPagar: varchar("ir_valor_pagar", { length: 20 }),
  irValorRestituir: varchar("ir_valor_restituir", { length: 20 }),
  irObservacoes: text("ir_observacoes"),
  
  // Sócios (JSON)
  socios: json("socios"),
  
  // Metadados
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  
  // Informações adicionais
  certificadoDigital: boolean("certificado_digital").default(false),
  eCommerce: boolean("e_commerce").default(false),
  funcionarios: integer("funcionarios").default(0),
  
  // Serviços contratados
  contabilidade: boolean("contabilidade").default(true),
  departamentoPessoal: boolean("departamento_pessoal").default(false),
  consultoriaFiscal: boolean("consultoria_fiscal").default(false),
  auditoria: boolean("auditoria").default(false),
  aberturaMei: boolean("abertura_mei").default(false),
  
  // Documentos
  documentos: json("documentos"), // URLs dos documentos
  
  // Origem do cliente
  origem: varchar("origem", { length: 50 }), // website, indicacao, marketing, etc
  indicadoPor: varchar("indicado_por", { length: 255 }),
  
  // Status Operacional
  statusDas: varchar("status_das", { length: 100 }),
  statusEnvio: varchar("status_envio", { length: 100 }),
  linkMei: varchar("link_mei", { length: 255 }),
  
  // Informações empresariais adicionais
  telefoneEmpresa: varchar("telefone_empresa", { length: 20 }),
  emailEmpresa: varchar("email_empresa", { length: 255 }),
  contato: varchar("contato", { length: 100 }),
  celular: varchar("celular", { length: 20 }),
  contato2: varchar("contato_2", { length: 100 }),
  celular2: varchar("celular_2", { length: 20 }),
  
  // Informações adicionais
  nire: varchar("nire", { length: 50 }),
  notaServico: varchar("nota_servico", { length: 100 }),
  notaVenda: varchar("nota_venda", { length: 100 }),
  metragemOcupada: varchar("metragem_ocupada", { length: 50 }),
  dataAbertura: date("data_abertura"),
  clienteDesde: date("cliente_desde"),
  
  // Certificados digitais
  temCertificadoDigital: varchar("tem_certificado_digital", { length: 10 }),
  dataVencimentoCertificado: date("data_vencimento_certificado"),
  emissorCertificado: varchar("emissor_certificado", { length: 100 }),
  observacoesCertificado: text("observacoes_certificado"),
  
  // Certificados específicos
  certificadoDigitalEmpresa: varchar("certificado_digital_empresa", { length: 100 }),
  senhaCertificadoDigitalEmpresa: varchar("senha_certificado_digital_empresa", { length: 100 }),
  validadeCertificadoDigitalEmpresa: date("validade_certificado_digital_empresa"),
  certificadoEmpresa: varchar("certificado_empresa", { length: 100 }),
  senhaCertificadoEmpresa: varchar("senha_certificado_empresa", { length: 100 }),
  
  // Procurações
  temProcuracaoPj: varchar("tem_procuracao_pj", { length: 10 }),
  dataVencimentoProcuracaoPj: date("data_vencimento_procuracao_pj"),
  observacoesProcuracaoPj: text("observacoes_procuracao_pj"),
  temProcuracaoPf: varchar("tem_procuracao_pf", { length: 10 }),
  dataVencimentoProcuracaoPf: date("data_vencimento_procuracao_pf"),
  observacoesProcuracaoPf: text("observacoes_procuracao_pf"),
  
  // Procurações específicas
  procuracaoCnpjContabilidade: varchar("procuracao_cnpj_contabilidade", { length: 100 }),
  procuracaoCnpjCpf: varchar("procuracao_cnpj_cpf", { length: 100 }),
  
  // Informações sócio 1
  socio1: varchar("socio_1", { length: 255 }),
  cpfSocio1: varchar("cpf_socio_1", { length: 15 }),
  senhaGovSocio1: varchar("senha_gov_socio_1", { length: 100 }),
  certificadoSocio1: varchar("certificado_socio_1", { length: 100 }),
  senhaCertificadoSocio1: varchar("senha_certificado_socio_1", { length: 100 }),
  validadeCertificadoSocio1: date("validade_certificado_socio_1"),
  procuracaoSocio1: varchar("procuracao_socio_1", { length: 100 }),
  nacionalidadeSocio1: varchar("nacionalidade_socio_1", { length: 100 }),
  nascimentoSocio1: date("nascimento_socio_1"),
  filiacaoSocio1: varchar("filiacao_socio_1", { length: 255 }),
  profissaoSocio1: varchar("profissao_socio_1", { length: 100 }),
  estadoCivilSocio1: varchar("estado_civil_socio_1", { length: 50 }),
  enderecoSocio1: text("endereco_socio_1"),
  telefoneSocio1: varchar("telefone_socio_1", { length: 20 }),
  emailSocio1: varchar("email_socio_1", { length: 255 }),
  cnhSocio1: varchar("cnh_socio_1", { length: 50 }),
  rgSocio1: varchar("rg_socio_1", { length: 20 }),
  certidaoCasamentoSocio1: varchar("certidao_casamento_socio_1", { length: 100 }),
  
  // Status financeiro adicional
  mensalidadeComFaturamento: varchar("mensalidade_com_faturamento", { length: 10 }),
  mensalidadeSemFaturamento: varchar("mensalidade_sem_faturamento", { length: 10 }),
  
  // Links do Google Drive
  linkGoogleDrive: varchar("link_google_drive", { length: 255 }),
  linkGoogleDriveCompartilhado: varchar("link_google_drive_compartilhado", { length: 255 }),
  linkGoogleDrivePublico: varchar("link_google_drive_publico", { length: 255 }),
  linkEspecifico: varchar("link_especifico", { length: 255 }),
  
  // Observações específicas
  observacoesGerais: text("observacoes_gerais"),
  observacoesGoogleDrive: text("observacoes_google_drive"),
  observacoesAtividades: text("observacoes_atividades")
});

// Schema de inserção - apenas razão social obrigatória
export const insertClienteSchema = createInsertSchema(clientes).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  razaoSocial: z.string().min(1, "Razão social é obrigatória")
}).partial().required({ razaoSocial: true });

// Schema de sócio
export const socioSchema = z.object({
  nomeCompleto: z.string().optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  nacionalidade: z.string().optional(),
  estadoCivil: z.string().optional(),
  profissao: z.string().optional(),
  endereco: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().optional(),
  participacao: z.string().optional(),
  tipoParticipacao: z.string().optional(),
  dataNascimento: z.string().optional(),
  filiacao: z.string().optional()
});

// Types
export type Cliente = typeof clientes.$inferSelect;
export type InsertCliente = z.infer<typeof insertClienteSchema>;
export type Socio = z.infer<typeof socioSchema>;

// Relations
export const clientesRelations = relations(clientes, ({ many }) => ({
  // Futuras relações com outras tabelas
}));
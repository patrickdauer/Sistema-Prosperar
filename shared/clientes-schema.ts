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
  indicadoPor: varchar("indicado_por", { length: 255 })
});

// Schema de inserção
export const insertClienteSchema = createInsertSchema(clientes).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

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
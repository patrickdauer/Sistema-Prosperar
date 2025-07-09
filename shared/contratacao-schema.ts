import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const contratacaoFuncionarios = pgTable("contratacao_funcionarios", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  
  // Dados da Empresa
  razaoSocial: varchar("razao_social", { length: 255 }).notNull(),
  cnpj: varchar("cnpj", { length: 18 }).notNull(),
  endereco: text("endereco").notNull(),
  telefone: varchar("telefone", { length: 20 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  responsavel: varchar("responsavel", { length: 255 }).notNull(),
  
  // Dados do Funcionário
  nomeFuncionario: varchar("nome_funcionario", { length: 255 }).notNull(),
  cpfFuncionario: varchar("cpf_funcionario", { length: 14 }).notNull(),
  rgFuncionario: varchar("rg_funcionario", { length: 20 }).notNull(),
  dataNascimento: varchar("data_nascimento", { length: 10 }).notNull(),
  estadoCivil: varchar("estado_civil", { length: 20 }).notNull(),
  escolaridade: varchar("escolaridade", { length: 20 }).notNull(),
  endereco_funcionario: text("endereco_funcionario").notNull(),
  telefone_funcionario: varchar("telefone_funcionario", { length: 20 }).notNull(),
  email_funcionario: varchar("email_funcionario", { length: 255 }).notNull(),
  
  // Dados do Cargo
  cargo: varchar("cargo", { length: 255 }).notNull(),
  setor: varchar("setor", { length: 255 }).notNull(),
  salario: varchar("salario", { length: 20 }).notNull(),
  cargaHoraria: varchar("carga_horaria", { length: 10 }).notNull(),
  tipoContrato: varchar("tipo_contrato", { length: 20 }).notNull(),
  dataAdmissao: varchar("data_admissao", { length: 10 }).notNull(),
  
  // Benefícios
  valeTransporte: boolean("vale_transporte").default(false),
  valeRefeicao: boolean("vale_refeicao").default(false),
  valeAlimentacao: boolean("vale_alimentacao").default(false),
  planoSaude: boolean("plano_saude").default(false),
  planoDental: boolean("plano_dental").default(false),
  seguroVida: boolean("seguro_vida").default(false),
  
  // Documentos e Observações
  possuiCarteira: varchar("possui_carteira", { length: 3 }).notNull(),
  numeroPis: varchar("numero_pis", { length: 20 }),
  observacoes: text("observacoes"),
  
  // Dados Bancários
  banco: varchar("banco", { length: 255 }).notNull(),
  agencia: varchar("agencia", { length: 10 }).notNull(),
  conta: varchar("conta", { length: 20 }).notNull(),
  tipoConta: varchar("tipo_conta", { length: 10 }).notNull(),
  
  // Google Drive
  googleDriveLink: varchar("google_drive_link", { length: 500 }),
  
  // Metadados
  createdAt: timestamp("created_at").defaultNow(),
  status: varchar("status", { length: 20 }).default("pending")
});

export const insertContratacaoSchema = createInsertSchema(contratacaoFuncionarios).omit({
  id: true,
  createdAt: true,
  status: true
});

export type ContratacaoFuncionario = typeof contratacaoFuncionarios.$inferSelect;
export type InsertContratacaoFuncionario = z.infer<typeof insertContratacaoSchema>;
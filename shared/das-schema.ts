import { pgTable, text, integer, timestamp, boolean, jsonb, serial } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Tabela para armazenar as configurações das APIs
export const apiConfigurations = pgTable("api_configurations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Nome da API (ex: "InfoSimples", "Evolution API", "SendGrid")
  type: text("type").notNull(), // Tipo: "das_provider", "whatsapp", "email"
  isActive: boolean("is_active").default(false), // Se está ativa
  credentials: jsonb("credentials").notNull(), // Credenciais (tokens, keys, etc.)
  configuration: jsonb("configuration").notNull(), // Configurações específicas (URLs, etc.)
  documentation: text("documentation"), // Link para documentação
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
});

// Tabela para logs de alterações nas APIs
export const apiChangeLogs = pgTable("api_change_logs", {
  id: serial("id").primaryKey(),
  apiId: integer("api_id").references(() => apiConfigurations.id).notNull(),
  action: text("action").notNull(), // "created", "updated", "activated", "deactivated"
  changes: jsonb("changes").notNull(), // Detalhes das alterações
  userId: integer("user_id").references(() => users.id).notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Tabela para clientes MEI
export const clientesMei = pgTable("clientes_mei", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  cnpj: text("cnpj").notNull().unique(),
  telefone: text("telefone"),
  email: text("email"),
  dataEnvio: integer("data_envio").default(10), // Dia do mês para envio (padrão 10)
  dataVencimento: integer("data_vencimento").default(20), // Dia do mês do vencimento (padrão 20)
  isActive: boolean("is_active").default(true),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela para armazenar as guias DAS baixadas
export const dasGuias = pgTable("das_guias", {
  id: serial("id").primaryKey(),
  clienteMeiId: integer("cliente_mei_id").references(() => clientesMei.id).notNull(),
  mesAno: text("mes_ano").notNull(), // Formato: "2025-01"
  dataVencimento: timestamp("data_vencimento").notNull(),
  valor: text("valor"),
  filePath: text("file_path"), // Caminho do arquivo PDF
  fileName: text("file_name"),
  downloadedAt: timestamp("downloaded_at"),
  downloadStatus: text("download_status").default("pending"), // "pending", "success", "failed"
  downloadError: text("download_error"),
  provider: text("provider"), // Qual API foi usada para baixar
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela para logs de envios
export const envioLogs = pgTable("envio_logs", {
  id: serial("id").primaryKey(),
  dasGuiaId: integer("das_guia_id").references(() => dasGuias.id).notNull(),
  tipoEnvio: text("tipo_envio").notNull(), // "whatsapp", "email", "lembrete_whatsapp", "lembrete_email"
  status: text("status").notNull(), // "pending", "sent", "failed"
  mensagem: text("mensagem"),
  resposta: jsonb("resposta"), // Resposta da API
  enviadoEm: timestamp("enviado_em"),
  tentativas: integer("tentativas").default(0),
  ultimoErro: text("ultimo_erro"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela para programação de envios
export const programacaoEnvios = pgTable("programacao_envios", {
  id: serial("id").primaryKey(),
  dasGuiaId: integer("das_guia_id").references(() => dasGuias.id).notNull(),
  dataAgendada: timestamp("data_agendada").notNull(),
  tipoEnvio: text("tipo_envio").notNull(), // "das_envio", "lembrete_vencimento"
  status: text("status").default("agendado"), // "agendado", "processado", "cancelado"
  processadoEm: timestamp("processado_em"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Importar users do sistema existente
import { users } from "./schema";

// Relações
export const apiConfigurationsRelations = relations(apiConfigurations, ({ one, many }) => ({
  createdBy: one(users, { fields: [apiConfigurations.createdBy], references: [users.id] }),
  updatedBy: one(users, { fields: [apiConfigurations.updatedBy], references: [users.id] }),
  changeLogs: many(apiChangeLogs),
}));

export const apiChangeLogsRelations = relations(apiChangeLogs, ({ one }) => ({
  api: one(apiConfigurations, { fields: [apiChangeLogs.apiId], references: [apiConfigurations.id] }),
  user: one(users, { fields: [apiChangeLogs.userId], references: [users.id] }),
}));

export const clientesMeiRelations = relations(clientesMei, ({ many }) => ({
  guias: many(dasGuias),
}));

export const dasGuiasRelations = relations(dasGuias, ({ one, many }) => ({
  clienteMei: one(clientesMei, { fields: [dasGuias.clienteMeiId], references: [clientesMei.id] }),
  envioLogs: many(envioLogs),
  programacaoEnvios: many(programacaoEnvios),
}));

export const envioLogsRelations = relations(envioLogs, ({ one }) => ({
  dasGuia: one(dasGuias, { fields: [envioLogs.dasGuiaId], references: [dasGuias.id] }),
}));

export const programacaoEnviosRelations = relations(programacaoEnvios, ({ one }) => ({
  dasGuia: one(dasGuias, { fields: [programacaoEnvios.dasGuiaId], references: [dasGuias.id] }),
}));

// Schemas para validação
export const insertApiConfigurationSchema = createInsertSchema(apiConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClienteMeiSchema = createInsertSchema(clientesMei).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDasGuiaSchema = createInsertSchema(dasGuias).omit({
  id: true,
  createdAt: true,
});

export const insertEnvioLogSchema = createInsertSchema(envioLogs).omit({
  id: true,
  createdAt: true,
});

export const insertProgramacaoEnvioSchema = createInsertSchema(programacaoEnvios).omit({
  id: true,
  createdAt: true,
});

// Tipos TypeScript
export type ApiConfiguration = typeof apiConfigurations.$inferSelect;
export type InsertApiConfiguration = z.infer<typeof insertApiConfigurationSchema>;

export type ApiChangeLog = typeof apiChangeLogs.$inferSelect;
export type InsertApiChangeLog = typeof apiChangeLogs.$inferInsert;

export type ClienteMei = typeof clientesMei.$inferSelect;
export type InsertClienteMei = z.infer<typeof insertClienteMeiSchema>;

export type DasGuia = typeof dasGuias.$inferSelect;
export type InsertDasGuia = z.infer<typeof insertDasGuiaSchema>;

export type EnvioLog = typeof envioLogs.$inferSelect;
export type InsertEnvioLog = z.infer<typeof insertEnvioLogSchema>;

export type ProgramacaoEnvio = typeof programacaoEnvios.$inferSelect;
export type InsertProgramacaoEnvio = z.infer<typeof insertProgramacaoEnvioSchema>;
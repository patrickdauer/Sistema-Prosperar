import { pgTable, text, integer, timestamp, boolean, jsonb, serial } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";

// Tabela para templates de mensagens
export const messageTemplates = pgTable("message_templates", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  tipo: text("tipo").notNull(), // "boleto_disponivel", "boleto_pago", "lembrete_vencimento"
  conteudo: text("conteudo").notNull(),
  ativo: boolean("ativo").default(true),
  variaveis: jsonb("variaveis"), // Lista de variáveis disponíveis
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela para instâncias Evolution API
export const evolutionInstances = pgTable("evolution_instances", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  instanceName: text("instance_name").notNull(),
  serverUrl: text("server_url").notNull(),
  token: text("token").notNull(),
  ativo: boolean("ativo").default(true),
  configuracao: jsonb("configuracao"), // Configurações específicas
  ultimoTeste: timestamp("ultimo_teste"),
  statusTeste: text("status_teste"), // "success", "failed"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela para logs detalhados do sistema
export const systemLogs = pgTable("system_logs", {
  id: serial("id").primaryKey(),
  tipoOperacao: text("tipo_operacao").notNull(), // "geracao_boleto", "envio_whatsapp", "retry", "agendamento"
  clienteId: integer("cliente_id"),
  status: text("status").notNull(), // "success", "failed", "pending"
  detalhes: jsonb("detalhes"),
  periodo: text("periodo"), // YYYYMM
  operador: text("operador"), // "automatico" ou user_id
  timestamp: timestamp("timestamp").defaultNow(),
});

// Tabela para configurações do sistema de automação
export const automationSettings = pgTable("automation_settings", {
  id: serial("id").primaryKey(),
  chave: text("chave").notNull().unique(), // "dia_geracao", "dia_envio", "dia_lembrete", etc.
  valor: text("valor").notNull(),
  descricao: text("descricao"),
  tipo: text("tipo").default("string"), // "string", "number", "boolean", "json"
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
});

// Tabela para feriados nacionais
export const feriados = pgTable("feriados", {
  id: serial("id").primaryKey(),
  data: timestamp("data").notNull(),
  descricao: text("descricao").notNull(),
  nacional: boolean("nacional").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela de retry center para falhas
export const retryQueue = pgTable("retry_queue", {
  id: serial("id").primaryKey(),
  tipoOperacao: text("tipo_operacao").notNull(), // "geracao_boleto", "envio_whatsapp"
  clienteId: integer("cliente_id").notNull(),
  dadosOriginais: jsonb("dados_originais").notNull(),
  erro: text("erro"),
  tentativas: integer("tentativas").default(0),
  maxTentativas: integer("max_tentativas").default(3),
  proximaTentativa: timestamp("proxima_tentativa"),
  status: text("status").default("pending"), // "pending", "processing", "success", "failed"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schemas de validação
export const insertMessageTemplateSchema = createInsertSchema(messageTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEvolutionInstanceSchema = createInsertSchema(evolutionInstances).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSystemLogSchema = createInsertSchema(systemLogs).omit({
  id: true,
  timestamp: true,
});

export const insertAutomationSettingSchema = createInsertSchema(automationSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertFeriadoSchema = createInsertSchema(feriados).omit({
  id: true,
  createdAt: true,
});

export const insertRetryQueueSchema = createInsertSchema(retryQueue).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Tipos
export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type InsertMessageTemplate = z.infer<typeof insertMessageTemplateSchema>;

export type EvolutionInstance = typeof evolutionInstances.$inferSelect;
export type InsertEvolutionInstance = z.infer<typeof insertEvolutionInstanceSchema>;

export type SystemLog = typeof systemLogs.$inferSelect;
export type InsertSystemLog = z.infer<typeof insertSystemLogSchema>;

export type AutomationSetting = typeof automationSettings.$inferSelect;
export type InsertAutomationSetting = z.infer<typeof insertAutomationSettingSchema>;

export type Feriado = typeof feriados.$inferSelect;
export type InsertFeriado = z.infer<typeof insertFeriadoSchema>;

export type RetryQueue = typeof retryQueue.$inferSelect;
export type InsertRetryQueue = z.infer<typeof insertRetryQueueSchema>;
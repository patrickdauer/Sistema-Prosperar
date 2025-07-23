import { pgTable, text, integer, timestamp, boolean, jsonb, serial, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";

// Tabela para templates de mensagens WhatsApp
export const messageTemplates = pgTable("message_templates", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  tipo: text("tipo").notNull(), // "boleto_disponivel", "boleto_pago", "lembrete_vencimento"
  conteudo: text("conteudo").notNull(),
  variaveis: jsonb("variaveis").notNull(), // {nome}, {valor}, {vencimento}, {razao_social}
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela para instâncias Evolution API
export const evolutionInstances = pgTable("evolution_instances", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  instanceName: text("instance_name").notNull(),
  token: text("token").notNull(),
  serverUrl: text("server_url").notNull(),
  ativo: boolean("ativo").default(true),
  ultimoUso: timestamp("ultimo_uso"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela expandida para clientes MEI
export const clientesMeiExpanded = pgTable("clientes_mei_expanded", {
  id: serial("id").primaryKey(),
  cnpj: text("cnpj").notNull().unique(),
  razaoSocial: text("razao_social").notNull(),
  telefone: text("telefone"),
  email: text("email"),
  ativoAutomacao: boolean("ativo_automacao").default(true),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela para boletos gerados
export const boletosGerados = pgTable("boletos_gerados", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id").references(() => clientesMeiExpanded.id).notNull(),
  periodo: text("periodo").notNull(), // YYYYMM
  urlBoleto: text("url_boleto"),
  valor: decimal("valor", { precision: 10, scale: 2 }),
  situacao: text("situacao"), // "Devedor", "Pago"
  dataVencimento: timestamp("data_vencimento"),
  dataGeracao: timestamp("data_geracao").defaultNow(),
  statusApi: text("status_api").default("pending"), // "pending", "success", "error"
  erroApi: text("erro_api"),
  provider: text("provider"), // "infosimples", etc
});

// Tabela para envios WhatsApp
export const enviosWhatsapp = pgTable("envios_whatsapp", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id").references(() => clientesMeiExpanded.id).notNull(),
  boletoId: integer("boleto_id").references(() => boletosGerados.id),
  tipoMensagem: text("tipo_mensagem").notNull(), // "boleto_disponivel", "boleto_pago", "lembrete_vencimento"
  instanciaEvolution: integer("instancia_evolution").references(() => evolutionInstances.id),
  statusEnvio: text("status_envio").default("pending"), // "pending", "sent", "error"
  dataEnvio: timestamp("data_envio"),
  tentativas: integer("tentativas").default(0),
  ultimoErro: text("ultimo_erro"),
  respostaApi: jsonb("resposta_api"),
});

// Tabela para logs do sistema
export const systemLogs = pgTable("system_logs", {
  id: serial("id").primaryKey(),
  tipoOperacao: text("tipo_operacao").notNull(), // "gerar_boleto", "enviar_whatsapp", "lembrete"
  clienteId: integer("cliente_id").references(() => clientesMeiExpanded.id),
  status: text("status").notNull(), // "success", "error", "pending"
  detalhes: jsonb("detalhes"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Relações
export const clientesMeiExpandedRelations = relations(clientesMeiExpanded, ({ many }) => ({
  boletos: many(boletosGerados),
  envios: many(enviosWhatsapp),
  logs: many(systemLogs),
}));

export const boletosGeradosRelations = relations(boletosGerados, ({ one, many }) => ({
  cliente: one(clientesMeiExpanded, {
    fields: [boletosGerados.clienteId],
    references: [clientesMeiExpanded.id],
  }),
  envios: many(enviosWhatsapp),
}));

export const enviosWhatsappRelations = relations(enviosWhatsapp, ({ one }) => ({
  cliente: one(clientesMeiExpanded, {
    fields: [enviosWhatsapp.clienteId],
    references: [clientesMeiExpanded.id],
  }),
  boleto: one(boletosGerados, {
    fields: [enviosWhatsapp.boletoId],
    references: [boletosGerados.id],
  }),
  instancia: one(evolutionInstances, {
    fields: [enviosWhatsapp.instanciaEvolution],
    references: [evolutionInstances.id],
  }),
}));

// Schemas de validação
export const insertClienteMeiExpandedSchema = createInsertSchema(clientesMeiExpanded).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBoletoGeradoSchema = createInsertSchema(boletosGerados).omit({
  id: true,
  dataGeracao: true,
});

export const insertEnvioWhatsappSchema = createInsertSchema(enviosWhatsapp).omit({
  id: true,
});

export const insertMessageTemplateSchema = createInsertSchema(messageTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEvolutionInstanceSchema = createInsertSchema(evolutionInstances).omit({
  id: true,
  createdAt: true,
});

// Tipos TypeScript
export type ClienteMeiExpanded = typeof clientesMeiExpanded.$inferSelect;
export type InsertClienteMeiExpanded = z.infer<typeof insertClienteMeiExpandedSchema>;

export type BoletoGerado = typeof boletosGerados.$inferSelect;
export type InsertBoletoGerado = z.infer<typeof insertBoletoGeradoSchema>;

export type EnvioWhatsapp = typeof enviosWhatsapp.$inferSelect;
export type InsertEnvioWhatsapp = z.infer<typeof insertEnvioWhatsappSchema>;

export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type InsertMessageTemplate = z.infer<typeof insertMessageTemplateSchema>;

export type EvolutionInstance = typeof evolutionInstances.$inferSelect;
export type InsertEvolutionInstance = z.infer<typeof insertEvolutionInstanceSchema>;

export type SystemLog = typeof systemLogs.$inferSelect;
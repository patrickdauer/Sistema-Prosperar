import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const businessRegistrations = pgTable("business_registrations", {
  id: serial("id").primaryKey(),
  // Company Data
  razaoSocial: text("razao_social").notNull(),
  nomeFantasia: text("nome_fantasia").notNull(),
  endereco: text("endereco").notNull(),
  inscricaoImobiliaria: text("inscricao_imobiliaria").notNull(),
  metragem: integer("metragem").notNull(),
  telefoneEmpresa: text("telefone_empresa").notNull(),
  emailEmpresa: text("email_empresa").notNull(),
  capitalSocial: text("capital_social").notNull(),
  atividadePrincipal: text("atividade_principal").notNull(),
  atividadesSecundarias: text("atividades_secundarias"),
  atividadesSugeridas: text("atividades_sugeridas").array(),
  
  // Partner Data
  nomeCompleto: text("nome_completo").notNull(),
  nacionalidade: text("nacionalidade").notNull(),
  cpf: text("cpf").notNull(),
  senhaGov: text("senha_gov").notNull(),
  rg: text("rg").notNull(),
  dataNascimento: text("data_nascimento").notNull(),
  filiacao: text("filiacao").notNull(),
  profissao: text("profissao").notNull(),
  estadoCivil: text("estado_civil").notNull(),
  enderecoPessoal: text("endereco_pessoal").notNull(),
  telefonePessoal: text("telefone_pessoal").notNull(),
  emailPessoal: text("email_pessoal").notNull(),
  
  // File Information
  documentoComFotoUrl: text("documento_com_foto_url"),
  certidaoCasamentoUrl: text("certidao_casamento_url"),
  documentosAdicionaisUrls: text("documentos_adicionais_urls").array(),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  status: text("status").default("pending"),
});

export const insertBusinessRegistrationSchema = createInsertSchema(businessRegistrations).omit({
  id: true,
  createdAt: true,
  status: true,
});

export type InsertBusinessRegistration = z.infer<typeof insertBusinessRegistrationSchema>;
export type BusinessRegistration = typeof businessRegistrations.$inferSelect;

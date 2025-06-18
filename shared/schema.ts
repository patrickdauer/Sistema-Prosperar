import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Schema for partner data
export const partnerSchema = z.object({
  nomeCompleto: z.string().min(1, "Nome completo é obrigatório"),
  nacionalidade: z.string().min(1, "Nacionalidade é obrigatória"),
  cpf: z.string().min(1, "CPF é obrigatório"),
  senhaGov: z.string().min(1, "Senha do Gov é obrigatória"),
  rg: z.string().min(1, "RG é obrigatório"),
  dataNascimento: z.string().min(1, "Data de nascimento é obrigatória"),
  filiacao: z.string().min(1, "Filiação é obrigatória"),
  profissao: z.string().min(1, "Profissão é obrigatória"),
  estadoCivil: z.string().min(1, "Estado civil é obrigatório"),
  enderecoPessoal: z.string().min(1, "Endereço pessoal é obrigatório"),
  telefonePessoal: z.string().min(1, "Telefone pessoal é obrigatório"),
  emailPessoal: z.string().email("Email inválido"),
  documentoComFotoUrl: z.string().optional(),
  certidaoCasamentoUrl: z.string().optional(),
  documentosAdicionaisUrls: z.array(z.string()).optional(),
});

export type Partner = z.infer<typeof partnerSchema>;

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
  
  // Partners Data (JSON array)
  socios: jsonb("socios").notNull(),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  status: text("status").default("pending"),
});

export const insertBusinessRegistrationSchema = createInsertSchema(businessRegistrations).omit({
  id: true,
  createdAt: true,
  status: true,
}).extend({
  socios: z.array(partnerSchema).min(1, "Pelo menos um sócio é obrigatório"),
});

export type InsertBusinessRegistration = z.infer<typeof insertBusinessRegistrationSchema>;
export type BusinessRegistration = typeof businessRegistrations.$inferSelect;

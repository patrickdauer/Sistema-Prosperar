import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

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

// Users table for internal team authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("employee"), // admin, manager, employee
  department: text("department"), // societario, fiscal, pessoal
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Task templates for each department
export const taskTemplates = pgTable("task_templates", {
  id: serial("id").primaryKey(),
  department: text("department").notNull(), // societario, fiscal, pessoal
  title: text("title").notNull(),
  description: text("description"),
  order: integer("order").notNull(),
  isRequired: boolean("is_required").default(true),
  estimatedDays: integer("estimated_days").default(3),
});

// Tasks for each business registration
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  businessRegistrationId: integer("business_registration_id").notNull(),
  templateId: integer("template_id"),
  title: text("title").notNull(),
  description: text("description"),
  department: text("department").notNull(),
  status: text("status").default("pending"), // pending, in_progress, completed, blocked
  assignedTo: integer("assigned_to"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  order: integer("order").notNull(),
  observacao: text("observacao"), // Campo de observação
  dataLembrete: timestamp("data_lembrete"), // Campo de data de lembrete
});

// Task files/documents
export const taskFiles = pgTable("task_files", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  uploadedBy: integer("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Activity log for notifications and timeline
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  businessRegistrationId: integer("business_registration_id").notNull(),
  taskId: integer("task_id"),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(), // created, updated, completed, file_uploaded, etc.
  description: text("description").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define relationships
export const businessRegistrationsRelations = relations(businessRegistrations, ({ many }) => ({
  tasks: many(tasks),
  activities: many(activities),
}));

export const usersRelations = relations(users, ({ many }) => ({
  assignedTasks: many(tasks),
  uploadedFiles: many(taskFiles),
  activities: many(activities),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  businessRegistration: one(businessRegistrations, {
    fields: [tasks.businessRegistrationId],
    references: [businessRegistrations.id],
  }),
  template: one(taskTemplates, {
    fields: [tasks.templateId],
    references: [taskTemplates.id],
  }),
  assignee: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
  }),
  files: many(taskFiles),
  activities: many(activities),
}));

export const taskFilesRelations = relations(taskFiles, ({ one }) => ({
  task: one(tasks, {
    fields: [taskFiles.taskId],
    references: [tasks.id],
  }),
  uploader: one(users, {
    fields: [taskFiles.uploadedBy],
    references: [users.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  businessRegistration: one(businessRegistrations, {
    fields: [activities.businessRegistrationId],
    references: [businessRegistrations.id],
  }),
  task: one(tasks, {
    fields: [activities.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertTaskFileSchema = createInsertSchema(taskFiles).omit({
  id: true,
  uploadedAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type TaskFile = typeof taskFiles.$inferSelect;
export type InsertTaskFile = z.infer<typeof insertTaskFileSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type TaskTemplate = typeof taskTemplates.$inferSelect;

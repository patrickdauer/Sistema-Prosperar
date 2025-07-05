import { z } from "zod";
import { pgTable, serial, varchar, text, integer, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { clientes } from "./clientes-schema";

export const irHistorico = pgTable("ir_historico", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id").notNull().references(() => clientes.id, { onDelete: 'cascade' }),
  ano: integer("ano").notNull(),
  status: varchar("status", { length: 30 }),
  dataEntrega: date("data_entrega"),
  valorPagar: varchar("valor_pagar", { length: 20 }),
  valorRestituir: varchar("valor_restituir", { length: 20 }),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertIrHistoricoSchema = createInsertSchema(irHistorico).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type IrHistorico = typeof irHistorico.$inferSelect;
export type InsertIrHistorico = z.infer<typeof insertIrHistoricoSchema>;

export const irHistoricoRelations = relations(irHistorico, ({ one }) => ({
  cliente: one(clientes, {
    fields: [irHistorico.clienteId],
    references: [clientes.id],
  }),
}));
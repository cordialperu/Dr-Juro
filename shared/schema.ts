import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users Table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Clients Table
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  contactInfo: text("contact_info"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Cases Table (Expedientes)
export const cases = pgTable("cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("active").notNull(), // e.g., active, closed, pending
  clientId: varchar("client_id").references(() => clients.id),
  userId: varchar("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Precedents Table (Jurisprudencia)
export const precedents = pgTable("precedents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tribunal: text("tribunal"),
  sala: text("sala"),
  fecha: timestamp("fecha"),
  expediente: text("expediente"),
  tipo_resolucion: text("tipo_resolucion"), // e.g., ejecutoria_vinculante, plenario
  resumen: text("resumen"),
  texto_completo: text("texto_completo"),
  articulos_citados: jsonb("articulos_citados").default([]), // Array of strings
  enlaces_oficiales: jsonb("enlaces_oficiales").default([]), // Array of strings
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Doctrina Table
export const doctrinas = pgTable("doctrinas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  autor: text("autor"),
  obra: text("obra"),
  ano: varchar("ano", { length: 4 }),
  extracto: text("extracto"),
  palabras_clave: jsonb("palabras_clave").default([]),
  link_repositorio: text("link_repositorio"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  priority: varchar("priority", { length: 20 }).default("medium").notNull(),
  dueDate: timestamp("due_date"),
  caseId: varchar("case_id").references(() => cases.id),
  assignedTo: varchar("assigned_to").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Case Documents Table (Documentos del caso)
export const caseDocuments = pgTable("case_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").references(() => cases.id).notNull(),
  filename: text("filename").notNull(),
  fileType: text("file_type"),
  category: varchar("category", { length: 50 }).notNull(), // notifications, police-report, additional
  content: text("content"), // Texto extraído
  notes: text("notes"), // Notas del abogado
  uploadDate: timestamp("upload_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Case Process State Table (Estado del proceso legal)
export const caseProcessState = pgTable("case_process_state", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").references(() => cases.id).notNull().unique(),
  currentPhase: varchar("current_phase", { length: 50 }).notNull(), // client-info, investigation, strategy, meeting, followup
  completionPercentage: varchar("completion_percentage", { length: 3 }).default("0").notNull(),
  
  // Información del cliente
  clientInfo: jsonb("client_info").default({}).notNull(),
  
  // Progreso de investigación
  investigationProgress: jsonb("investigation_progress").default({}).notNull(),
  
  // Estrategia del caso
  caseStrategy: jsonb("case_strategy").default({}).notNull(),
  
  // Cita con cliente
  clientMeeting: jsonb("client_meeting").default({}).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Document Folders Table (Carpetas de documentos por fase)
export const documentFolders = pgTable("document_folders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id).notNull(),
  phase: varchar("phase", { length: 50 }).notNull(), // investigacion, estrategia, reunion, seguimiento
  folderType: varchar("folder_type", { length: 100 }).notNull(), // denuncias, notificaciones, etc.
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Client Documents Table (Documentos individuales)
export const clientDocuments = pgTable("client_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  folderId: varchar("folder_id").references(() => documentFolders.id).notNull(),
  clientId: varchar("client_id").references(() => clients.id).notNull(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(), // pdf, image, docx, txt
  fileSize: varchar("file_size", { length: 20 }), // en bytes
  extractedText: text("extracted_text"), // texto extraído del documento
  isProcessed: varchar("is_processed", { length: 10 }).default("false").notNull(), // true/false
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  metadata: jsonb("metadata").default({}), // páginas, dimensiones, etc.
});

// Consolidated Context Table (Texto consolidado por carpeta)
export const consolidatedContext = pgTable("consolidated_context", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id).notNull(),
  folderId: varchar("folder_id").references(() => documentFolders.id).notNull().unique(),
  phase: varchar("phase", { length: 50 }).notNull(),
  consolidatedText: text("consolidated_text").notNull(),
  documentCount: varchar("document_count", { length: 10 }).default("0").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  tokenCount: varchar("token_count", { length: 20 }), // para controlar límites del LLM
});

// Zod schemas for validation
export const insertClientSchema = createInsertSchema(clients);
export const insertCaseSchema = createInsertSchema(cases);
export const insertPrecedentSchema = createInsertSchema(precedents);
export const insertDoctrinaSchema = createInsertSchema(doctrinas);
export const insertTaskSchema = createInsertSchema(tasks);
export const insertCaseDocumentSchema = createInsertSchema(caseDocuments);
export const insertCaseProcessStateSchema = createInsertSchema(caseProcessState);
export const insertDocumentFolderSchema = createInsertSchema(documentFolders);
export const insertClientDocumentSchema = createInsertSchema(clientDocuments);
export const insertConsolidatedContextSchema = createInsertSchema(consolidatedContext);

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Case = typeof cases.$inferSelect;
export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Precedent = typeof precedents.$inferSelect;
export type InsertPrecedent = z.infer<typeof insertPrecedentSchema>;
export type Doctrina = typeof doctrinas.$inferSelect;
export type InsertDoctrina = z.infer<typeof insertDoctrinaSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type CaseDocument = typeof caseDocuments.$inferSelect;
export type InsertCaseDocument = z.infer<typeof insertCaseDocumentSchema>;
export type CaseProcessState = typeof caseProcessState.$inferSelect;
export type InsertCaseProcessState = z.infer<typeof insertCaseProcessStateSchema>;
export type DocumentFolder = typeof documentFolders.$inferSelect;
export type InsertDocumentFolder = z.infer<typeof insertDocumentFolderSchema>;
export type ClientDocument = typeof clientDocuments.$inferSelect;
export type InsertClientDocument = z.infer<typeof insertClientDocumentSchema>;
export type ConsolidatedContext = typeof consolidatedContext.$inferSelect;
export type InsertConsolidatedContext = z.infer<typeof insertConsolidatedContextSchema>;

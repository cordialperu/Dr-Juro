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
  role: varchar("role", { length: 20 }).default("abogado").notNull(), // admin, abogado, asistente
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Clients Table
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(), // Usuario propietario del cliente
  name: text("name").notNull(),
  contactInfo: text("contact_info"),
  // Campos OBLIGATORIOS de contacto DEL CLIENTE (quien paga/contrata)
  email: varchar("email", { length: 255 }).notNull(), // OBLIGATORIO
  whatsappPrimary: varchar("whatsapp_primary", { length: 20 }).notNull(), // OBLIGATORIO para coordinaciones
  // Campos OPCIONALES de contacto
  emailAssistant: varchar("email_assistant", { length: 255 }), // OPCIONAL: Email del asistente
  whatsappAssistant: varchar("whatsapp_assistant", { length: 20 }), // OPCIONAL: WhatsApp del asistente
  assistantName: varchar("assistant_name", { length: 255 }), // OPCIONAL: Nombre del asistente
  // DATOS DEL IMPUTADO (quien tiene el cargo penal) - OPCIONAL
  // Si el cliente es el mismo imputado, estos campos se dejan vacíos
  imputadoName: varchar("imputado_name", { length: 255 }), // Nombre del imputado
  imputadoDni: varchar("imputado_dni", { length: 20 }), // DNI del imputado
  imputadoRelation: varchar("imputado_relation", { length: 100 }), // Relación con el cliente (hijo, cónyuge, etc.)
  imputadoContact: varchar("imputado_contact", { length: 20 }), // Contacto del imputado
  imputadoEmail: varchar("imputado_email", { length: 255 }), // Email del imputado
  // Configuración de notificaciones
  notifyClient: varchar("notify_client", { length: 10 }).default("true").notNull(), // "true" o "false" como string
  notifyAssistant: varchar("notify_assistant", { length: 10 }).default("false").notNull(), // "true" o "false" como string
  notifyImputado: varchar("notify_imputado", { length: 10 }).default("false").notNull(), // "true" o "false" - notificar al imputado
  notes: text("notes"), // Notas adicionales
  // Campos legacy
  phonePrimary: varchar("phone_primary", { length: 20 }),
  phoneSecondary: varchar("phone_secondary", { length: 20 }),
  emailSecondary: varchar("email_secondary", { length: 255 }),
  preferredContactMethod: varchar("preferred_contact_method", { length: 20 }).default("whatsapp"),
  timezone: varchar("timezone", { length: 50 }).default("America/Lima"),
  language: varchar("language", { length: 10 }).default("es"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Cases Table (Expedientes)
export const cases = pgTable("cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("active").notNull(), // e.g., active, closed, pending
  category: varchar("category", { length: 100 }), // laboral, civil, penal, etc.
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high, critical
  tags: jsonb("tags").default(sql`'[]'::jsonb`), // ["urgente", "audiencia"]
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

// Communication Templates Table (Plantillas de comunicación)
export const communicationTemplates = pgTable("communication_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(), // reminder, update, request, notification, greeting
  phase: varchar("phase", { length: 50 }), // investigation, strategy, meeting, followup, null para general
  channel: varchar("channel", { length: 20 }).notNull(), // email, whatsapp, sms
  subject: varchar("subject", { length: 500 }), // Para emails
  bodyTemplate: text("body_template").notNull(),
  variables: jsonb("variables"), // {clientName}, {lawyerName}, etc.
  isActive: varchar("is_active", { length: 10 }).default("true").notNull(),
  isSystem: varchar("is_system", { length: 10 }).default("false").notNull(), // Plantillas del sistema
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Communications Log Table (Registro de comunicaciones)
export const communicationsLog = pgTable("communications_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").references(() => cases.id),
  clientId: varchar("client_id").references(() => clients.id).notNull(),
  templateId: varchar("template_id").references(() => communicationTemplates.id),
  channel: varchar("channel", { length: 20 }).notNull(), // email, whatsapp, sms, phone
  direction: varchar("direction", { length: 10 }).notNull(), // outbound, inbound
  subject: varchar("subject", { length: 500 }),
  body: text("body").notNull(),
  recipient: varchar("recipient", { length: 255 }).notNull(),
  sender: varchar("sender", { length: 255 }),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, sent, delivered, read, failed
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
  sentBy: varchar("sent_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Scheduled Reminders Table (Recordatorios programados)
export const scheduledReminders = pgTable("scheduled_reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").references(() => cases.id),
  clientId: varchar("client_id").references(() => clients.id).notNull(),
  templateId: varchar("template_id").references(() => communicationTemplates.id),
  reminderType: varchar("reminder_type", { length: 50 }).notNull(), // hearing, deadline, meeting, document_request, follow_up
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  scheduledFor: timestamp("scheduled_for").notNull(),
  channel: varchar("channel", { length: 20 }).notNull(), // email, whatsapp, sms, all
  recurrence: varchar("recurrence", { length: 20 }), // once, daily, weekly, monthly
  status: varchar("status", { length: 20 }).default("scheduled").notNull(), // scheduled, sent, cancelled, failed
  sentAt: timestamp("sent_at"),
  errorMessage: text("error_message"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Case Events Table (Eventos del caso)
export const caseEvents = pgTable("case_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").references(() => cases.id).notNull(),
  eventType: varchar("event_type", { length: 50 }).notNull(), // phase_completed, document_uploaded, hearing_scheduled, etc.
  eventData: jsonb("event_data"),
  shouldNotifyClient: varchar("should_notify_client", { length: 10 }).default("false").notNull(),
  notificationSent: varchar("notification_sent", { length: 10 }).default("false").notNull(),
  notificationSentAt: timestamp("notification_sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notes Table (Notas del caso)
export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").references(() => cases.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  tags: jsonb("tags").default(sql`'[]'::jsonb`), // ["urgente", "audiencia", "pendiente"]
  isPinned: varchar("is_pinned", { length: 10 }).default("false").notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Case Activity Table (Timeline de actividad)
export const caseActivity = pgTable("case_activity", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").references(() => cases.id).notNull(),
  activityType: varchar("activity_type", { length: 50 }).notNull(), // document_uploaded, phase_completed, note_added, etc.
  description: text("description").notNull(),
  metadata: jsonb("metadata"), // Información adicional en JSON
  performedBy: varchar("performed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chat Messages Table (Persistent chat history)
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id).notNull(),
  role: varchar("role", { length: 20 }).notNull(), // user, assistant
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // Additional context like tool usage, document references
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Legal Process V2 Table (Arquitectura 2.0)
export const legalProcessV2 = pgTable("legal_process_v2", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id).notNull().unique(),
  data: jsonb("data").notNull().default({}), // ProcessState completo
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod schemas for validation
// insertClientSchema omite userId (se asigna automáticamente en el backend)
export const insertClientSchema = createInsertSchema(clients).omit({ userId: true });
export const insertCaseSchema = createInsertSchema(cases);
export const insertPrecedentSchema = createInsertSchema(precedents);
export const insertDoctrinaSchema = createInsertSchema(doctrinas);
export const insertTaskSchema = createInsertSchema(tasks);
export const insertCaseDocumentSchema = createInsertSchema(caseDocuments);
export const insertCaseProcessStateSchema = createInsertSchema(caseProcessState);
export const insertDocumentFolderSchema = createInsertSchema(documentFolders);
export const insertClientDocumentSchema = createInsertSchema(clientDocuments);
export const insertConsolidatedContextSchema = createInsertSchema(consolidatedContext);
export const insertCommunicationTemplateSchema = createInsertSchema(communicationTemplates);
export const insertCommunicationsLogSchema = createInsertSchema(communicationsLog);
export const insertScheduledReminderSchema = createInsertSchema(scheduledReminders);
export const insertCaseEventSchema = createInsertSchema(caseEvents);
export const insertNoteSchema = createInsertSchema(notes);
export const insertCaseActivitySchema = createInsertSchema(caseActivity);
export const insertLegalProcessV2Schema = createInsertSchema(legalProcessV2);
export const insertChatMessageSchema = createInsertSchema(chatMessages);

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
export type CommunicationTemplate = typeof communicationTemplates.$inferSelect;
export type InsertCommunicationTemplate = z.infer<typeof insertCommunicationTemplateSchema>;
export type CommunicationsLog = typeof communicationsLog.$inferSelect;
export type InsertCommunicationsLog = z.infer<typeof insertCommunicationsLogSchema>;
export type ScheduledReminder = typeof scheduledReminders.$inferSelect;
export type InsertScheduledReminder = z.infer<typeof insertScheduledReminderSchema>;
export type CaseEvent = typeof caseEvents.$inferSelect;
export type InsertCaseEvent = z.infer<typeof insertCaseEventSchema>;
export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type CaseActivity = typeof caseActivity.$inferSelect;
export type InsertCaseActivity = z.infer<typeof insertCaseActivitySchema>;
export type LegalProcessV2 = typeof legalProcessV2.$inferSelect;
export type InsertLegalProcessV2 = z.infer<typeof insertLegalProcessV2Schema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

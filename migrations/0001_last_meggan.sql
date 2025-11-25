CREATE TABLE "case_activity" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" varchar NOT NULL,
	"activity_type" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"metadata" jsonb,
	"performed_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" varchar NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"event_data" jsonb,
	"should_notify_client" varchar(10) DEFAULT 'false' NOT NULL,
	"notification_sent" varchar(10) DEFAULT 'false' NOT NULL,
	"notification_sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"folder_id" varchar NOT NULL,
	"client_id" varchar NOT NULL,
	"file_name" text NOT NULL,
	"file_path" text NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"file_size" varchar(20),
	"extracted_text" text,
	"is_processed" varchar(10) DEFAULT 'false' NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"uploaded_by" varchar,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "communication_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(50) NOT NULL,
	"phase" varchar(50),
	"channel" varchar(20) NOT NULL,
	"subject" varchar(500),
	"body_template" text NOT NULL,
	"variables" jsonb,
	"is_active" varchar(10) DEFAULT 'true' NOT NULL,
	"is_system" varchar(10) DEFAULT 'false' NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "communications_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" varchar,
	"client_id" varchar NOT NULL,
	"template_id" varchar,
	"channel" varchar(20) NOT NULL,
	"direction" varchar(10) NOT NULL,
	"subject" varchar(500),
	"body" text NOT NULL,
	"recipient" varchar(255) NOT NULL,
	"sender" varchar(255),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"read_at" timestamp,
	"error_message" text,
	"metadata" jsonb,
	"sent_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consolidated_context" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"folder_id" varchar NOT NULL,
	"phase" varchar(50) NOT NULL,
	"consolidated_text" text NOT NULL,
	"document_count" varchar(10) DEFAULT '0' NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"token_count" varchar(20),
	CONSTRAINT "consolidated_context_folder_id_unique" UNIQUE("folder_id")
);
--> statement-breakpoint
CREATE TABLE "document_folders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"phase" varchar(50) NOT NULL,
	"folder_type" varchar(100) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" varchar NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"is_pinned" varchar(10) DEFAULT 'false' NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_reminders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" varchar,
	"client_id" varchar NOT NULL,
	"template_id" varchar,
	"reminder_type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"scheduled_for" timestamp NOT NULL,
	"channel" varchar(20) NOT NULL,
	"recurrence" varchar(20),
	"status" varchar(20) DEFAULT 'scheduled' NOT NULL,
	"sent_at" timestamp,
	"error_message" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "category" varchar(100);--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "priority" varchar(20) DEFAULT 'medium';--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "tags" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "email" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "whatsapp_primary" varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "email_assistant" varchar(255);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "whatsapp_assistant" varchar(20);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "assistant_name" varchar(255);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "notify_client" varchar(10) DEFAULT 'true' NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "notify_assistant" varchar(10) DEFAULT 'false' NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "phone_primary" varchar(20);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "phone_secondary" varchar(20);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "email_secondary" varchar(255);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "preferred_contact_method" varchar(20) DEFAULT 'whatsapp';--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "timezone" varchar(50) DEFAULT 'America/Lima';--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "language" varchar(10) DEFAULT 'es';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" varchar(20) DEFAULT 'abogado' NOT NULL;--> statement-breakpoint
ALTER TABLE "case_activity" ADD CONSTRAINT "case_activity_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_activity" ADD CONSTRAINT "case_activity_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_events" ADD CONSTRAINT "case_events_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_documents" ADD CONSTRAINT "client_documents_folder_id_document_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."document_folders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_documents" ADD CONSTRAINT "client_documents_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_documents" ADD CONSTRAINT "client_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_templates" ADD CONSTRAINT "communication_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communications_log" ADD CONSTRAINT "communications_log_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communications_log" ADD CONSTRAINT "communications_log_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communications_log" ADD CONSTRAINT "communications_log_template_id_communication_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."communication_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communications_log" ADD CONSTRAINT "communications_log_sent_by_users_id_fk" FOREIGN KEY ("sent_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consolidated_context" ADD CONSTRAINT "consolidated_context_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consolidated_context" ADD CONSTRAINT "consolidated_context_folder_id_document_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."document_folders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_folders" ADD CONSTRAINT "document_folders_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_reminders" ADD CONSTRAINT "scheduled_reminders_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_reminders" ADD CONSTRAINT "scheduled_reminders_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_reminders" ADD CONSTRAINT "scheduled_reminders_template_id_communication_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."communication_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_reminders" ADD CONSTRAINT "scheduled_reminders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
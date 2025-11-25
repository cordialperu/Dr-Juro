CREATE TABLE "chat_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legal_process_v2" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "legal_process_v2_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "imputado_name" varchar(255);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "imputado_dni" varchar(20);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "imputado_relation" varchar(100);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "imputado_contact" varchar(20);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "imputado_email" varchar(255);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "notify_imputado" varchar(10) DEFAULT 'false' NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_process_v2" ADD CONSTRAINT "legal_process_v2_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;
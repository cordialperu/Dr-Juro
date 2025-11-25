-- Migration: Add required contact fields for clients
-- Description: Add WhatsApp, email, and assistant contact information fields

-- Add new columns to clients table
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "email" varchar(255);
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "email_assistant" varchar(255);
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "whatsapp_primary" varchar(20);
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "whatsapp_assistant" varchar(20);
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "assistant_name" varchar(255);
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "notify_client" boolean DEFAULT true;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "notify_assistant" boolean DEFAULT false;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "notes" text;

-- Comment on columns for documentation
COMMENT ON COLUMN "clients"."email" IS 'Email principal del cliente (OBLIGATORIO)';
COMMENT ON COLUMN "clients"."whatsapp_primary" IS 'Número de WhatsApp del cliente para coordinaciones (OBLIGATORIO)';
COMMENT ON COLUMN "clients"."email_assistant" IS 'Email del asistente o persona que ve el caso (OPCIONAL)';
COMMENT ON COLUMN "clients"."whatsapp_assistant" IS 'WhatsApp del asistente (OPCIONAL, aparece cuando se activa notificación al asistente)';
COMMENT ON COLUMN "clients"."assistant_name" IS 'Nombre del asistente o contacto secundario';
COMMENT ON COLUMN "clients"."notify_client" IS 'Enviar notificaciones y avances al cliente titular';
COMMENT ON COLUMN "clients"."notify_assistant" IS 'Enviar notificaciones y avances al asistente';
COMMENT ON COLUMN "clients"."notes" IS 'Notas adicionales sobre el cliente';

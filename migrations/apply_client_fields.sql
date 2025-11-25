-- Migration script para campos de contacto de clientes
-- Ejecutar desde psql o cualquier cliente PostgreSQL

\echo 'Aplicando migración: Campos de contacto de clientes'

-- Agregar columnas si no existen
ALTER TABLE clients ADD COLUMN IF NOT EXISTS email varchar(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS email_assistant varchar(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS whatsapp_primary varchar(20);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS whatsapp_assistant varchar(20);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS assistant_name varchar(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notify_client varchar(10) DEFAULT 'true';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notify_assistant varchar(10) DEFAULT 'false';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes text;

\echo 'Migración completada exitosamente'

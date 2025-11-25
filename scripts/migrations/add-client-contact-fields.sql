-- Migration: Add extended contact fields to clients table
-- Date: 2025-11-12

-- Add new contact fields to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS phone_primary VARCHAR(20),
ADD COLUMN IF NOT EXISTS phone_secondary VARCHAR(20),
ADD COLUMN IF NOT EXISTS whatsapp_primary VARCHAR(20),
ADD COLUMN IF NOT EXISTS whatsapp_assistant VARCHAR(20),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_secondary VARCHAR(255),
ADD COLUMN IF NOT EXISTS assistant_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS preferred_contact_method VARCHAR(20) DEFAULT 'whatsapp',
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'America/Lima',
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'es';

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_phone_primary ON clients(phone_primary);

-- Comment on new columns
COMMENT ON COLUMN clients.email IS 'Email principal del cliente';
COMMENT ON COLUMN clients.email_secondary IS 'Email secundario del cliente';
COMMENT ON COLUMN clients.phone_primary IS 'Teléfono principal del cliente';
COMMENT ON COLUMN clients.phone_secondary IS 'Teléfono secundario del cliente';
COMMENT ON COLUMN clients.whatsapp_primary IS 'WhatsApp principal del cliente';
COMMENT ON COLUMN clients.whatsapp_assistant IS 'WhatsApp del asistente del cliente';
COMMENT ON COLUMN clients.assistant_name IS 'Nombre del asistente del cliente';
COMMENT ON COLUMN clients.preferred_contact_method IS 'Método de contacto preferido (whatsapp, email, phone, sms)';
COMMENT ON COLUMN clients.timezone IS 'Zona horaria del cliente';
COMMENT ON COLUMN clients.language IS 'Idioma preferido del cliente (es, en, etc)';

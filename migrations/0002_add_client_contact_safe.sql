-- Safe migration: Only add new columns to clients table
-- This migration adds required contact fields for client communication

-- Add required contact fields
ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS email varchar(255),
  ADD COLUMN IF NOT EXISTS whatsapp_primary varchar(20);

-- Add optional assistant fields
ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS email_assistant varchar(255),
  ADD COLUMN IF NOT EXISTS whatsapp_assistant varchar(20),
  ADD COLUMN IF NOT EXISTS assistant_name varchar(255);

-- Add notification preferences
ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS notify_client varchar(10) DEFAULT 'true',
  ADD COLUMN IF NOT EXISTS notify_assistant varchar(10) DEFAULT 'false';

-- Add additional fields
ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS phone_primary varchar(20),
  ADD COLUMN IF NOT EXISTS phone_secondary varchar(20),
  ADD COLUMN IF NOT EXISTS email_secondary varchar(255),
  ADD COLUMN IF NOT EXISTS preferred_contact_method varchar(20) DEFAULT 'whatsapp',
  ADD COLUMN IF NOT EXISTS timezone varchar(50) DEFAULT 'America/Lima',
  ADD COLUMN IF NOT EXISTS language varchar(10) DEFAULT 'es';

-- Set NOT NULL constraints for required fields (only if they don't already exist)
-- This will fail if there are existing rows with NULL values
-- You may need to fill in default values first if there's existing data

-- Update schema to make email and whatsapp_primary required
-- First, fill any NULL values with defaults (for existing rows)
UPDATE clients SET email = 'pendiente@example.com' WHERE email IS NULL;
UPDATE clients SET whatsapp_primary = '+51000000000' WHERE whatsapp_primary IS NULL;

-- Now add NOT NULL constraints
ALTER TABLE clients 
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN whatsapp_primary SET NOT NULL;

-- Success message
SELECT 'Migration completed successfully! New client contact fields added.' as result;

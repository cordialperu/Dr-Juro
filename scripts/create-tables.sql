-- Crear tabla case_documents
CREATE TABLE IF NOT EXISTS case_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('notifications', 'police-report', 'additional')),
  content TEXT,
  notes TEXT DEFAULT '',
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índice para búsquedas rápidas por case_id
CREATE INDEX IF NOT EXISTS idx_case_documents_case_id ON case_documents(case_id);

-- Crear tabla case_process_state
CREATE TABLE IF NOT EXISTS case_process_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL UNIQUE REFERENCES cases(id) ON DELETE CASCADE,
  current_phase TEXT NOT NULL DEFAULT 'client-info',
  completion_percentage TEXT DEFAULT '0',
  client_info JSONB,
  investigation_progress JSONB,
  case_strategy JSONB,
  client_meeting JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índice para búsquedas rápidas por case_id
CREATE INDEX IF NOT EXISTS idx_case_process_state_case_id ON case_process_state(case_id);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_case_process_state_updated_at ON case_process_state;
CREATE TRIGGER update_case_process_state_updated_at 
    BEFORE UPDATE ON case_process_state 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

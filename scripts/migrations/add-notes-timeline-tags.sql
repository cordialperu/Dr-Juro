-- Migración: Sistema de Notas, Timeline y Tags
-- Fecha: 2025-11-12
-- Descripción: Añade sistema de notas persistente con tags, timeline de actividad del caso, y sistema de categorización

-- 1. TABLA DE NOTAS
CREATE TABLE IF NOT EXISTS notes (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    case_id VARCHAR REFERENCES cases(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    tags JSONB DEFAULT '[]'::jsonb, -- Array de strings: ["urgente", "audiencia", "pendiente"]
    is_pinned BOOLEAN DEFAULT false,
    created_by VARCHAR REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_case_id ON notes(case_id);
CREATE INDEX IF NOT EXISTS idx_notes_pinned ON notes(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING gin(tags);
-- Índice full-text para búsqueda en español
CREATE INDEX IF NOT EXISTS idx_notes_content_search ON notes USING gin(to_tsvector('spanish', content));
CREATE INDEX IF NOT EXISTS idx_notes_title_search ON notes USING gin(to_tsvector('spanish', title));

COMMENT ON TABLE notes IS 'Notas persistentes asociadas a casos con soporte de tags y búsqueda full-text';
COMMENT ON COLUMN notes.tags IS 'Array JSON de tags para categorización: ["urgente", "audiencia", "cliente"]';
COMMENT ON COLUMN notes.is_pinned IS 'Notas importantes que se muestran siempre al inicio';

-- 2. TABLA DE ACTIVIDAD DEL CASO (Timeline)
CREATE TABLE IF NOT EXISTS case_activity (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    case_id VARCHAR REFERENCES cases(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- 'document_uploaded', 'phase_completed', 'note_added', 'search_performed', 'meeting_scheduled', 'deadline_set'
    description TEXT NOT NULL,
    metadata JSONB, -- Información adicional según el tipo
    performed_by VARCHAR REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_case_id ON case_activity(case_id);
CREATE INDEX IF NOT EXISTS idx_activity_type ON case_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON case_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_metadata ON case_activity USING gin(metadata);

COMMENT ON TABLE case_activity IS 'Registro cronológico de todas las actividades realizadas en un caso';
COMMENT ON COLUMN case_activity.activity_type IS 'Tipo de actividad: document_uploaded, phase_completed, note_added, search_performed, etc.';
COMMENT ON COLUMN case_activity.metadata IS 'Datos adicionales en formato JSON según el tipo de actividad';

-- 3. EXTENDER TABLA DE CASOS CON TAGS Y CATEGORÍA
ALTER TABLE cases ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium'; -- 'low', 'medium', 'high', 'critical'

CREATE INDEX IF NOT EXISTS idx_cases_tags ON cases USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_cases_category ON cases(category);
CREATE INDEX IF NOT EXISTS idx_cases_priority ON cases(priority);

COMMENT ON COLUMN cases.tags IS 'Tags para categorización y búsqueda rápida: ["laboral", "despido", "urgente"]';
COMMENT ON COLUMN cases.category IS 'Categoría principal del caso: laboral, civil, penal, constitucional, etc.';
COMMENT ON COLUMN cases.priority IS 'Prioridad del caso para gestión de carga de trabajo';

-- 4. VISTA: Resumen de actividad por caso
CREATE OR REPLACE VIEW case_activity_summary AS
SELECT 
    case_id,
    COUNT(*) as total_activities,
    COUNT(DISTINCT activity_type) as activity_types_count,
    MAX(created_at) as last_activity_at,
    jsonb_agg(
        jsonb_build_object(
            'type', activity_type,
            'count', 1
        )
    ) as activity_breakdown
FROM case_activity
GROUP BY case_id;

COMMENT ON VIEW case_activity_summary IS 'Resumen agregado de actividades por caso para métricas del dashboard';

-- 5. VISTA: Estadísticas de notas por caso
CREATE OR REPLACE VIEW case_notes_stats AS
SELECT 
    case_id,
    COUNT(*) as total_notes,
    COUNT(*) FILTER (WHERE is_pinned = true) as pinned_notes_count,
    COUNT(DISTINCT created_by) as contributors_count,
    MAX(updated_at) as last_note_updated,
    jsonb_agg(DISTINCT tag) FILTER (WHERE tag IS NOT NULL) as all_tags
FROM notes,
LATERAL jsonb_array_elements_text(tags) as tag
GROUP BY case_id;

COMMENT ON VIEW case_notes_stats IS 'Estadísticas de notas por caso incluyendo tags únicos y colaboradores';

-- 6. FUNCIÓN: Registrar actividad automáticamente
CREATE OR REPLACE FUNCTION log_case_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Detectar el tipo de cambio y crear actividad correspondiente
    IF TG_TABLE_NAME = 'notes' AND TG_OP = 'INSERT' THEN
        INSERT INTO case_activity (case_id, activity_type, description, metadata, performed_by)
        VALUES (
            NEW.case_id,
            'note_added',
            'Nueva nota agregada: ' || LEFT(NEW.title, 50),
            jsonb_build_object('note_id', NEW.id, 'title', NEW.title, 'tags', NEW.tags),
            NEW.created_by
        );
    ELSIF TG_TABLE_NAME = 'case_documents' AND TG_OP = 'INSERT' THEN
        INSERT INTO case_activity (case_id, activity_type, description, metadata, performed_by)
        VALUES (
            NEW.case_id,
            'document_uploaded',
            'Documento cargado: ' || NEW.title,
            jsonb_build_object('document_id', NEW.id, 'title', NEW.title, 'type', NEW.document_type),
            NEW.uploaded_by
        );
    ELSIF TG_TABLE_NAME = 'case_process_state' AND TG_OP = 'UPDATE' AND OLD.current_phase != NEW.current_phase THEN
        INSERT INTO case_activity (case_id, activity_type, description, metadata)
        VALUES (
            NEW.case_id,
            'phase_completed',
            'Fase completada: ' || OLD.current_phase || ' → ' || NEW.current_phase,
            jsonb_build_object('from_phase', OLD.current_phase, 'to_phase', NEW.current_phase, 'completion', NEW.completion_percentage)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. TRIGGERS para auto-logging de actividad
DROP TRIGGER IF EXISTS trigger_log_note_activity ON notes;
CREATE TRIGGER trigger_log_note_activity
    AFTER INSERT ON notes
    FOR EACH ROW
    EXECUTE FUNCTION log_case_activity();

DROP TRIGGER IF EXISTS trigger_log_document_activity ON case_documents;
CREATE TRIGGER trigger_log_document_activity
    AFTER INSERT ON case_documents
    FOR EACH ROW
    EXECUTE FUNCTION log_case_activity();

DROP TRIGGER IF EXISTS trigger_log_phase_activity ON case_process_state;
CREATE TRIGGER trigger_log_phase_activity
    AFTER UPDATE ON case_process_state
    FOR EACH ROW
    WHEN (OLD.current_phase IS DISTINCT FROM NEW.current_phase)
    EXECUTE FUNCTION log_case_activity();

-- 8. FUNCIÓN: Buscar en notas (full-text search)
CREATE OR REPLACE FUNCTION search_notes(
    search_query TEXT,
    target_case_id VARCHAR DEFAULT NULL,
    target_tags TEXT[] DEFAULT NULL
)
RETURNS TABLE (
    id VARCHAR,
    case_id VARCHAR,
    title VARCHAR,
    content TEXT,
    tags JSONB,
    is_pinned BOOLEAN,
    created_at TIMESTAMP,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.case_id,
        n.title,
        n.content,
        n.tags,
        n.is_pinned,
        n.created_at,
        ts_rank(
            to_tsvector('spanish', n.title || ' ' || n.content),
            plainto_tsquery('spanish', search_query)
        ) as rank
    FROM notes n
    WHERE 
        (target_case_id IS NULL OR n.case_id = target_case_id)
        AND (target_tags IS NULL OR n.tags ?| target_tags)
        AND (
            to_tsvector('spanish', n.title || ' ' || n.content) @@ plainto_tsquery('spanish', search_query)
        )
    ORDER BY rank DESC, n.created_at DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION search_notes IS 'Búsqueda full-text en notas con ranking por relevancia, filtrado opcional por caso y tags';

-- 9. INSERTAR DATOS DE EJEMPLO (categorías comunes)
INSERT INTO case_activity (case_id, activity_type, description, metadata)
SELECT 
    id,
    'case_created',
    'Caso creado: ' || title,
    jsonb_build_object('title', title, 'status', status)
FROM cases
WHERE NOT EXISTS (
    SELECT 1 FROM case_activity WHERE case_activity.case_id = cases.id AND activity_type = 'case_created'
);

-- 10. ACTUALIZAR CASOS EXISTENTES CON CATEGORÍAS
UPDATE cases 
SET category = 'general'
WHERE category IS NULL;

-- Fin de migración

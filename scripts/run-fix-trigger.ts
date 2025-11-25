import 'dotenv/config';
import { db } from '../server/db.js';
import { sql } from 'drizzle-orm';

async function fixTrigger() {
  if (!db) {
    console.error('❌ Database not available');
    process.exit(1);
  }
  
  try {
    console.log('🔧 Arreglando trigger de case_documents...\n');

    // Drop existing trigger
    await db.execute(sql`DROP TRIGGER IF EXISTS trigger_log_document_activity ON case_documents`);
    
    // Recreate function with correct field name
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION log_case_activity()
      RETURNS TRIGGER AS $$
      BEGIN
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
                  'Documento cargado: ' || NEW.filename,
                  jsonb_build_object('document_id', NEW.id, 'filename', NEW.filename, 'type', NEW.file_type),
                  NULL
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
    `);

    // Recreate trigger
    await db.execute(sql`
      CREATE TRIGGER trigger_log_document_activity
          AFTER INSERT ON case_documents
          FOR EACH ROW
          EXECUTE FUNCTION log_case_activity();
    `);

    console.log('✅ Trigger arreglado correctamente\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixTrigger();

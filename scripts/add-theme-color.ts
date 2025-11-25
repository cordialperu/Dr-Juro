import { db } from '../server/db.js';
import { sql } from 'drizzle-orm';

async function addThemeColorColumn() {
  console.log('�� Añadiendo columna theme_color a la tabla clients...');
  
  try {
    await db.execute(sql`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS theme_color VARCHAR(7);
    `);
    
    console.log('✅ Columna theme_color añadida exitosamente');
  } catch (error) {
    console.error('❌ Error al añadir columna:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

addThemeColorColumn();

import 'dotenv/config';
import { db } from '../server/db.js';
import { sql } from 'drizzle-orm';

async function applyRoleMigration() {
  if (!db) {
    console.error('❌ Database not available');
    process.exit(1);
  }

  try {
    console.log('🔄 Aplicando migración de roles...');

    // Add role column
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'abogado' 
      CHECK (role IN ('admin', 'abogado', 'asistente'))
    `);
    console.log('✅ Columna role agregada');

    // Update existing users
    await db.execute(sql`
      UPDATE users 
      SET role = 'abogado' 
      WHERE role IS NULL
    `);
    console.log('✅ Usuarios existentes actualizados');

    // Create index
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)
    `);
    console.log('✅ Índice creado');

    console.log('\n🎉 Migración completada exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error aplicando migración:', error);
    process.exit(1);
  }
}

applyRoleMigration();

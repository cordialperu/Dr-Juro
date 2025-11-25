import 'dotenv/config';
import { db, pool } from '../server/db';
import { sql } from 'drizzle-orm';

async function migrate() {
  try {
    console.log('🔄 Iniciando migración: agregar user_id a tabla clients...');

    if (!db || !pool) {
      console.error('❌ DATABASE_URL no está configurado en .env');
      process.exit(1);
    }

    // Paso 1: Agregar columna user_id
    console.log('📝 Paso 1: Agregando columna user_id...');
    await pool.query(`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS user_id VARCHAR;
    `);
    console.log('✅ Columna user_id agregada');

    // Paso 2: Agregar constraint de clave foránea
    console.log('📝 Paso 2: Agregando constraint de clave foránea...');
    await pool.query(`
      ALTER TABLE clients 
      DROP CONSTRAINT IF EXISTS clients_user_id_fkey;
      
      ALTER TABLE clients 
      ADD CONSTRAINT clients_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES users(id);
    `);
    console.log('✅ Constraint de clave foránea agregado');

    // Paso 3: Obtener el ID del usuario drjuro_v5
    console.log('📝 Paso 3: Obteniendo ID del usuario drjuro_v5...');
    const userResult = await pool.query(`
      SELECT id FROM users WHERE username = 'drjuro_v5'
    `);
    
    if (userResult.rows.length === 0) {
      console.error('❌ Usuario drjuro_v5 no encontrado');
      process.exit(1);
    }

    const drjuroUserId = userResult.rows[0].id;
    console.log(`✅ Usuario drjuro_v5 encontrado: ${drjuroUserId}`);

    // Paso 4: Actualizar los 3 clientes V5 con el userId correcto
    console.log('📝 Paso 4: Actualizando clientes V5...');
    const updateResult = await pool.query(`
      UPDATE clients 
      SET user_id = $1
      WHERE name IN ('Fernando Vargas León', 'Roberto Silva Torres', 'Ana Lucía Perez')
      RETURNING id, name;
    `, [drjuroUserId]);

    console.log(`✅ ${updateResult.rows.length} clientes actualizados:`);
    updateResult.rows.forEach(row => {
      console.log(`   - ${row.name} (${row.id})`);
    });

    // Paso 5: Verificar clientes sin user_id asignado
    console.log('📝 Paso 5: Verificando clientes sin user_id...');
    const orphanResult = await pool.query(`
      SELECT id, name, email 
      FROM clients 
      WHERE user_id IS NULL
      LIMIT 10;
    `);

    if (orphanResult.rows.length > 0) {
      console.log(`⚠️  Hay ${orphanResult.rows.length} clientes sin user_id asignado:`);
      orphanResult.rows.forEach(row => {
        console.log(`   - ${row.name} (${row.email})`);
      });
      console.log('\n💡 Puedes asignarlos manualmente o eliminarlos.');
    } else {
      console.log('✅ Todos los clientes tienen user_id asignado');
    }

    // Paso 6: Mostrar resumen
    console.log('\n📊 Resumen de clientes por usuario:');
    const summaryResult = await pool.query(`
      SELECT 
        u.username,
        COUNT(c.id) as total_clientes
      FROM users u
      LEFT JOIN clients c ON c.user_id = u.id
      GROUP BY u.username, u.id
      ORDER BY total_clientes DESC;
    `);

    summaryResult.rows.forEach(row => {
      console.log(`   ${row.username}: ${row.total_clientes} cliente(s)`);
    });

    console.log('\n✅ Migración completada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  }
}

migrate();

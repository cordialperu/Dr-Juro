import 'dotenv/config';
import { pool } from '../server/db';

async function cleanupOrphanClients() {
  try {
    console.log('🧹 Limpiando clientes sin user_id asignado...');

    if (!pool) {
      console.error('❌ DATABASE_URL no está configurado en .env');
      process.exit(1);
    }

    // Obtener lista de clientes huérfanos
    const orphansResult = await pool.query(`
      SELECT id, name, email, created_at
      FROM clients 
      WHERE user_id IS NULL
      ORDER BY created_at DESC;
    `);

    console.log(`\n📋 Clientes sin user_id encontrados: ${orphansResult.rows.length}`);
    orphansResult.rows.forEach((row, idx) => {
      console.log(`   ${idx + 1}. ${row.name} - ${row.email} (${row.created_at})`);
    });

    if (orphansResult.rows.length === 0) {
      console.log('✅ No hay clientes huérfanos. Todo limpio!');
      process.exit(0);
    }

    // Primero eliminar casos asociados a clientes huérfanos
    console.log('\n🗑️  Eliminando casos asociados a clientes huérfanos...');
    const deleteCasesResult = await pool.query(`
      DELETE FROM cases 
      WHERE client_id IN (SELECT id FROM clients WHERE user_id IS NULL)
      RETURNING id, title;
    `);
    console.log(`✅ ${deleteCasesResult.rows.length} caso(s) eliminado(s)`);

    // Ahora eliminar clientes huérfanos
    console.log('\n🗑️  Eliminando clientes huérfanos...');
    const deleteResult = await pool.query(`
      DELETE FROM clients 
      WHERE user_id IS NULL
      RETURNING id, name;
    `);

    console.log(`✅ ${deleteResult.rows.length} cliente(s) eliminado(s):`);
    deleteResult.rows.forEach(row => {
      console.log(`   - ${row.name} (${row.id})`);
    });

    // Verificar resumen final
    console.log('\n📊 Resumen final de clientes por usuario:');
    const summaryResult = await pool.query(`
      SELECT 
        u.username,
        u.id as user_id,
        COUNT(c.id) as total_clientes
      FROM users u
      LEFT JOIN clients c ON c.user_id = u.id
      GROUP BY u.username, u.id
      ORDER BY total_clientes DESC;
    `);

    summaryResult.rows.forEach(row => {
      console.log(`   ${row.username}: ${row.total_clientes} cliente(s)`);
    });

    console.log('\n✅ Limpieza completada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    process.exit(1);
  }
}

cleanupOrphanClients();

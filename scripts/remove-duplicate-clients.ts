import 'dotenv/config';
import { pool } from '../server/db';

async function removeDuplicateClients() {
  try {
    console.log('🧹 Eliminando clientes duplicados del usuario drjuro_v5...\n');

    if (!pool) {
      console.error('❌ DATABASE_URL no está configurado en .env');
      process.exit(1);
    }

    // Obtener el ID del usuario drjuro_v5
    const userResult = await pool.query(`
      SELECT id FROM users WHERE username = 'drjuro_v5'
    `);
    
    if (userResult.rows.length === 0) {
      console.error('❌ Usuario drjuro_v5 no encontrado');
      process.exit(1);
    }

    const drjuroUserId = userResult.rows[0].id;

    // IDs de los clientes V5 que queremos MANTENER (los más recientes)
    const keepClientIds = [
      'ca5fd03a-3c5d-47aa-9133-b755aac0487d', // Fernando (más reciente)
      '252450f2-0889-4747-9d95-0dad5df11425', // Roberto (más reciente)
      'd8bb7f99-0255-4f0c-9356-3e60df678adb'  // Ana (más reciente)
    ];

    console.log('✅ Manteniendo estos 3 clientes:');
    for (const id of keepClientIds) {
      const client = await pool.query(`
        SELECT id, name, email FROM clients WHERE id = $1
      `, [id]);
      if (client.rows.length > 0) {
        console.log(`   ✓ ${client.rows[0].name} (${id})`);
      }
    }

    // Actualizar o eliminar todas las referencias a clientes duplicados
    console.log('\n🔄 Actualizando referencias de clientes duplicados...');
    
    // Mapear clientes por nombre
    const clientMapping = {
      'Fernando Vargas León': keepClientIds[0],
      'Roberto Silva Torres': keepClientIds[1],
      'Ana Lucía Perez': keepClientIds[2]
    };

    // Para cada cliente
    for (const [name, correctId] of Object.entries(clientMapping)) {
      console.log(`\n   📋 Procesando: ${name}`);
      
      // Obtener IDs de clientes duplicados
      const duplicatesResult = await pool.query(`
        SELECT id FROM clients 
        WHERE user_id = $1 
          AND name = $2 
          AND id != $3
      `, [drjuroUserId, name, correctId]);

      const duplicateIds = duplicatesResult.rows.map(r => r.id);
      
      if (duplicateIds.length === 0) {
        console.log(`      ✓ No hay duplicados`);
        continue;
      }

      console.log(`      → ${duplicateIds.length} duplicado(s) encontrado(s)`);

      // Actualizar casos
      const updateCasesResult = await pool.query(`
        UPDATE cases 
        SET client_id = $1
        WHERE client_id = ANY($2)
      `, [correctId, duplicateIds]);
      if (updateCasesResult.rowCount && updateCasesResult.rowCount > 0) {
        console.log(`      ✓ ${updateCasesResult.rowCount} caso(s) actualizados`);
      }

      // Eliminar procesos legales duplicados (UNIQUE constraint)
      const deleteProcessResult = await pool.query(`
        DELETE FROM legal_process_v2 
        WHERE client_id = ANY($1)
      `, [duplicateIds]);
      if (deleteProcessResult.rowCount && deleteProcessResult.rowCount > 0) {
        console.log(`      ✓ ${deleteProcessResult.rowCount} proceso(s) legal(es) eliminados`);
      }

      // Actualizar chat_messages
      const updateChatResult = await pool.query(`
        UPDATE chat_messages 
        SET client_id = $1
        WHERE client_id = ANY($2)
      `, [correctId, duplicateIds]);
      if (updateChatResult.rowCount && updateChatResult.rowCount > 0) {
        console.log(`      ✓ ${updateChatResult.rowCount} mensaje(s) de chat actualizados`);
      }

      // Eliminar otras referencias que puedan existir
      await pool.query(`DELETE FROM document_folders WHERE client_id = ANY($1)`, [duplicateIds]);
      await pool.query(`DELETE FROM client_documents WHERE client_id = ANY($1)`, [duplicateIds]);
      await pool.query(`DELETE FROM consolidated_context WHERE client_id = ANY($1)`, [duplicateIds]);
      await pool.query(`DELETE FROM communications_log WHERE client_id = ANY($1)`, [duplicateIds]);
      await pool.query(`DELETE FROM scheduled_reminders WHERE client_id = ANY($1)`, [duplicateIds]);
    }

    // Ahora eliminar todos los clientes del usuario drjuro_v5 EXCEPTO los 3 que queremos mantener
    console.log('\n🗑️  Eliminando duplicados...');
    const deleteResult = await pool.query(`
      DELETE FROM clients 
      WHERE user_id = $1 
        AND id NOT IN ($2, $3, $4)
      RETURNING id, name;
    `, [drjuroUserId, ...keepClientIds]);

    console.log(`✅ ${deleteResult.rows.length} cliente(s) duplicado(s) eliminado(s):`);
    deleteResult.rows.forEach(row => {
      console.log(`   - ${row.name} (${row.id})`);
    });

    // Verificar resultado final
    console.log('\n📊 Verificando resultado final...');
    const finalResult = await pool.query(`
      SELECT id, name, email, created_at
      FROM clients 
      WHERE user_id = $1
      ORDER BY name;
    `, [drjuroUserId]);

    console.log(`\n✅ Clientes finales del usuario drjuro_v5: ${finalResult.rows.length}`);
    finalResult.rows.forEach((row, idx) => {
      console.log(`\n   ${idx + 1}. ${row.name}`);
      console.log(`      ID: ${row.id}`);
      console.log(`      Email: ${row.email}`);
      console.log(`      Creado: ${new Date(row.created_at).toLocaleString()}`);
    });

    console.log('\n✅ Limpieza completada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    process.exit(1);
  }
}

removeDuplicateClients();

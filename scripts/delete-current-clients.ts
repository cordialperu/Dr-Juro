import 'dotenv/config';
import { pool } from '../server/db';

async function deleteCurrentClients() {
  try {
    const userId = (await pool.query(`SELECT id FROM users WHERE username = 'drjuro_v5'`)).rows[0]?.id;
    
    if (!userId) {
      console.error('❌ Usuario drjuro_v5 no encontrado');
      process.exit(1);
    }

    // Obtener IDs de clientes a eliminar
    const clientIds = (await pool.query(`SELECT id FROM clients WHERE user_id = $1`, [userId])).rows.map(r => r.id);
    
    if (clientIds.length === 0) {
      console.log('✅ No hay clientes para eliminar');
      process.exit(0);
    }

    console.log(`🗑️  Eliminando referencias de ${clientIds.length} clientes...`);

    // Obtener IDs de casos
    const caseIds = (await pool.query(`SELECT id FROM cases WHERE client_id = ANY($1)`, [clientIds])).rows.map(r => r.id);
    
    console.log(`   → ${caseIds.length} casos encontrados`);

    // Eliminar referencias de casos primero
    if (caseIds.length > 0) {
      await pool.query(`DELETE FROM case_documents WHERE case_id = ANY($1)`, [caseIds]);
      await pool.query(`DELETE FROM case_activity WHERE case_id = ANY($1)`, [caseIds]);
      await pool.query(`DELETE FROM notes WHERE case_id = ANY($1)`, [caseIds]);
      await pool.query(`DELETE FROM case_events WHERE case_id = ANY($1)`, [caseIds]);
      await pool.query(`DELETE FROM tasks WHERE case_id = ANY($1)`, [caseIds]);
      await pool.query(`DELETE FROM case_process_state WHERE case_id = ANY($1)`, [caseIds]);
    }

    // Eliminar referencias de clientes
    await pool.query(`DELETE FROM chat_messages WHERE client_id = ANY($1)`, [clientIds]);
    await pool.query(`DELETE FROM legal_process_v2 WHERE client_id = ANY($1)`, [clientIds]);
    await pool.query(`DELETE FROM document_folders WHERE client_id = ANY($1)`, [clientIds]);
    await pool.query(`DELETE FROM client_documents WHERE client_id = ANY($1)`, [clientIds]);
    await pool.query(`DELETE FROM consolidated_context WHERE client_id = ANY($1)`, [clientIds]);
    await pool.query(`DELETE FROM communications_log WHERE client_id = ANY($1)`, [clientIds]);
    await pool.query(`DELETE FROM scheduled_reminders WHERE client_id = ANY($1)`, [clientIds]);
    
    // Eliminar casos
    await pool.query(`DELETE FROM cases WHERE client_id = ANY($1)`, [clientIds]);

    // Ahora eliminar los clientes
    const result = await pool.query(`DELETE FROM clients WHERE user_id = $1`, [userId]);
    
    console.log('✅ Clientes eliminados:', result.rowCount);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

deleteCurrentClients();

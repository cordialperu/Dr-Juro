import 'dotenv/config';
import { pool } from '../server/db';

async function showV5Clients() {
  try {
    console.log('📊 Verificando clientes del usuario drjuro_v5...\n');

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

    // Obtener clientes del usuario drjuro_v5
    const clientsResult = await pool.query(`
      SELECT 
        id, 
        name, 
        email, 
        whatsapp_primary,
        created_at
      FROM clients 
      WHERE user_id = $1
      ORDER BY created_at DESC;
    `, [drjuroUserId]);

    console.log(`✅ Usuario drjuro_v5 (${drjuroUserId})`);
    console.log(`📋 Total de clientes: ${clientsResult.rows.length}\n`);

    // Agrupar por nombre para detectar duplicados
    const clientsByName = new Map<string, any[]>();
    clientsResult.rows.forEach(row => {
      const existing = clientsByName.get(row.name) || [];
      existing.push(row);
      clientsByName.set(row.name, existing);
    });

    console.log('👥 Clientes únicos:');
    let uniqueCount = 0;
    let duplicateCount = 0;

    for (const [name, clients] of clientsByName.entries()) {
      if (clients.length === 1) {
        uniqueCount++;
        const c = clients[0];
        console.log(`\n   ✓ ${name}`);
        console.log(`     ID: ${c.id}`);
        console.log(`     Email: ${c.email}`);
        console.log(`     WhatsApp: ${c.whatsapp_primary}`);
        console.log(`     Creado: ${new Date(c.created_at).toLocaleString()}`);
      } else {
        duplicateCount += clients.length;
        console.log(`\n   ⚠️  ${name} (${clients.length} duplicados)`);
        clients.forEach((c, idx) => {
          console.log(`     ${idx + 1}. ID: ${c.id} - Creado: ${new Date(c.created_at).toLocaleString()}`);
        });
      }
    }

    console.log(`\n\n📊 Resumen:`);
    console.log(`   - Clientes únicos: ${uniqueCount}`);
    console.log(`   - Clientes duplicados: ${duplicateCount}`);
    console.log(`   - Total: ${clientsResult.rows.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

showV5Clients();

import 'dotenv/config';
import { db } from '../server/db.js';
import { clients, caseProcessState, cases } from '../shared/schema.js';

async function checkData() {
  if (!db) {
    console.error('❌ Database not available');
    process.exit(1);
  }

  try {
    console.log('🔍 Verificando datos en la base de datos...\n');

    // Check clients
    const allClients = await db.select().from(clients);
    console.log(`📋 Clientes encontrados: ${allClients.length}`);
    allClients.forEach(client => {
      console.log(`   - ${client.name} (ID: ${client.id})`);
    });

    // Check cases
    const allCases = await db.select().from(cases);
    console.log(`\n📁 Casos encontrados: ${allCases.length}`);
    allCases.forEach(caseItem => {
      console.log(`   - ${caseItem.title} (Cliente ID: ${caseItem.clientId})`);
    });

    // Check process states
    const allProcessStates = await db.select().from(caseProcessState);
    console.log(`\n⚙️ Estados de proceso encontrados: ${allProcessStates.length}`);
    allProcessStates.forEach(state => {
      console.log(`   - Caso ID: ${state.caseId}, Fase: ${state.currentPhase}, Completitud: ${state.completionPercentage}%`);
    });

    console.log('\n✅ Verificación completada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkData();

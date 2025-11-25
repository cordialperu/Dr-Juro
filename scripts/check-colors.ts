import { db } from '../server/db.js';
import { clients } from '../shared/schema.js';

async function checkColors() {
  const result = await db.select({
    name: clients.name,
    themeColor: clients.themeColor
  }).from(clients);
  
  console.table(result);
  process.exit(0);
}

checkColors();

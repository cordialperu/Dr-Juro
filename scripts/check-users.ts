import 'dotenv/config';
import { db } from '../server/db';
import { users } from '../shared/schema';

async function check() {
  if (!db) {
    console.log('No DB connection');
    process.exit(1);
  }
  
  const allUsers = await db.select().from(users);
  console.log('Usuarios en DB:', allUsers.length);
  
  for (const u of allUsers) {
    console.log('---');
    console.log('ID:', u.id);
    console.log('Username:', u.username);
    console.log('Password hash:', u.password?.substring(0, 30) + '...');
    console.log('Role:', u.role);
  }
  
  process.exit(0);
}

check();

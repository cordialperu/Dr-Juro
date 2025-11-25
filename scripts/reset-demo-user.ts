import 'dotenv/config';
import { db } from '../server/db';
import { users } from '../shared/schema';
import { hashPassword, verifyPassword } from '../server/auth/service';
import { eq } from 'drizzle-orm';

async function resetDemoUser() {
  if (!db) {
    console.log('No DB connection');
    process.exit(1);
  }
  
  const demoUsername = 'demo';
  const demoPassword = 'demo123';
  
  console.log('🔄 Reseteando usuario demo...\n');
  
  // 1. Buscar usuario existente
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.username, demoUsername))
    .limit(1);
  
  if (existingUser) {
    console.log('Usuario encontrado:', existingUser.id);
    console.log('Hash actual:', existingUser.password);
    
    // Verificar si la contraseña actual funciona
    const isValid = await verifyPassword(demoPassword, existingUser.password);
    console.log('¿Contraseña "demo123" válida?:', isValid);
    
    if (!isValid) {
      // Actualizar contraseña
      console.log('\n⚠️ Contraseña incorrecta. Actualizando...');
      const newHash = await hashPassword(demoPassword);
      console.log('Nuevo hash:', newHash);
      
      await db
        .update(users)
        .set({ password: newHash })
        .where(eq(users.id, existingUser.id));
      
      console.log('✅ Contraseña actualizada');
      
      // Verificar que funciona
      const [updated] = await db
        .select()
        .from(users)
        .where(eq(users.username, demoUsername))
        .limit(1);
      
      const nowValid = await verifyPassword(demoPassword, updated.password);
      console.log('¿Ahora válida?:', nowValid);
    }
  } else {
    console.log('❌ Usuario demo no encontrado. Creando...');
    const hash = await hashPassword(demoPassword);
    
    await db.insert(users).values({
      username: demoUsername,
      password: hash,
      role: 'abogado',
    });
    
    console.log('✅ Usuario demo creado');
  }
  
  console.log('\n📋 Credenciales:');
  console.log('   Usuario: demo');
  console.log('   Contraseña: demo123');
  
  process.exit(0);
}

resetDemoUser();

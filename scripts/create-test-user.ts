import 'dotenv/config';
import bcrypt from "bcryptjs";
import { db } from "../server/db.js";
import { storage } from "../server/storage.js";
import { users } from "../shared/schema.js";
import { eq } from "drizzle-orm";

const SALT_ROUNDS = 10;

async function createTestUser() {
  const testUsername = "admin";
  const testPassword = "admin123";
  
  console.log("🔍 Verificando usuario existente...");
  
  if (db) {
    // Usando base de datos PostgreSQL
    const [existing] = await db.select().from(users).where(eq(users.username, testUsername)).limit(1);
    
    if (existing) {
      console.log(`✅ Usuario "${testUsername}" ya existe en la base de datos`);
      console.log(`   ID: ${existing.id}`);
      console.log(`   Creado: ${existing.createdAt}`);
      console.log("\n⚠️  Si olvidaste la contraseña, borra el usuario y vuelve a ejecutar este script.");
    } else {
      const passwordHash = await bcrypt.hash(testPassword, SALT_ROUNDS);
      const [created] = await db
        .insert(users)
        .values({ username: testUsername, password: passwordHash })
        .returning();
      
      console.log(`✅ Usuario creado exitosamente en PostgreSQL:`);
      console.log(`   Username: ${testUsername}`);
      console.log(`   Password: ${testPassword}`);
      console.log(`   ID: ${created.id}`);
    }
  } else {
    // Usando almacenamiento en memoria
    const existing = await storage.getUserByUsername(testUsername);
    
    if (existing) {
      console.log(`✅ Usuario "${testUsername}" ya existe en memoria`);
      console.log(`   ID: ${existing.id}`);
      console.log(`   Creado: ${existing.createdAt}`);
      console.log("\n⚠️  Reinicia el servidor para crear un nuevo usuario (la memoria se limpia al reiniciar)");
    } else {
      const passwordHash = await bcrypt.hash(testPassword, SALT_ROUNDS);
      const created = await storage.createUser({
        username: testUsername,
        password: passwordHash,
      });
      
      console.log(`✅ Usuario creado exitosamente en memoria:`);
      console.log(`   Username: ${testUsername}`);
      console.log(`   Password: ${testPassword}`);
      console.log(`   ID: ${created.id}`);
    }
  }
  
  console.log("\n📝 Credenciales de prueba:");
  console.log(`   Username: ${testUsername}`);
  console.log(`   Password: ${testPassword}`);
  
  process.exit(0);
}

createTestUser().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});

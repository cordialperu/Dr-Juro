import 'dotenv/config';
import { db } from "../server/db.js";
import { clients } from "../shared/schema.js";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

async function migrateClients() {
  console.log("🔄 Migrando clientes del storage local a Neon...\n");

  const storageDir = path.join(process.cwd(), "storage", "clients");
  
  if (!fs.existsSync(storageDir)) {
    console.log("❌ No se encontró el directorio storage/clients");
    return;
  }

  const clientDirs = fs.readdirSync(storageDir);
  console.log(`📁 Encontrados ${clientDirs.length} clientes en storage local\n`);

  let migrated = 0;
  let skipped = 0;

  for (const clientId of clientDirs) {
    const clientPath = path.join(storageDir, clientId);
    
    if (!fs.statSync(clientPath).isDirectory()) continue;

    // Verificar si el cliente ya existe en Neon
    const [existing] = await db!.select().from(clients).where(eq(clients.id, clientId)).limit(1);
    
    if (existing) {
      console.log(`⏭️  Cliente ${clientId} ya existe - saltando`);
      skipped++;
      continue;
    }

    // Intentar leer metadata del cliente si existe
    const metadataPath = path.join(clientPath, "metadata.json");
    let clientName = clientId; // Default al ID si no hay metadata
    let contactInfo = null;
    
    if (fs.existsSync(metadataPath)) {
      try {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
        clientName = metadata.name || clientId;
        contactInfo = metadata.contactInfo || null;
      } catch (e) {
        console.log(`⚠️  No se pudo leer metadata para ${clientId}`);
      }
    }

    // Crear cliente en Neon con datos mínimos
    // NOTA: Este script de migración requiere un userId existente
    // Para ejecución real, primero debe crearse un usuario
    await db!.insert(clients).values({
      id: clientId,
      name: clientName,
      userId: 'migration-placeholder', // Deberá actualizarse con un userId real
      email: 'migracion@example.com',
      whatsappPrimary: '+51000000000',
      contactInfo: contactInfo,
    });

    console.log(`✅ Migrado: ${clientId}`);
    migrated++;
  }

  console.log("\n📊 Resumen:");
  console.log(`   ✅ Migrados: ${migrated}`);
  console.log(`   ⏭️  Saltados: ${skipped}`);
  console.log(`   📁 Total: ${clientDirs.length}`);
  console.log("\n🎉 Migración completada!");
  console.log("\n⚠️  NOTA: Los documentos en storage/clients/ se seguirán usando automáticamente.");
}

migrateClients()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

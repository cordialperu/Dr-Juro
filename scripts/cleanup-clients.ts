import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function cleanupClients() {
  console.log("🧹 Limpiando clientes duplicados...");

  if (!db) {
    console.error("❌ Base de datos no disponible");
    process.exit(1);
  }

  try {
    // 1. Encontrar clientes duplicados por nombre
    const duplicates = await db.execute(sql`
      SELECT name, COUNT(*) as count, MIN(created_at) as first_created
      FROM clients
      GROUP BY LOWER(name)
      HAVING COUNT(*) > 1
    `);

    console.log(`📊 Encontrados ${duplicates.rows.length} grupos de nombres duplicados`);

    // 2. Para cada grupo de duplicados, mantener el más antiguo y borrar los demás
    for (const dup of duplicates.rows as any[]) {
      console.log(`🔍 Procesando duplicados de: ${dup.name}`);
      
      await db.execute(sql`
        DELETE FROM clients
        WHERE LOWER(name) = LOWER(${dup.name})
        AND created_at > ${dup.first_created}
      `);
      
      console.log(`   ✅ Eliminados duplicados, mantenido el más antiguo`);
    }

    // 3. Contar clientes restantes
    const remainingClients = await db.execute(sql`
      SELECT COUNT(*) as count FROM clients
    `);

    console.log(`\n✨ Limpieza completada`);
    console.log(`📝 Total de clientes después de limpieza: ${(remainingClients.rows[0] as any).count}`);

  } catch (error) {
    console.error("❌ Error al limpiar clientes:", error);
    process.exit(1);
  }

  process.exit(0);
}

cleanupClients();

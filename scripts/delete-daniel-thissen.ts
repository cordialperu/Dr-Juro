import { db } from "../server/db";
import { clients } from "../shared/schema";
import { eq, sql } from "drizzle-orm";

async function deleteDanielThissen() {
  console.log("🗑️  Eliminando clientes con nombre 'Daniel Thissen'...\n");

  if (!db) {
    console.error("❌ Base de datos no disponible");
    process.exit(1);
  }

  try {
    // Buscar todos los clientes con ese nombre (case-insensitive)
    const clientsToDelete = await db
      .select()
      .from(clients)
      .where(sql`LOWER(${clients.name}) = LOWER('daniel thissen')`);

    if (clientsToDelete.length === 0) {
      console.log("✅ No se encontraron clientes con el nombre 'Daniel Thissen'");
      process.exit(0);
    }

    console.log(`📋 Encontrados ${clientsToDelete.length} cliente(s):`);
    clientsToDelete.forEach((client) => {
      console.log(`   - ID: ${client.id}, Nombre: ${client.name}, Creado: ${client.createdAt}`);
    });

    // Eliminar todos
    const result = await db
      .delete(clients)
      .where(sql`LOWER(${clients.name}) = LOWER('daniel thissen')`);

    console.log(`\n✅ Se eliminaron ${clientsToDelete.length} cliente(s) con éxito`);
  } catch (error) {
    console.error("❌ Error al eliminar clientes:", error);
    process.exit(1);
  }
}

deleteDanielThissen();

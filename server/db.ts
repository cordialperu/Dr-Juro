import pg from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const { Pool } = pg;

let pool: pg.Pool | null = null;
let db: NodePgDatabase<typeof schema> | null = null;

// Debug logging
console.log("🔍 db.ts module loading...");
console.log("🔍 DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("🔍 DATABASE_URL length:", process.env.DATABASE_URL?.length || 0);
console.log("🔍 NODE_ENV:", process.env.NODE_ENV);

// Initialize database on module load
const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl) {
  console.log("🔌 Initializing database connection...");
  pool = new Pool({ 
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    max: process.env.NODE_ENV === 'production' ? 10 : undefined
  });
  db = drizzle(pool, { schema });
  console.log("✅ Database connection initialized");
  
  // Auto-migrate
  (async () => {
    if (!pool) return;
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS legal_process_v2 (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          client_id VARCHAR NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
          data JSONB NOT NULL DEFAULT '{}',
          created_at TIMESTAMP DEFAULT now() NOT NULL,
          updated_at TIMESTAMP DEFAULT now() NOT NULL
        )
      `);
      console.log("✅ Auto-migrate: legal_process_v2 table ready");
    } catch (error: any) {
      console.warn("⚠️ Auto-migrate warning:", error.message);
    } finally {
      client.release();
    }
  })().catch(console.error);
} else {
  console.warn("⚠️ DATABASE_URL no está configurado. Ejecutando en modo solo memoria.");
}

export { db, pool };

export function getDb() {
  return db;
}

export function getPool() {
  return pool;
}

export const isDatabaseConfigured = () => db !== null;

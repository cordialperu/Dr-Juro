import pg from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const { Pool } = pg;

let poolInstance: pg.Pool | null = null;
let dbInstance: NodePgDatabase<typeof schema> | null = null;
let initialized = false;

function initializeDb() {
  if (initialized) return;
  initialized = true;
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl) {
    console.log("🔌 Initializing database connection...");
    poolInstance = new Pool({ 
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
      max: process.env.NODE_ENV === 'production' ? 10 : undefined
    });
    dbInstance = drizzle(poolInstance, { schema });
    console.log("✅ Database connection initialized");
    
    // Auto-migrate
    autoMigrate().catch(console.error);
  } else {
    console.warn("⚠️ DATABASE_URL no está configurado. Ejecutando en modo solo memoria.");
  }
}

// Auto-migrate: Create missing tables on startup
async function autoMigrate() {
  if (!poolInstance) return;
  
  const client = await poolInstance.connect();
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
}

// Export getters
export function getDb() {
  initializeDb();
  return dbInstance;
}

export function getPool() {
  initializeDb();
  return poolInstance;
}

// Create a proxy for legacy 'db' export that always returns the current instance
const dbProxy = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(target, prop) {
    initializeDb();
    if (!dbInstance) {
      throw new Error("Database not initialized - DATABASE_URL not set");
    }
    return (dbInstance as any)[prop];
  }
});

// Create a proxy for legacy 'pool' export
const poolProxy = new Proxy({} as pg.Pool, {
  get(target, prop) {
    initializeDb();
    if (!poolInstance) {
      throw new Error("Database not initialized - DATABASE_URL not set");
    }
    return (poolInstance as any)[prop];
  }
});

// Legacy exports using proxies
export const pool = poolProxy;
export const db = dbProxy;
export const isDatabaseConfigured = () => {
  initializeDb();
  return dbInstance !== null;
};

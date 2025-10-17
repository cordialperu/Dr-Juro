import pg from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

let poolInstance: pg.Pool | null = null;
let dbInstance: NodePgDatabase<typeof schema> | null = null;

if (databaseUrl) {
  poolInstance = new Pool({ connectionString: databaseUrl });
  dbInstance = drizzle(poolInstance, { schema });
} else {
  console.warn(
    "DATABASE_URL no está configurado. Ejecutando en modo solo memoria.",
  );
}

export const pool = poolInstance;
export const db = dbInstance;
export const isDatabaseConfigured = () => dbInstance !== null;

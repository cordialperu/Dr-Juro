import { config } from "dotenv";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import * as schema from "../shared/schema.js";

const { Pool } = pg;

// Load environment variables
config();

async function fixSchema() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  
  try {
    console.log("Adding missing columns to clients table...");
    
    // Add imputado columns
    await db.execute(sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS imputado_name VARCHAR(255)`);
    await db.execute(sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS imputado_dni VARCHAR(20)`);
    await db.execute(sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS imputado_relation VARCHAR(100)`);
    await db.execute(sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS imputado_contact VARCHAR(20)`);
    await db.execute(sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS imputado_email VARCHAR(255)`);
    await db.execute(sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS notify_imputado VARCHAR(10) DEFAULT 'false'`);
    
    console.log("✅ Columns added successfully");
    
    console.log("Creating legal_process_v2 table...");
    
    // Create legal_process_v2 table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS legal_process_v2 (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id VARCHAR NOT NULL UNIQUE REFERENCES clients(id),
        data JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    console.log("✅ Table created successfully");
    console.log("\n🎉 Schema fixed! You can now restart the server.");
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("Error fixing schema:", error);
    process.exit(1);
  }
}

fixSchema();

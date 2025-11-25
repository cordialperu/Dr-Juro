/**
 * Apply Notes, Timeline and Tags Migration
 * 
 * This script applies the comprehensive system enhancement migration:
 * 1. Creates notes table with full-text search
 * 2. Creates case_activity table for timeline
 * 3. Extends cases table with tags, category, priority
 * 4. Creates views for statistics
 * 5. Sets up triggers for automatic activity logging
 * 6. Creates search function for notes
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyMigration() {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error("❌ ERROR: DATABASE_URL environment variable not set");
    process.exit(1);
  }

  console.log("🔄 Connecting to database...");
  const pool = new Pool({ connectionString: DATABASE_URL });
  const db = drizzle(pool);

  try {
    // Read migration SQL
    const migrationPath = path.join(__dirname, "migrations", "add-notes-timeline-tags.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    console.log("📝 Executing migration SQL...");
    
    // Execute the entire SQL as a single transaction
    await pool.query(migrationSQL);

    console.log("✅ Migration completed successfully!");
    console.log("\n📊 Created objects:");
    console.log("   • notes table with full-text search indexes");
    console.log("   • case_activity table for timeline");
    console.log("   • Extended cases table with tags, category, priority");
    console.log("   • case_activity_summary view");
    console.log("   • case_notes_stats view");
    console.log("   • log_case_activity() trigger function");
    console.log("   • search_notes() search function");
    console.log("   • Automatic activity logging triggers");

    // Verify tables were created
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('notes', 'case_activity')
    `);
    
    const tableCount = tablesResult.rows.length;
    console.log(`\n✅ Tables verified: ${tableCount}/2`);

    if (tableCount !== 2) {
      console.warn("⚠️  Warning: Expected 2 tables (notes, case_activity) but found " + tableCount);
    }

    // Check if cases table was extended
    const casesColumnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'cases'
      AND column_name IN ('tags', 'category', 'priority')
    `);
    
    console.log(`✅ Cases table extended with ${casesColumnsResult.rows.length}/3 new columns`);

  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log("\n🔌 Database connection closed");
  }
}

// Run migration
applyMigration().catch(console.error);

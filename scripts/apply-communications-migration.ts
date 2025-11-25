/**
 * Apply Communications System Migration
 * 
 * This script applies the communications system migration to the database.
 * It will:
 * 1. Extend the clients table with communication fields
 * 2. Create communication_templates table
 * 3. Create communications_log table
 * 4. Create scheduled_reminders table
 * 5. Create case_events table
 * 6. Insert 6 system templates (Spanish)
 * 7. Create replace_template_variables function
 * 8. Create case_communications_summary view
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
    const migrationPath = path.join(__dirname, "migrations", "add-communications-system.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    console.log("📝 Executing migration SQL...");
    
    // Execute the entire SQL as a single transaction
    await pool.query(migrationSQL);

    console.log("✅ Migration completed successfully!");
    console.log("\n📊 Created objects:");
    console.log("   • Extended clients table with 9 communication fields");
    console.log("   • communication_templates table (with 6 system templates)");
    console.log("   • communications_log table");
    console.log("   • scheduled_reminders table");
    console.log("   • case_events table");
    console.log("   • replace_template_variables() function");
    console.log("   • case_communications_summary view");

    // Verify system templates were inserted
    const templatesResult = await pool.query(
      "SELECT COUNT(*) as count FROM communication_templates WHERE is_system = 'true'"
    );
    const templateCount = templatesResult.rows[0].count;
    
    console.log(`\n✅ System templates inserted: ${templateCount}/6`);

    if (templateCount !== "6") {
      console.warn("⚠️  Warning: Expected 6 system templates but found " + templateCount);
    }

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

import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log("=== Fixing Demo Password ===\n");
  
  // 1. Get current user
  const users = await sql`SELECT id, username, password FROM users WHERE username = 'demo'`;
  
  if (users.length === 0) {
    console.log("No demo user found, creating one...");
    const newHash = await bcrypt.hash("demo123", 10);
    await sql`INSERT INTO users (username, password, role) VALUES ('demo', ${newHash}, 'user')`;
    console.log("Demo user created with password: demo123");
    return;
  }
  
  const user = users[0];
  console.log("User ID:", user.id);
  console.log("Current hash:", user.password);
  console.log("Hash length:", user.password.length);
  
  // 2. Test current password
  const currentCheck = await bcrypt.compare("demo123", user.password);
  console.log("\nCurrent password check:", currentCheck);
  
  // 3. Generate fresh hash
  const freshHash = await bcrypt.hash("demo123", 10);
  console.log("\nNew hash:", freshHash);
  console.log("New hash length:", freshHash.length);
  
  // 4. Test fresh hash
  const freshCheck = await bcrypt.compare("demo123", freshHash);
  console.log("Fresh hash check:", freshCheck);
  
  // 5. Update password
  await sql`UPDATE users SET password = ${freshHash} WHERE id = ${user.id}`;
  console.log("\n✅ Password updated!");
  
  // 6. Verify update
  const updated = await sql`SELECT password FROM users WHERE id = ${user.id}`;
  const finalCheck = await bcrypt.compare("demo123", updated[0].password);
  console.log("Final verification:", finalCheck);
}

main().catch(console.error);

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "@shared/schema";
import { storage } from "../storage";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  console.log("[AUTH-SVC] verifyPassword called");
  console.log("[AUTH-SVC] password length:", password?.length);
  console.log("[AUTH-SVC] hash length:", hash?.length);
  console.log("[AUTH-SVC] hash:", hash);
  const result = await bcrypt.compare(password, hash);
  console.log("[AUTH-SVC] bcrypt.compare result:", result);
  return result;
}

export async function findUserByUsername(username: string) {
  console.log("[AUTH-SVC] findUserByUsername:", username);
  console.log("[AUTH-SVC] db configured:", !!db);
  
  if (db) {
    const results = await db.select().from(users).where(eq(users.username, username)).limit(1);
    console.log("[AUTH-SVC] db query results count:", results.length);
    if (results.length > 0) {
      console.log("[AUTH-SVC] user found, password hash:", results[0].password);
    }
    return results[0] ?? null;
  }

  console.log("[AUTH-SVC] Using storage fallback");
  return storage.getUserByUsername(username) ?? null;
}

export async function findUserById(id: string) {
  if (db) {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user ?? null;
  }

  return storage.getUser(id) ?? null;
}

export async function createUser({ username, password }: { username: string; password: string }) {
  const passwordHash = await hashPassword(password);
  if (db) {
    const [created] = await db
      .insert(users)
      .values({ username, password: passwordHash })
      .returning({ id: users.id, username: users.username, role: users.role, createdAt: users.createdAt });

    return created;
  }

  return storage.createUser({ username, password: passwordHash });
}

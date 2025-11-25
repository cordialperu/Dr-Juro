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
  return bcrypt.compare(password, hash);
}

export async function findUserByUsername(username: string) {
  if (db) {
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return user ?? null;
  }

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

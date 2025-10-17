import type { Express } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import memorystore from "memorystore";
import { pool } from "../db";

const PgSession = connectPgSimple(session);
const MemoryStore = memorystore(session);

export function setupSession(app: Express) {
  const oneWeekMs = 1000 * 60 * 60 * 24 * 7;

  const store = pool
    ? new PgSession({
        pool,
        createTableIfMissing: true,
        tableName: "user_sessions",
      })
    : new MemoryStore({ checkPeriod: oneWeekMs });

  if (!pool) {
    console.warn(
      "DATABASE_URL no configurado; utilizando MemoryStore para sesiones.",
    );
  }

  app.use(
    session({
      store,
      secret: process.env.SESSION_SECRET ?? "development-session-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: oneWeekMs,
        sameSite: "lax",
        secure: app.get("env") === "production",
        httpOnly: true,
      },
    }),
  );
}

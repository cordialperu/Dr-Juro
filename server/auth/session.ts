import type { Express } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import memorystore from "memorystore";
import { pool } from "../db";

const PgSession = connectPgSimple(session);
const MemoryStore = memorystore(session);

export function setupSession(app: Express) {
  const oneWeekMs = 1000 * 60 * 60 * 24 * 7;
  const isProduction = app.get("env") === "production";

  // Validar SESSION_SECRET en producción
  if (isProduction && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === "development-session-secret")) {
    console.warn(
      "⚠️ SESSION_SECRET no configurado o inseguro en producción. Usando secreto por defecto (INSEGURO)."
    );
  }

  const store = (pool && !process.env.VERCEL)
    ? new PgSession({
        pool,
        createTableIfMissing: true,
        tableName: "user_sessions",
        pruneSessionInterval: 60 * 15, // Limpiar sesiones expiradas cada 15 min
      })
    : new MemoryStore({ checkPeriod: oneWeekMs });

  if (!pool || process.env.VERCEL) {
    console.warn(
      "⚠️  Usando MemoryStore para sesiones (Vercel o sin DB).",
    );
  }

  app.use(
    session({
      store,
      secret: process.env.SESSION_SECRET ?? "development-session-secret",
      resave: false,
      saveUninitialized: false,
      name: "drjuro.sid", // Nombre personalizado (oculta que usa express-session)
      cookie: {
        maxAge: oneWeekMs,
        sameSite: isProduction ? "strict" : "lax",
        secure: isProduction, // Solo HTTPS en producción
        httpOnly: true, // No accesible desde JavaScript
      },
    }),
  );
}

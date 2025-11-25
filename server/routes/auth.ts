import type { Router } from "express";
import { z } from "zod";
import { asyncHandler, HttpError } from "../lib/http";
import {
  createUser,
  findUserById,
  findUserByUsername,
  verifyPassword,
} from "../auth/service";
import { signToken, verifyToken } from "../lib/jwt";
import bcrypt from "bcryptjs";

const credentialsSchema = z.object({
  username: z.string().min(3, "Usuario demasiado corto"),
  password: z.string().min(6, "Contraseña demasiado corta"),
});

export function registerAuthRoutes(router: Router) {
  // Debug endpoint to check user data
  router.get(
    "/auth/debug/:username",
    asyncHandler(async (req, res) => {
      const user = await findUserByUsername(req.params.username);
      if (!user) {
        return res.json({ found: false });
      }
      
      const testPassword = "demo123";
      const comparison = await bcrypt.compare(testPassword, user.password);
      
      res.json({
        found: true,
        userId: user.id,
        username: user.username,
        passwordHashLength: user.password?.length,
        passwordHashStart: user.password?.substring(0, 20),
        bcryptCompareResult: comparison
      });
    }),
  );

  router.post(
    "/auth/login",
    asyncHandler(async (req, res) => {
      console.log("[AUTH] Login attempt:", req.body?.username);
      
      const parseResult = credentialsSchema.safeParse(req.body);
      if (!parseResult.success) {
        console.log("[AUTH] Validation failed:", parseResult.error.issues);
        throw new HttpError(400, parseResult.error.issues.map((issue) => issue.message).join("; "));
      }

      const { username, password } = parseResult.data;

      const user = await findUserByUsername(username);
      console.log("[AUTH] User found:", user ? user.id : "NOT FOUND");
      
      if (!user) {
        throw new HttpError(401, "Credenciales inválidas");
      }

      const isValid = await verifyPassword(password, user.password);
      console.log("[AUTH] Password valid:", isValid);
      
      if (!isValid) {
        throw new HttpError(401, "Credenciales inválidas");
      }

      const token = signToken({ userId: user.id, userRole: user.role });
      
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      
      res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
        token,
      });
    }),
  );

  router.post(
    "/auth/logout",
    asyncHandler(async (req, res) => {
      res.clearCookie('auth_token');
      res.status(204).end();
    }),
  );

  router.get(
    "/auth/profile",
    asyncHandler(async (req, res) => {
      const token = req.cookies.auth_token || req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        throw new HttpError(401, "No autenticado");
      }

      const payload = verifyToken(token);
      if (!payload) {
        throw new HttpError(401, "Token inválido o expirado");
      }

      const user = await findUserById(payload.userId);
      if (!user) {
        throw new HttpError(404, "Usuario no encontrado");
      }

      res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
      });
    }),
  );

  router.post(
    "/auth/register",
    asyncHandler(async (req, res) => {
      const parseResult = credentialsSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new HttpError(400, parseResult.error.issues.map((issue) => issue.message).join("; "));
      }

      const { username, password } = parseResult.data;
      const existing = await findUserByUsername(username);
      if (existing) {
        throw new HttpError(409, "Usuario ya existe");
      }

      const created = await createUser({ username, password });
      const token = signToken({ userId: created.id, userRole: created.role });
      
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({ ...created, token });
    }),
  );
}

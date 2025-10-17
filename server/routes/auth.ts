import type { Router } from "express";
import { z } from "zod";
import { asyncHandler, HttpError } from "../lib/http";
import {
  createUser,
  findUserById,
  findUserByUsername,
  verifyPassword,
} from "../auth/service";

const credentialsSchema = z.object({
  username: z.string().min(3, "Usuario demasiado corto"),
  password: z.string().min(6, "Contraseña demasiado corta"),
});

export function registerAuthRoutes(router: Router) {
  router.post(
    "/auth/login",
    asyncHandler(async (req, res) => {
      const parseResult = credentialsSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new HttpError(400, parseResult.error.issues.map((issue) => issue.message).join("; "));
      }

      const { username, password } = parseResult.data;

      const user = await findUserByUsername(username);
      if (!user) {
        throw new HttpError(401, "Credenciales inválidas");
      }

      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        throw new HttpError(401, "Credenciales inválidas");
      }

      req.session.userId = user.id;
      res.json({
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      });
    }),
  );

  router.post(
    "/auth/logout",
    asyncHandler(async (req, res) => {
      if (!req.session.userId) {
        res.status(204).end();
        return;
      }

      await new Promise<void>((resolve, reject) => {
        req.session.destroy((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.status(204).end();
    }),
  );

  router.get(
    "/auth/profile",
    asyncHandler(async (req, res) => {
      if (!req.session.userId) {
        throw new HttpError(401, "No autenticado");
      }

      const user = await findUserById(req.session.userId);
      if (!user) {
        throw new HttpError(404, "Usuario no encontrado");
      }

      res.json({
        id: user.id,
        username: user.username,
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
      req.session.userId = created.id;

      res.status(201).json(created);
    }),
  );
}

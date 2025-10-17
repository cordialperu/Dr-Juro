import type { Router } from "express";
import { ZodError } from "zod";
import { db } from "../db";
import { clients, insertClientSchema } from "@shared/schema";
import { asyncHandler, HttpError, formatZodError } from "../lib/http";
import { storage } from "../storage";
import { sql, desc } from "drizzle-orm";

export function registerClientRoutes(router: Router) {
  router.get(
    "/clients",
    asyncHandler(async (_req, res) => {
      if (!db) {
        const allClients = await storage.getClients();
        // Ordenar por fecha de creación descendente (más recientes primero)
        allClients.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        res.json(allClients);
        return;
      }

      // Ordenar por fecha de creación descendente (más recientes primero)
      const allClients = await db
        .select()
        .from(clients)
        .orderBy(desc(clients.createdAt));
      res.json(allClients);
    }),
  );

  router.post(
    "/clients",
    asyncHandler(async (req, res) => {
      try {
        const validatedData = insertClientSchema.parse(req.body);
        if (!db) {
          const newClient = await storage.createClient(validatedData);
          res.status(201).json(newClient);
          return;
        }

        const [newClient] = await db.insert(clients).values(validatedData).returning();
        res.status(201).json(newClient);
      } catch (error) {
        if (error instanceof ZodError) {
          throw new HttpError(400, `Datos inválidos: ${formatZodError(error)}`);
        }
        throw error;
      }
    }),
  );

  // Endpoint para eliminar clientes por nombre (útil para limpieza)
  router.delete(
    "/clients/by-name/:name",
    asyncHandler(async (req, res) => {
      const { name } = req.params;

      if (!db) {
        res.status(503).json({ error: "Base de datos no disponible" });
        return;
      }

      // Buscar primero para reportar cuántos se eliminarán
      const clientsToDelete = await db
        .select()
        .from(clients)
        .where(sql`LOWER(${clients.name}) = LOWER(${name})`);

      if (clientsToDelete.length === 0) {
        res.json({ deleted: 0, message: "No se encontraron clientes con ese nombre" });
        return;
      }

      // Eliminar
      await db
        .delete(clients)
        .where(sql`LOWER(${clients.name}) = LOWER(${name})`);

      res.json({ 
        deleted: clientsToDelete.length, 
        message: `Se eliminaron ${clientsToDelete.length} cliente(s) con el nombre "${name}"`,
        clients: clientsToDelete 
      });
    }),
  );
}

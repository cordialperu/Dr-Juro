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
    asyncHandler(async (req, res) => {
      // Verificar autenticación
      if (!req.session || !req.session.userId) {
        throw new HttpError(401, "No autenticado");
      }

      const userId = req.session.userId;

      // Paginación: ?page=1&limit=20
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100); // Max 100
      const offset = (page - 1) * limit;

      if (!db) {
        const allClients = await storage.getClients();
        // Filtrar por usuario
        const userClients = allClients.filter(c => c.userId === userId);
        // Ordenar por fecha de creación descendente
        userClients.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        
        // Aplicar paginación manual para storage
        const paginatedClients = userClients.slice(offset, offset + limit);
        
        res.json({
          data: paginatedClients,
          pagination: {
            page,
            limit,
            total: userClients.length,
            totalPages: Math.ceil(userClients.length / limit),
          },
        });
        return;
      }

      // Obtener total de registros del usuario
      const [{ count }] = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(clients)
        .where(sql`${clients.userId} = ${userId}`);

      // Obtener página de resultados del usuario
      const paginatedClients = await db
        .select()
        .from(clients)
        .where(sql`${clients.userId} = ${userId}`)
        .orderBy(desc(clients.createdAt))
        .limit(limit)
        .offset(offset);

      res.json({
        data: paginatedClients,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      });
    }),
  );

  router.get(
    "/clients/:id",
    asyncHandler(async (req, res) => {
      // Verificar autenticación
      if (!req.session || !req.session.userId) {
        throw new HttpError(401, "No autenticado");
      }

      const { id } = req.params;
      const userId = req.session.userId;

      if (!db) {
        const client = await storage.getClient(id);
        if (!client || client.userId !== userId) {
          throw new HttpError(404, "Cliente no encontrado");
        }
        res.json(client);
        return;
      }

      const [client] = await db
        .select()
        .from(clients)
        .where(sql`${clients.id} = ${id} AND ${clients.userId} = ${userId}`)
        .limit(1);

      if (!client) {
        throw new HttpError(404, "Cliente no encontrado");
      }

      res.json(client);
    }),
  );

  router.post(
    "/clients",
    asyncHandler(async (req, res) => {
      // Verificar autenticación
      if (!req.session || !req.session.userId) {
        throw new HttpError(401, "No autenticado");
      }

      try {
        // Validar datos del body (sin userId)
        const validatedData = insertClientSchema.parse(req.body);
        
        // Agregar userId del usuario autenticado DESPUÉS de validar
        const dataWithUserId = {
          ...validatedData,
          userId: req.session.userId
        };

        if (!db) {
          const newClient = await storage.createClient(dataWithUserId);
          res.status(201).json(newClient);
          return;
        }

        const [newClient] = await db.insert(clients).values(dataWithUserId).returning();
        res.status(201).json(newClient);
      } catch (error) {
        if (error instanceof ZodError) {
          throw new HttpError(400, `Datos inválidos: ${formatZodError(error)}`);
        }
        throw error;
      }
    }),
  );

  // Actualizar cliente
  router.put(
    "/clients/:id",
    asyncHandler(async (req, res) => {
      // Verificar autenticación
      if (!req.session || !req.session.userId) {
        throw new HttpError(401, "No autenticado");
      }

      const { id } = req.params;
      const userId = req.session.userId;
      const updateData = req.body;

      // No permitir cambiar el userId
      delete updateData.userId;

      if (!db) {
        const updatedClient = await storage.updateClient(id, updateData);
        if (!updatedClient || updatedClient.userId !== userId) {
          throw new HttpError(404, "Cliente no encontrado");
        }
        res.json(updatedClient);
        return;
      }

      // Verificar que el cliente existe y pertenece al usuario
      const [existingClient] = await db
        .select()
        .from(clients)
        .where(sql`${clients.id} = ${id} AND ${clients.userId} = ${userId}`)
        .limit(1);

      if (!existingClient) {
        throw new HttpError(404, "Cliente no encontrado");
      }

      // Actualizar
      const [updatedClient] = await db
        .update(clients)
        .set(updateData)
        .where(sql`${clients.id} = ${id}`)
        .returning();

      res.json(updatedClient);
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

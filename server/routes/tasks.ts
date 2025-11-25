import type { Router } from "express";
import { and, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { tasks } from "@shared/schema";
import { asyncHandler, HttpError } from "../lib/http";
import { storage } from "../storage";

const TaskStatusSchema = z.enum(["pending", "in_progress", "completed"]);
const TaskPrioritySchema = z.enum(["low", "medium", "high"]);

const CreateTaskSchema = z.object({
  title: z.string().min(1, "Debes ingresar un título"),
  description: z.string().nullable().optional(),
  status: TaskStatusSchema.optional(),
  priority: TaskPrioritySchema.optional(),
  dueDate: z.union([z.string(), z.date(), z.null()]).optional(),
  caseId: z.string().uuid().nullable().optional(),
  assignedTo: z.string().uuid().nullable().optional(),
});

const UpdateTaskSchema = CreateTaskSchema.partial();

const parseDueDate = (value: unknown) => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    throw new HttpError(400, "El formato de la fecha límite no es válido.");
  }
  return parsed;
};

const normalizeTaskPayload = (payload: z.infer<typeof CreateTaskSchema>) => ({
  title: payload.title.trim(),
  description: payload.description ? payload.description.trim() : null,
  status: payload.status ?? "pending",
  priority: payload.priority ?? "medium",
  dueDate: payload.dueDate ? parseDueDate(payload.dueDate) : null,
  caseId: payload.caseId ?? null,
  assignedTo: payload.assignedTo ?? null,
});

const normalizeUpdatePayload = (payload: z.infer<typeof UpdateTaskSchema>) => {
  const update: Record<string, unknown> = {};

  if (payload.title !== undefined) {
    if (!payload.title.trim()) {
      throw new HttpError(400, "El título no puede estar vacío.");
    }
    update.title = payload.title.trim();
  }
  if (payload.description !== undefined) {
    update.description = payload.description ? payload.description.trim() : null;
  }
  if (payload.status !== undefined) {
    update.status = payload.status;
  }
  if (payload.priority !== undefined) {
    update.priority = payload.priority;
  }
  if (payload.dueDate !== undefined) {
    update.dueDate = payload.dueDate ? parseDueDate(payload.dueDate) : null;
  }
  if (payload.caseId !== undefined) {
    update.caseId = payload.caseId ?? null;
  }
  if (payload.assignedTo !== undefined) {
    update.assignedTo = payload.assignedTo ?? null;
  }

  return update;
};

const isTableMissingError = (error: unknown) =>
  typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "42P01";

export function registerTaskRoutes(router: Router) {
  const shouldUseDatabase = Boolean(db) && process.env.NODE_ENV === "production";
  const database = shouldUseDatabase ? db! : null;

  router.get(
    "/clients/:clientId/tasks",
    asyncHandler(async (req, res) => {
      const { clientId } = req.params;
      
      if (!shouldUseDatabase || !database) {
        // Return empty array for now - tasks are typically associated with cases, not clients directly
        res.json([]);
        return;
      }

      // Return empty array - tasks are case-based, not client-based
      res.json([]);
    }),
  );

  router.get(
    "/tasks",
    asyncHandler(async (req, res) => {
      const statusQuery = typeof req.query.status === "string" ? req.query.status : undefined;
      const caseIdQuery = typeof req.query.caseId === "string" ? req.query.caseId : undefined;
      const searchQuery = typeof req.query.search === "string" ? req.query.search : undefined;

      if (statusQuery && !TaskStatusSchema.safeParse(statusQuery).success) {
        throw new HttpError(400, "Estado de tarea no válido.");
      }

      if (!shouldUseDatabase || !database) {
        const allTasks = await storage.getTasks();
        const filtered = allTasks.filter((task) => {
          const statusMatch = statusQuery ? task.status === statusQuery : true;
          const caseMatch = caseIdQuery ? task.caseId === caseIdQuery : true;
          const searchMatch = searchQuery
            ? task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (task.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())
            : true;
          return statusMatch && caseMatch && searchMatch;
        });
        res.json(filtered);
        return;
      }

      const filters: any[] = [];
      if (statusQuery) {
        filters.push(eq(tasks.status, statusQuery));
      }
      if (caseIdQuery) {
        filters.push(eq(tasks.caseId, caseIdQuery));
      }
      if (searchQuery) {
        const likeValue = `%${searchQuery}%`;
        filters.push(
          or(
            ilike(tasks.title, likeValue),
            ilike(tasks.description, likeValue),
          ),
        );
      }

      try {
        const results = filters.length > 0
          ? await database.select().from(tasks).where(and(...filters))
          : await database.select().from(tasks);

        res.json(results);
      } catch (error) {
        console.error("DB query for tasks failed", error);
        if (isTableMissingError(error) || !shouldUseDatabase || !database) {
          const allTasks = await storage.getTasks();
          const filtered = allTasks.filter((task) => {
            const statusMatch = statusQuery ? task.status === statusQuery : true;
            const caseMatch = caseIdQuery ? task.caseId === caseIdQuery : true;
            const searchMatch = searchQuery
              ? task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (task.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())
              : true;
            return statusMatch && caseMatch && searchMatch;
          });
          res.json(filtered);
          return;
        }
        throw error;
      }
    }),
  );

  router.post(
    "/tasks",
    asyncHandler(async (req, res) => {
      const payload = CreateTaskSchema.parse(req.body ?? {});
      const data = normalizeTaskPayload(payload);

      if (!shouldUseDatabase || !database) {
        const task = await storage.createTask(data);
        res.status(201).json(task);
        return;
      }

      try {
        const [task] = await database.insert(tasks).values(data).returning();
        res.status(201).json(task);
      } catch (error) {
        console.error("DB insert for tasks failed", error);
        if (isTableMissingError(error) || !shouldUseDatabase || !database) {
          const task = await storage.createTask(data);
          res.status(201).json(task);
          return;
        }
        throw error;
      }
    }),
  );

  router.patch(
    "/tasks/:id",
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      const payload = UpdateTaskSchema.parse(req.body ?? {});
      const update = normalizeUpdatePayload(payload);

      if (Object.keys(update).length === 0) {
        throw new HttpError(400, "No se proporcionaron cambios para la tarea.");
      }

      if (!shouldUseDatabase || !database) {
        const task = await storage.updateTask(id, update);
        if (!task) {
          throw new HttpError(404, "Tarea no encontrada");
        }
        res.json(task);
        return;
      }

      try {
        const [task] = await database
          .update(tasks)
          .set({
            ...update,
            updatedAt: new Date(),
          })
          .where(eq(tasks.id, id))
          .returning();

        if (!task) {
          throw new HttpError(404, "Tarea no encontrada");
        }

        res.json(task);
      } catch (error) {
        console.error("DB update for tasks failed", error);
        if (isTableMissingError(error) || !shouldUseDatabase || !database) {
          const task = await storage.updateTask(id, update);
          if (!task) {
            throw new HttpError(404, "Tarea no encontrada");
          }
          res.json(task);
          return;
        }
        throw error;
      }
    }),
  );

  router.delete(
    "/tasks/:id",
    asyncHandler(async (req, res) => {
      const { id } = req.params;

      if (!shouldUseDatabase || !database) {
        const deleted = await storage.deleteTask(id);
        if (!deleted) {
          throw new HttpError(404, "Tarea no encontrada");
        }
        res.json({ success: true });
        return;
      }

      try {
        await database.delete(tasks).where(eq(tasks.id, id));
        res.json({ success: true });
      } catch (error) {
        console.error("DB delete for tasks failed", error);
        if (isTableMissingError(error) || !shouldUseDatabase || !database) {
          const deleted = await storage.deleteTask(id);
          if (!deleted) {
            throw new HttpError(404, "Tarea no encontrada");
          }
          res.json({ success: true });
          return;
        }
        throw error;
      }
    }),
  );
}

import type { Router } from "express";
import { eq } from "drizzle-orm";
import { ZodError } from "zod";
import { db } from "../db";
import { cases, insertCaseSchema } from "@shared/schema";
import { asyncHandler, HttpError, formatZodError } from "../lib/http";
import { storage } from "../storage";

const normalizeStatus = (status: string | null | undefined) => {
  switch (status) {
    case "active":
    case "pending":
    case "closed":
    case "review":
      return status;
    default:
      return "active";
  }
};

export function registerCaseRoutes(router: Router) {
  router.get(
    "/cases",
    asyncHandler(async (_req, res) => {
      if (!db) {
        const allCases = await storage.getCases();
        res.json(allCases);
        return;
      }

      const allCases = await db.select().from(cases);
      res.json(allCases);
    }),
  );

  router.post(
    "/cases",
    asyncHandler(async (req, res) => {
      try {
        const validatedData = insertCaseSchema.parse(req.body);
        if (!db) {
          const newCase = await storage.createCase(validatedData);
          res.status(201).json(newCase);
          return;
        }

        const [newCase] = await db.insert(cases).values(validatedData).returning();
        res.status(201).json(newCase);
      } catch (error) {
        if (error instanceof ZodError) {
          throw new HttpError(400, `Datos inválidos: ${formatZodError(error)}`);
        }
        throw error;
      }
    }),
  );

  router.patch(
    "/cases/:id",
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      const updatePayload = req.body ?? {};

      if (Object.keys(updatePayload).length === 0) {
        throw new HttpError(400, "No se proporcionaron cambios para el expediente.");
      }
      const normalizedStatus = normalizeStatus(updatePayload.status);

      if (!db) {
        const updatedCase = await storage.updateCase(id, {
          ...updatePayload,
          status: normalizedStatus,
        });

        if (!updatedCase) {
          throw new HttpError(404, "Caso no encontrado");
        }

        res.json(updatedCase);
        return;
      }

      const [updatedCase] = await db
        .update(cases)
        .set({
          ...updatePayload,
          status: normalizedStatus,
          updatedAt: new Date(),
        })
        .where(eq(cases.id, id))
        .returning();

      if (!updatedCase) {
        throw new HttpError(404, "Caso no encontrado");
      }

      res.json(updatedCase);
    }),
  );

  router.delete(
    "/cases/:id",
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      if (!db) {
        const deleted = await storage.deleteCase(id);
        if (!deleted) {
          throw new HttpError(404, "Caso no encontrado");
        }

        res.json({ success: true });
        return;
      }

      await db.delete(cases).where(eq(cases.id, id));
      res.json({ success: true });
    }),
  );
}

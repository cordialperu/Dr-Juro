import type { Router } from "express";
import { asyncHandler } from "../lib/http";
import { db } from "../db";
import { caseActivity } from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import type { InsertCaseActivity } from "@shared/schema";

export function registerCaseActivityRoutes(router: Router) {
  // Obtener timeline de actividad de un caso
  router.get(
    "/cases/:caseId/activity",
    asyncHandler(async (req, res) => {
      const { caseId } = req.params;
      const { type, limit, offset } = req.query;

      if (!db) {
        return res.status(503).json({ error: "Database not configured" });
      }

      try {
        const limitNum = limit ? parseInt(limit as string, 10) : 50;
        const offsetNum = offset ? parseInt(offset as string, 10) : 0;

        let conditions = [eq(caseActivity.caseId, caseId)];

        // Filtrar por tipo de actividad si se especifica
        if (type && typeof type === "string") {
          conditions.push(eq(caseActivity.activityType, type));
        }

        const result = await db
          .select()
          .from(caseActivity)
          .where(and(...conditions))
          .orderBy(desc(caseActivity.createdAt))
          .limit(limitNum)
          .offset(offsetNum);

        res.json(result);
      } catch (error) {
        console.error("Error fetching activity:", error);
        res.status(500).json({ error: "Failed to fetch activity" });
      }
    })
  );

  // Crear actividad manualmente (para eventos personalizados)
  router.post(
    "/cases/:caseId/activity",
    asyncHandler(async (req, res) => {
      const { caseId } = req.params;
      const userId = req.session?.userId;

      if (!db) {
        return res.status(503).json({ error: "Database not configured" });
      }

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      try {
        const activityData: InsertCaseActivity = {
          caseId,
          activityType: req.body.activityType,
          description: req.body.description,
          metadata: req.body.metadata || {},
          performedBy: userId,
        };

        const [newActivity] = await db
          .insert(caseActivity)
          .values(activityData)
          .returning();

        res.status(201).json(newActivity);
      } catch (error) {
        console.error("Error creating activity:", error);
        res.status(500).json({ error: "Failed to create activity" });
      }
    })
  );

  // Obtener resumen de actividad (vista agregada)
  router.get(
    "/cases/:caseId/activity/summary",
    asyncHandler(async (req, res) => {
      const { caseId } = req.params;

      if (!db) {
        return res.status(503).json({ error: "Database not configured" });
      }

      try {
        const result = await db.execute(sql`
          SELECT * FROM case_activity_summary
          WHERE case_id = ${caseId}
        `);

        res.json(result.rows[0] || null);
      } catch (error) {
        console.error("Error fetching activity summary:", error);
        res.status(500).json({ error: "Failed to fetch activity summary" });
      }
    })
  );

  // Obtener tipos de actividad únicos para un caso
  router.get(
    "/cases/:caseId/activity/types",
    asyncHandler(async (req, res) => {
      const { caseId } = req.params;

      if (!db) {
        return res.status(503).json({ error: "Database not configured" });
      }

      try {
        const result = await db
          .selectDistinct({ activityType: caseActivity.activityType })
          .from(caseActivity)
          .where(eq(caseActivity.caseId, caseId))
          .orderBy(caseActivity.activityType);

        const types = result.map(row => row.activityType);
        res.json(types);
      } catch (error) {
        console.error("Error fetching activity types:", error);
        res.status(500).json({ error: "Failed to fetch activity types" });
      }
    })
  );

  // Obtener estadísticas de actividad por tipo
  router.get(
    "/cases/:caseId/activity/stats",
    asyncHandler(async (req, res) => {
      const { caseId } = req.params;

      if (!db) {
        return res.status(503).json({ error: "Database not configured" });
      }

      try {
        const result = await db.execute(sql`
          SELECT 
            activity_type,
            COUNT(*) as count,
            MAX(created_at) as last_occurrence
          FROM case_activity
          WHERE case_id = ${caseId}
          GROUP BY activity_type
          ORDER BY count DESC
        `);

        res.json(result.rows);
      } catch (error) {
        console.error("Error fetching activity stats:", error);
        res.status(500).json({ error: "Failed to fetch activity stats" });
      }
    })
  );
}

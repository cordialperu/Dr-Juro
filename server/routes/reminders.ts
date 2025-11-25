import type { Router } from "express";
import { db } from "../db";
import { scheduledReminders } from "../../shared/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export function registerRemindersRoutes(router: Router) {
  // Get upcoming reminders for a case (next 7 days)
  router.get("/cases/:caseId/reminders/upcoming", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).send("Unauthorized");
      }

      const { caseId } = req.params;
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const reminders = await db!
        .select()
        .from(scheduledReminders)
        .where(
          and(
            eq(scheduledReminders.caseId, caseId),
            eq(scheduledReminders.status, "scheduled"),
            gte(scheduledReminders.scheduledFor, now),
            lte(scheduledReminders.scheduledFor, nextWeek)
          )
        )
        .orderBy(scheduledReminders.scheduledFor);

      res.json(reminders);
    } catch (error: any) {
      console.error("Error fetching upcoming reminders:", error);
      res.status(500).json({ message: "Error al obtener recordatorios" });
    }
  });

  // Get all reminders for a case
  router.get("/cases/:caseId/reminders", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).send("Unauthorized");
      }

      const { caseId } = req.params;
      const { status } = req.query;

      const conditions: any[] = [eq(scheduledReminders.caseId, caseId)];
      if (status && typeof status === "string") {
        conditions.push(eq(scheduledReminders.status, status));
      }

      const baseQuery = db!.select().from(scheduledReminders);
      const query = conditions.length ? baseQuery.where(and(...conditions)) : baseQuery;

      const reminders = await query.orderBy(scheduledReminders.scheduledFor);

      res.json(reminders);
    } catch (error: any) {
      console.error("Error fetching reminders:", error);
      res.status(500).json({ message: "Error al obtener recordatorios" });
    }
  });

  // Create new reminder
  router.post("/cases/:caseId/reminders", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).send("Unauthorized");
      }

      const { caseId } = req.params;
      const {
        clientId,
        templateId,
        reminderType,
        title,
        description,
        scheduledFor,
        channel,
        recurrence,
      } = req.body;

      if (!clientId || !reminderType || !title || !scheduledFor || !channel) {
        return res.status(400).json({ message: "Faltan campos requeridos" });
      }

      const newReminder = await db!
        .insert(scheduledReminders)
        .values({
          id: sql`gen_random_uuid()`,
          caseId,
          clientId,
          templateId: templateId || null,
          reminderType,
          title,
          description: description || null,
          scheduledFor: new Date(scheduledFor),
          channel,
          recurrence: recurrence || null,
          status: "scheduled",
          createdBy: req.session.userId,
        })
        .returning();

      res.status(201).json(newReminder[0]);
    } catch (error: any) {
      console.error("Error creating reminder:", error);
      res.status(500).json({ message: "Error al crear recordatorio" });
    }
  });

  // Update reminder (reschedule/snooze)
  router.patch("/reminders/:reminderId", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).send("Unauthorized");
      }

      const { reminderId } = req.params;
      const updates = req.body;

      const updatedReminder = await db!
        .update(scheduledReminders)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(scheduledReminders.id, reminderId))
        .returning();

      if (updatedReminder.length === 0) {
        return res.status(404).json({ message: "Recordatorio no encontrado" });
      }

      res.json(updatedReminder[0]);
    } catch (error: any) {
      console.error("Error updating reminder:", error);
      res.status(500).json({ message: "Error al actualizar recordatorio" });
    }
  });

  // Snooze reminder (reschedule +1 day)
  router.post("/reminders/:reminderId/snooze", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).send("Unauthorized");
      }

      const { reminderId } = req.params;
      const { days = 1 } = req.body;

      const reminder = await db!
        .select()
        .from(scheduledReminders)
        .where(eq(scheduledReminders.id, reminderId))
        .limit(1);

      if (reminder.length === 0) {
        return res.status(404).json({ message: "Recordatorio no encontrado" });
      }

      const currentScheduledFor = new Date(reminder[0].scheduledFor);
      const newScheduledFor = new Date(
        currentScheduledFor.getTime() + days * 24 * 60 * 60 * 1000
      );

      const updatedReminder = await db!
        .update(scheduledReminders)
        .set({
          scheduledFor: newScheduledFor,
          updatedAt: new Date(),
        })
        .where(eq(scheduledReminders.id, reminderId))
        .returning();

      res.json(updatedReminder[0]);
    } catch (error: any) {
      console.error("Error snoozing reminder:", error);
      res.status(500).json({ message: "Error al posponer recordatorio" });
    }
  });

  // Mark reminder as completed
  router.post("/reminders/:reminderId/complete", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).send("Unauthorized");
      }

      const { reminderId } = req.params;

      const updatedReminder = await db!
        .update(scheduledReminders)
        .set({
          status: "sent",
          sentAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(scheduledReminders.id, reminderId))
        .returning();

      if (updatedReminder.length === 0) {
        return res.status(404).json({ message: "Recordatorio no encontrado" });
      }

      res.json(updatedReminder[0]);
    } catch (error: any) {
      console.error("Error completing reminder:", error);
      res.status(500).json({ message: "Error al completar recordatorio" });
    }
  });

  // Cancel reminder
  router.delete("/reminders/:reminderId", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).send("Unauthorized");
      }

      const { reminderId } = req.params;

      const updatedReminder = await db!
        .update(scheduledReminders)
        .set({
          status: "cancelled",
          updatedAt: new Date(),
        })
        .where(eq(scheduledReminders.id, reminderId))
        .returning();

      if (updatedReminder.length === 0) {
        return res.status(404).json({ message: "Recordatorio no encontrado" });
      }

      res.json(updatedReminder[0]);
    } catch (error: any) {
      console.error("Error cancelling reminder:", error);
      res.status(500).json({ message: "Error al cancelar recordatorio" });
    }
  });

  // Get reminder count for badge (upcoming in next 7 days)
  router.get("/cases/:caseId/reminders/count", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).send("Unauthorized");
      }

      const { caseId } = req.params;
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const count = await db!
        .select({ count: sql<number>`count(*)` })
        .from(scheduledReminders)
        .where(
          and(
            eq(scheduledReminders.caseId, caseId),
            eq(scheduledReminders.status, "scheduled"),
            gte(scheduledReminders.scheduledFor, now),
            lte(scheduledReminders.scheduledFor, nextWeek)
          )
        );

      res.json({ count: Number(count[0].count) });
    } catch (error: any) {
      console.error("Error counting reminders:", error);
      res.status(500).json({ message: "Error al contar recordatorios" });
    }
  });
}

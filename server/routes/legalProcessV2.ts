import { Router, Response } from "express";
import { RequestWithSession } from "../types/express-session";
import { db } from "../db";
import { legalProcessV2 } from "../../shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Obtener proceso legal v2 de un cliente
router.get("/:clientId", async (req: RequestWithSession, res: Response) => {
  try {
    const clientId = req.params.clientId; // UUID, no parseInt
    
    if (!db) {
      return res.status(500).json({ message: "Database not connected" });
    }

    const [process] = await db
      .select()
      .from(legalProcessV2)
      .where(eq(legalProcessV2.clientId, clientId))
      .limit(1);

    if (!process) {
      return res.status(404).json({ message: "Proceso no encontrado" });
    }

    res.json(process);
  } catch (error: any) {
    console.error("Error obteniendo proceso legal:", error);
    res.status(500).json({ message: error.message });
  }
});

// Guardar/actualizar proceso legal v2
router.post("/:clientId", async (req: RequestWithSession, res: Response) => {
  try {
    const clientId = req.params.clientId; // UUID, no parseInt
    const processData = req.body;

    if (!db) {
      return res.status(500).json({ message: "Database not connected" });
    }

    // Verificar si existe
    const [existing] = await db
      .select()
      .from(legalProcessV2)
      .where(eq(legalProcessV2.clientId, clientId))
      .limit(1);

    if (existing) {
      // Actualizar
      const [updated] = await db
        .update(legalProcessV2)
        .set({
          data: processData,
          updatedAt: new Date(),
        })
        .where(eq(legalProcessV2.clientId, clientId))
        .returning();

      return res.json(updated);
    } else {
      // Crear
      const [created] = await db
        .insert(legalProcessV2)
        .values({
          clientId: clientId,
          data: processData,
        })
        .returning();

      return res.json(created);
    }
  } catch (error: any) {
    console.error("Error guardando proceso legal:", error);
    res.status(500).json({ message: error.message });
  }
});

// Agregar interviniente
router.post("/:clientId/participants", async (req: RequestWithSession, res: Response) => {
  try {
    const clientId = req.params.clientId; // UUID, no parseInt
    const participant = req.body;

    if (!db) {
      return res.status(500).json({ message: "Database not connected" });
    }

    const [process] = await db
      .select()
      .from(legalProcessV2)
      .where(eq(legalProcessV2.clientId, clientId))
      .limit(1);

    if (!process) {
      return res.status(404).json({ message: "Proceso no encontrado" });
    }

    const data = process.data as any;
    data.intervinientes.participants.push(participant);

    const [updated] = await db
      .update(legalProcessV2)
      .set({
        data,
        updatedAt: new Date(),
      })
      .where(eq(legalProcessV2.clientId, clientId))
      .returning();

    res.json(updated);
  } catch (error: any) {
    console.error("Error agregando interviniente:", error);
    res.status(500).json({ message: error.message });
  }
});

// Agregar hito
router.post("/:clientId/milestones", async (req: RequestWithSession, res: Response) => {
  try {
    const clientId = req.params.clientId; // UUID, no parseInt
    const milestone = req.body;

    if (!db) {
      return res.status(500).json({ message: "Database not connected" });
    }

    const [process] = await db
      .select()
      .from(legalProcessV2)
      .where(eq(legalProcessV2.clientId, clientId))
      .limit(1);

    if (!process) {
      return res.status(404).json({ message: "Proceso no encontrado" });
    }

    const data = process.data as any;
    data.hitos.milestones.push(milestone);

    const [updated] = await db
      .update(legalProcessV2)
      .set({
        data,
        updatedAt: new Date(),
      })
      .where(eq(legalProcessV2.clientId, clientId))
      .returning();

    res.json(updated);
  } catch (error: any) {
    console.error("Error agregando hito:", error);
    res.status(500).json({ message: error.message });
  }
});

// Agregar pago
router.post("/:clientId/payments", async (req: RequestWithSession, res: Response) => {
  try {
    const clientId = req.params.clientId; // UUID, no parseInt
    const payment = req.body;

    if (!db) {
      return res.status(500).json({ message: "Database not connected" });
    }

    const [process] = await db
      .select()
      .from(legalProcessV2)
      .where(eq(legalProcessV2.clientId, clientId))
      .limit(1);

    if (!process) {
      return res.status(404).json({ message: "Proceso no encontrado" });
    }

    const data = process.data as any;
    data.financiero.payments.push(payment);

    const [updated] = await db
      .update(legalProcessV2)
      .set({
        data,
        updatedAt: new Date(),
      })
      .where(eq(legalProcessV2.clientId, clientId))
      .returning();

    res.json(updated);
  } catch (error: any) {
    console.error("Error agregando pago:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;

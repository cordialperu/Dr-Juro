import { Router, Response } from "express";
import { RequestWithSession } from "../types/express-session";
import { legalProcessV2, clients } from "../../shared/schema";
import { eq } from "drizzle-orm";
import * as dbModule from "../db";

const router = Router();

// Obtener proceso legal v2 de un cliente
router.get("/:clientId", async (req: RequestWithSession, res: Response) => {
  try {
    const clientId = req.params.clientId;
    const db = dbModule.db;
    
    if (!db) {
      console.error("Legal Process GET: db is null, DATABASE_URL exists:", !!process.env.DATABASE_URL);
      return res.status(500).json({ message: "Database not connected" });
    }

    // Primero verificamos que el cliente existe
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    if (!client) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    const [legalProcess] = await db
      .select()
      .from(legalProcessV2)
      .where(eq(legalProcessV2.clientId, clientId))
      .limit(1);

    if (!legalProcess) {
      // Return empty process instead of 404 - the client exists but has no process yet
      return res.json({ 
        id: null,
        clientId: clientId, 
        data: {
          caso: {},
          intervinientes: { participants: [] },
          hitos: { milestones: [] },
          financiero: { honorarios: 0, pagado: 0, pendiente: 0, payments: [] },
          documentos: { folders: [] },
          notas: { items: [] }
        },
        createdAt: null,
        updatedAt: null
      });
    }

    res.json(legalProcess);
  } catch (error: any) {
    console.error("Error obteniendo proceso legal:", error);
    res.status(500).json({ message: error.message });
  }
});

// Guardar/actualizar proceso legal v2
router.post("/:clientId", async (req: RequestWithSession, res: Response) => {
  try {
    const clientId = req.params.clientId;
    const processData = req.body;
    const db = dbModule.db;

    if (!db) {
      console.error("Legal Process POST: db is null, DATABASE_URL exists:", !!process.env.DATABASE_URL);
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
    const clientId = req.params.clientId;
    const participant = req.body;
    const db = dbModule.db;

    if (!db) {
      return res.status(500).json({ message: "Database not connected" });
    }

    const [existingProcess] = await db
      .select()
      .from(legalProcessV2)
      .where(eq(legalProcessV2.clientId, clientId))
      .limit(1);

    if (!existingProcess) {
      return res.status(404).json({ message: "Proceso no encontrado" });
    }

    const data = existingProcess.data as any;
    if (!data.intervinientes) data.intervinientes = { participants: [] };
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
    const clientId = req.params.clientId;
    const milestone = req.body;
    const db = dbModule.db;

    if (!db) {
      return res.status(500).json({ message: "Database not connected" });
    }

    const [existingProcess] = await db
      .select()
      .from(legalProcessV2)
      .where(eq(legalProcessV2.clientId, clientId))
      .limit(1);

    if (!existingProcess) {
      return res.status(404).json({ message: "Proceso no encontrado" });
    }

    const data = existingProcess.data as any;
    if (!data.hitos) data.hitos = { milestones: [] };
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
    const clientId = req.params.clientId;
    const payment = req.body;
    const db = dbModule.db;

    if (!db) {
      return res.status(500).json({ message: "Database not connected" });
    }

    const [existingProcess] = await db
      .select()
      .from(legalProcessV2)
      .where(eq(legalProcessV2.clientId, clientId))
      .limit(1);

    if (!existingProcess) {
      return res.status(404).json({ message: "Proceso no encontrado" });
    }

    const data = existingProcess.data as any;
    if (!data.financiero) data.financiero = { honorarios: 0, pagado: 0, pendiente: 0, payments: [] };
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

import { Router, Response } from "express";
import { RequestWithSession } from "../types/express-session";
import { legalProcessV2, clients } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { storage } from "../storage";
import { randomUUID } from "crypto";

const router = Router();

// In-memory store for legal processes when DB is not available
const legalProcessStore = new Map<string, {
  id: string;
  clientId: string;
  data: any;
  createdAt: Date;
  updatedAt: Date;
}>();

// Helper to get empty legal process structure
function getEmptyLegalProcess(clientId: string) {
  return { 
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
  };
}

// Obtener proceso legal v2 de un cliente
router.get("/:clientId", async (req: RequestWithSession, res: Response) => {
  try {
    const clientId = req.params.clientId;
    const db = getDb();
    
    // Check if client exists first (in memory or DB)
    let clientExists = false;
    if (db) {
      const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, clientId))
        .limit(1);
      clientExists = !!client;
    } else {
      // Check in memory storage
      const allClients = await storage.getClients();
      clientExists = allClients.some(c => c.id === clientId);
    }

    if (!clientExists) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    // Try to get legal process from DB or memory
    if (db) {
      const [legalProcess] = await db
        .select()
        .from(legalProcessV2)
        .where(eq(legalProcessV2.clientId, clientId))
        .limit(1);

      if (!legalProcess) {
        return res.json(getEmptyLegalProcess(clientId));
      }
      return res.json(legalProcess);
    } else {
      // Use in-memory store
      const process = legalProcessStore.get(clientId);
      if (!process) {
        return res.json(getEmptyLegalProcess(clientId));
      }
      return res.json(process);
    }
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
    const db = getDb();

    if (db) {
      // Verificar si existe
      const [existing] = await db
        .select()
        .from(legalProcessV2)
        .where(eq(legalProcessV2.clientId, clientId))
        .limit(1);

      if (existing) {
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
        const [created] = await db
          .insert(legalProcessV2)
          .values({
            clientId: clientId,
            data: processData,
          })
          .returning();

        return res.json(created);
      }
    } else {
      // Use in-memory store
      const existing = legalProcessStore.get(clientId);
      const now = new Date();
      
      if (existing) {
        existing.data = processData;
        existing.updatedAt = now;
        return res.json(existing);
      } else {
        const newProcess = {
          id: randomUUID(),
          clientId,
          data: processData,
          createdAt: now,
          updatedAt: now
        };
        legalProcessStore.set(clientId, newProcess);
        return res.json(newProcess);
      }
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
    const db = getDb();

    if (db) {
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

      return res.json(updated);
    } else {
      // Use in-memory store
      let process = legalProcessStore.get(clientId);
      if (!process) {
        process = {
          id: randomUUID(),
          clientId,
          data: { intervinientes: { participants: [] } },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        legalProcessStore.set(clientId, process);
      }
      
      if (!process.data.intervinientes) process.data.intervinientes = { participants: [] };
      process.data.intervinientes.participants.push(participant);
      process.updatedAt = new Date();
      
      return res.json(process);
    }
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
    const db = getDb();

    if (db) {
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

      return res.json(updated);
    } else {
      // Use in-memory store
      let process = legalProcessStore.get(clientId);
      if (!process) {
        process = {
          id: randomUUID(),
          clientId,
          data: { hitos: { milestones: [] } },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        legalProcessStore.set(clientId, process);
      }
      
      if (!process.data.hitos) process.data.hitos = { milestones: [] };
      process.data.hitos.milestones.push(milestone);
      process.updatedAt = new Date();
      
      return res.json(process);
    }
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
    const db = getDb();

    if (db) {
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

      return res.json(updated);
    } else {
      // Use in-memory store
      let process = legalProcessStore.get(clientId);
      if (!process) {
        process = {
          id: randomUUID(),
          clientId,
          data: { financiero: { honorarios: 0, pagado: 0, pendiente: 0, payments: [] } },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        legalProcessStore.set(clientId, process);
      }
      
      if (!process.data.financiero) process.data.financiero = { honorarios: 0, pagado: 0, pendiente: 0, payments: [] };
      process.data.financiero.payments.push(payment);
      process.updatedAt = new Date();
      
      return res.json(process);
    }
  } catch (error: any) {
    console.error("Error agregando pago:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;

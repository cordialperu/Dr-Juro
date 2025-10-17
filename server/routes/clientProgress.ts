import type { Router } from "express";
import { asyncHandler } from "../lib/http";
import { db } from "../db";
import { caseProcessState } from "@shared/schema";
import { eq } from "drizzle-orm";
import { storage } from "../storage";

export function registerClientProgressRoutes(router: Router) {
  // Obtener el progreso de un cliente específico
  router.get(
    "/clients/:clientId/progress",
    asyncHandler(async (req, res) => {
      const { clientId } = req.params;

      try {
        if (!db) {
          const process = await storage.getCaseProcessState(clientId);
          const response = buildProgressPayload(process);
          res.json(response);
          return;
        }

        try {
          const processState = await db
            .select()
            .from(caseProcessState)
            .where(eq(caseProcessState.caseId, clientId))
            .limit(1);

          const process = processState?.[0];
          const response = buildProgressPayload(process);
          res.json(response);
          return;
        } catch (error) {
          console.error(
            "Error consultando progreso de cliente en base de datos. Usando almacenamiento en memoria",
            error,
          );
          const process = await storage.getCaseProcessState(clientId);
          const response = buildProgressPayload(process);
          res.json(response);
          return;
        }
      } catch (error) {
        console.error("Error al obtener progreso del cliente:", error);
        res.json(defaultProgressPayload());
      }
    })
  );

  // Obtener el progreso de todos los clientes (bulk)
  router.get(
    "/clients/progress/all",
    asyncHandler(async (req, res) => {
      try {
        const progressMap: Record<string, any> = {};

        if (!db) {
          const allProcesses = await storage.getAllCaseProcessStates();

          for (const process of allProcesses) {
            progressMap[process.caseId] = buildProgressPayload(process);
          }

          res.json(progressMap);
          return;
        }

        try {
          const allProcesses = await db.select().from(caseProcessState);

          for (const process of allProcesses) {
            progressMap[process.caseId] = buildProgressPayload(process);
          }

          res.json(progressMap);
          return;
        } catch (error) {
          console.error(
            "Error consultando progreso en base de datos. Usando almacenamiento en memoria",
            error,
          );

          const allProcesses = await storage.getAllCaseProcessStates();

          for (const process of allProcesses) {
            progressMap[process.caseId] = buildProgressPayload(process);
          }

          res.json(progressMap);
          return;
        }
      } catch (error) {
        console.error("Error al obtener progreso de clientes:", error);
        res.json({});
      }
    })
  );
}

function defaultProgressPayload() {
  return {
    percentage: 0,
    phase: "registered",
    label: "Sin proceso iniciado",
  };
}

function buildProgressPayload(process?: {
  completionPercentage?: string | number | null;
  currentPhase?: string | null;
  clientInfo?: unknown;
} | null) {
  if (!process) {
    return defaultProgressPayload();
  }

  const percentage = Number(process.completionPercentage ?? 0) || 0;
  const phase = process.currentPhase ?? "registered";

  let label = "Sin proceso iniciado";
  if (phase === "client-info") {
    label = "Registrando cliente";
  } else if (phase === "investigation") {
    label = "En investigación";
  } else if (phase === "strategy") {
    label = "Armando estrategia";
  } else if (phase === "meeting") {
    label = "Programando reunión";
  } else if (phase === "followup") {
    label = "En seguimiento";
  } else if (phase === "completed") {
    label = "Proceso completado";
  }

  return {
    percentage,
    phase,
    label,
    clientInfo: process.clientInfo,
  };
}

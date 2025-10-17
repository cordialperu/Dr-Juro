import type { Router } from "express";
import { asyncHandler, HttpError } from "../lib/http";
import { storage } from "../storage";

function normalizePayload(input: unknown): Record<string, string> {
  if (!input || typeof input !== "object") {
    return {};
  }

  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (value === undefined || value === null) {
      continue;
    }
    result[key] = String(value);
  }
  return result;
}

export function registerClientPhaseRoutes(router: Router) {
  router.get(
    "/clients/:clientId/phases/:phase",
    asyncHandler(async (req, res) => {
      const { clientId, phase } = req.params;

      const stored = await storage.getClientPhaseState(clientId, phase);

      res.json({
        data: stored?.data ?? {},
        updatedAt: stored?.updatedAt ?? null,
      });
    }),
  );

  router.post(
    "/clients/:clientId/phases/:phase",
    asyncHandler(async (req, res) => {
      const { clientId, phase } = req.params;
      const { data } = req.body ?? {};

      if (!data || typeof data !== "object") {
        throw new HttpError(400, "Datos de fase inválidos");
      }

      const normalized = normalizePayload(data);
      const saved = await storage.saveClientPhaseState(clientId, phase, normalized);

      res.json({
        data: saved.data,
        updatedAt: saved.updatedAt,
      });
    }),
  );
}

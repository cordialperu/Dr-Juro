import type { Router } from "express";
import { z } from "zod";
import { asyncHandler, HttpError } from "../lib/http";
import { askGeminiAboutJurisprudence } from "../services/gemini";

const RequestSchema = z.object({
  query: z.string().min(1, "Debes ingresar un término de búsqueda."),
});

export function registerGeminiRoutes(router: Router) {
  router.post(
    "/jurisprudence/search",
    asyncHandler(async (req, res) => {
      if (!req.is("application/json")) {
        throw new HttpError(415, "El cuerpo de la solicitud debe ser JSON.");
      }

      if (!req.body) {
        throw new HttpError(400, "Cuerpo de solicitud vacío.");
      }

      const parsed = RequestSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        throw new HttpError(400, parsed.error.errors[0]?.message ?? "Solicitud inválida.");
      }

      const result = await askGeminiAboutJurisprudence(parsed.data.query);
      res.json(result);
    }),
  );
}

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

  // Nueva ruta POST para análisis de documentos
  router.post(
    "/gemini/analyze",
    asyncHandler(async (req, res) => {
      const { documentId, analysisType, clientId } = req.body;

      if (!documentId || typeof documentId !== "string") {
        throw new HttpError(400, "Debes proporcionar un ID de documento.");
      }

      if (!analysisType || typeof analysisType !== "string") {
        throw new HttpError(400, "Debes proporcionar un tipo de análisis.");
      }

      // Por ahora retornamos resultados mock
      // TODO: Implementar análisis real con Gemini API
      let mockAnalysis = "";
      
      switch (analysisType) {
        case 'summary':
          mockAnalysis = "## Resumen Ejecutivo\n\nEste documento contiene información relevante sobre el caso legal. Los puntos clave incluyen...";
          break;
        case 'extract':
          mockAnalysis = "## Información Extraída\n\n- **Fecha:** 15/05/2023\n- **Partes:** Juan Pérez vs Estado\n- **Tipo:** Demanda civil\n- **Monto:** S/ 50,000";
          break;
        case 'clauses':
          mockAnalysis = "## Análisis de Cláusulas\n\n**Cláusula 1:** Obligaciones del demandante...\n**Cláusula 2:** Derechos del demandado...";
          break;
        case 'compare':
          mockAnalysis = "## Comparación de Documentos\n\n**Similitudes:** Ambos documentos mencionan...\n**Diferencias:** El primer documento establece...";
          break;
        default:
          mockAnalysis = "Análisis no especificado.";
      }

      res.json({ 
        analysis: mockAnalysis,
        documentId,
        analysisType,
        timestamp: new Date().toISOString()
      });
    }),
  );
}

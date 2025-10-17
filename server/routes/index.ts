import { Router } from "express";
import { registerClientRoutes } from "./clients";
import { registerCaseRoutes } from "./cases";
import { registerAuthRoutes } from "./auth";
import { registerDoctrinaRoutes } from "./doctrinas";
import { registerMetaBuscadorRoutes } from "./metabuscador";
import { registerUnmsmRoutes } from "./unmsm";
import { registerPdfRoutes } from "./pdf";
import { registerTaskRoutes } from "./tasks";
import { registerGeminiRoutes } from "./gemini";
import { registerExtractTextRoutes } from "./extractText";
import { registerTranscribeRoutes } from "./transcribe";
import { registerProcessRoutes } from "./process";
import { registerClientProgressRoutes } from "./clientProgress";
import { registerClientPhaseRoutes } from "./clientPhases";
import documentsRouter from "./documents";

export function createApiRouter() {
  const router = Router();

  registerClientRoutes(router);
  registerCaseRoutes(router);
  registerAuthRoutes(router);
  registerDoctrinaRoutes(router);
  registerMetaBuscadorRoutes(router);
  registerUnmsmRoutes(router);
  registerPdfRoutes(router);
  registerTaskRoutes(router);
  registerGeminiRoutes(router);
  registerExtractTextRoutes(router);
  registerTranscribeRoutes(router);
  registerProcessRoutes(router);
  registerClientProgressRoutes(router);
  registerClientPhaseRoutes(router);
  
  // Rutas de documentos
  router.use(documentsRouter);

  return router;
}

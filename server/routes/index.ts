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
import { registerPdfRoutes as registerExportPdfRoutes } from "./exportPdf";
import { registerPdfExportRoutes } from "./pdf-export";
import { registerGlobalSearchRoutes } from "./global-search";
import { registerRemindersRoutes } from "./reminders";
import documentsRouter from "./documents";
import { registerNotesRoutes } from "./notes";
import { registerCaseActivityRoutes } from "./activity";
import legalProcessV2Router from "./legalProcessV2";
import chatRouter from "./chat";

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
  registerExportPdfRoutes(router);
  registerPdfExportRoutes(router);
  registerGlobalSearchRoutes(router);
  registerRemindersRoutes(router);
  registerNotesRoutes(router);
  registerCaseActivityRoutes(router);
  
  // Rutas de documentos
  router.use(documentsRouter);
  
  // Rutas de proceso legal v2
  router.use("/legal-process", legalProcessV2Router);

  // Chat contextual con IA
  router.use("/chat", chatRouter);

  return router;
}

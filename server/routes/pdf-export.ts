import type { Router } from "express";
import { generateCaseFullPdf } from "../services/pdfExport";

export function registerPdfExportRoutes(router: Router) {
  // Export case as full PDF
  router.get("/cases/:caseId/export/pdf", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).send("Unauthorized");
      }

      const { caseId } = req.params;
      const includeNotes = req.query.notes !== "false";
      const includeTimeline = req.query.timeline !== "false";
      const includeDocuments = req.query.documents !== "false";

      const pdfBuffer = await generateCaseFullPdf({
        caseId,
        includeNotes,
        includeTimeline,
        includeDocuments,
      });

      // Set headers for PDF download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="caso-${caseId}-${Date.now()}.pdf"`
      );
      res.setHeader("Content-Length", pdfBuffer.length);

      res.send(pdfBuffer);
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      res.status(500).json({
        message: "Error al generar el PDF",
        error: error.message,
      });
    }
  });
}

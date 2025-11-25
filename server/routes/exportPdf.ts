import type { Router } from "express";
import { db } from "../db";
import { cases, clients, caseProcessState, caseDocuments } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { asyncHandler, HttpError } from "../lib/http";
import { generateCasePDF } from "../services/pdfGenerator";

export function registerPdfRoutes(router: Router) {
  // Export case as PDF
  router.get(
    "/cases/:id/export-pdf",
    asyncHandler(async (req, res) => {
      const { id } = req.params;

      if (!req.session?.userId) {
        throw new HttpError(401, "No autenticado");
      }

      if (!db) {
        throw new HttpError(503, "Base de datos no disponible");
      }

      // Get case with client data
      const [caseData] = await db
        .select({
          id: cases.id,
          title: cases.title,
          description: cases.description,
          status: cases.status,
          createdAt: cases.createdAt,
          updatedAt: cases.updatedAt,
          client: clients,
        })
        .from(cases)
        .leftJoin(clients, eq(cases.clientId, clients.id))
        .where(and(eq(cases.id, id), eq(cases.userId, req.session.userId)))
        .limit(1);

      if (!caseData) {
        throw new HttpError(404, "Caso no encontrado");
      }

      // Get process state
      const [processState] = await db
        .select()
        .from(caseProcessState)
        .where(eq(caseProcessState.caseId, id))
        .limit(1);

      // Get documents
      const documents = await db
        .select()
        .from(caseDocuments)
        .where(eq(caseDocuments.caseId, id))
        .orderBy(caseDocuments.uploadDate);

      // Generate PDF
      const pdf = generateCasePDF({
        id: caseData.id,
        title: caseData.title,
        description: caseData.description ?? undefined,
        status: caseData.status,
        createdAt: caseData.createdAt,
        updatedAt: caseData.updatedAt,
        client: caseData.client,
        processState: processState ? {
          currentPhase: processState.currentPhase,
          completionPercentage: processState.completionPercentage,
        } : undefined,
        documents: documents.map(doc => ({
          filename: doc.filename,
          uploadDate: doc.uploadDate.toISOString(),
          category: doc.category,
        })),
      });

      const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

      // Set headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="caso-${caseData.title.replace(/[^a-z0-9]/gi, '_')}-${id}.pdf"`
      );
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);
    })
  );
}

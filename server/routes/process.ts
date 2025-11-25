import type { Router } from "express";
import { db } from "../db";
import { caseDocuments, caseProcessState, cases } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { asyncHandler, HttpError } from "../lib/http";
import { storage } from "../storage";
import { promises as fs } from "fs";
import path from "path";

// Helper para verificar db
function checkDb() {
  if (!db) {
    throw new HttpError(500, "Base de datos no disponible");
  }
  return db;
}

export function registerProcessRoutes(router: Router) {
  // Obtener estado del proceso de un caso
  router.get(
    "/cases/:caseId/process",
    asyncHandler(async (req, res) => {
      const { caseId } = req.params;

      if (db) {
        try {
          const database = checkDb();

          // Try to get process state from DB
          const [processState] = await database
            .select()
            .from(caseProcessState)
            .where(eq(caseProcessState.caseId, caseId))
            .limit(1);

          const documents = await database
            .select()
            .from(caseDocuments)
            .where(eq(caseDocuments.caseId, caseId))
            .orderBy(caseDocuments.uploadDate);

          res.json({
            processState: processState || null,
            documents,
          });
          return;
        } catch (error) {
          console.error("Error cargando proceso desde la base de datos. Usando almacenamiento en memoria", error);
        }
      }

      // Fallback to in-memory storage
      const processState = await storage.getCaseProcessState(caseId);
      const documents = await readDocumentsFromDisk(caseId);

      res.json({
        processState: processState ?? null,
        documents,
      });
    })
  );

  // Guardar/actualizar estado del proceso
  router.post(
    "/cases/:caseId/process",
    asyncHandler(async (req, res) => {
      const { caseId } = req.params;
      const {
        currentPhase,
        completionPercentage,
        clientInfo,
        investigationProgress,
        caseStrategy,
        clientMeeting,
        followUp,
      } = req.body;

      if (db) {
        try {
          const database = checkDb();

          const [existing] = await database
            .select()
            .from(caseProcessState)
            .where(eq(caseProcessState.caseId, caseId))
            .limit(1);

          let result;

          if (existing) {
            [result] = await database
              .update(caseProcessState)
              .set({
                currentPhase,
                completionPercentage: String(completionPercentage),
                clientInfo,
                investigationProgress,
                caseStrategy,
                clientMeeting,
                updatedAt: new Date(),
              })
              .where(eq(caseProcessState.caseId, caseId))
              .returning();
          } else {
            [result] = await database
              .insert(caseProcessState)
              .values({
                caseId,
                currentPhase,
                completionPercentage: String(completionPercentage),
                clientInfo,
                investigationProgress,
                caseStrategy,
                clientMeeting,
              })
              .returning();
          }

          res.json(result);
          return;
        } catch (error) {
          console.error("Error guardando proceso en base de datos. Usando almacenamiento en memoria", error);
        }
      }

      // Fallback to in-memory storage
      const saved = await storage.upsertCaseProcessState({
        caseId,
        currentPhase,
        completionPercentage,
        clientInfo,
        investigationProgress,
        caseStrategy,
        clientMeeting,
        followUp,
      });

      res.json(saved);
    })
  );

  // Agregar documento al caso
  router.post(
    "/cases/:caseId/documents",
    asyncHandler(async (req, res) => {
      const { caseId } = req.params;
      const { filename, fileType, category, content, notes } = req.body;

      if (!req.session?.userId) {
        throw new HttpError(401, "No autenticado");
      }

      const database = checkDb();

      // Verificar que el caso existe y pertenece al usuario
      const [caseRecord] = await database
        .select()
        .from(cases)
        .where(and(eq(cases.id, caseId), eq(cases.userId, req.session.userId)))
        .limit(1);

      if (!caseRecord) {
        throw new HttpError(404, "Caso no encontrado");
      }

      const [document] = await database
        .insert(caseDocuments)
        .values({
          caseId,
          filename,
          fileType,
          category,
          content,
          notes: notes || "",
        })
        .returning();

      res.status(201).json(document);
    })
  );

  // Actualizar notas de un documento
  router.patch(
    "/cases/:caseId/documents/:documentId",
    asyncHandler(async (req, res) => {
      const { caseId, documentId } = req.params;
      const { notes } = req.body;

      if (!req.session?.userId) {
        throw new HttpError(401, "No autenticado");
      }

      const database = checkDb();

      // Verificar que el caso existe y pertenece al usuario
      const [caseRecord] = await database
        .select()
        .from(cases)
        .where(and(eq(cases.id, caseId), eq(cases.userId, req.session.userId)))
        .limit(1);

      if (!caseRecord) {
        throw new HttpError(404, "Caso no encontrado");
      }

      // Actualizar notas del documento
      const [updated] = await database
        .update(caseDocuments)
        .set({ notes })
        .where(
          and(
            eq(caseDocuments.id, documentId),
            eq(caseDocuments.caseId, caseId)
          )
        )
        .returning();

      if (!updated) {
        throw new HttpError(404, "Documento no encontrado");
      }

      res.json(updated);
    })
  );

  // Eliminar documento
  router.delete(
    "/cases/:caseId/documents/:documentId",
    asyncHandler(async (req, res) => {
      const { caseId, documentId } = req.params;

      if (!req.session?.userId) {
        throw new HttpError(401, "No autenticado");
      }

      const database = checkDb();

      // Verificar que el caso existe y pertenece al usuario
      const [caseRecord] = await database
        .select()
        .from(cases)
        .where(and(eq(cases.id, caseId), eq(cases.userId, req.session.userId)))
        .limit(1);

      if (!caseRecord) {
        throw new HttpError(404, "Caso no encontrado");
      }

      await database
        .delete(caseDocuments)
        .where(
          and(
            eq(caseDocuments.id, documentId),
            eq(caseDocuments.caseId, caseId)
          )
        );

      res.json({ message: "Documento eliminado" });
    })
  );

  // Obtener documentos de un caso
  router.get(
    "/cases/:caseId/documents",
    asyncHandler(async (req, res) => {
      const { caseId } = req.params;

      if (!req.session?.userId) {
        throw new HttpError(401, "No autenticado");
      }

      const database = checkDb();

      // Verificar que el caso existe y pertenece al usuario
      const [caseRecord] = await database
        .select()
        .from(cases)
        .where(and(eq(cases.id, caseId), eq(cases.userId, req.session.userId)))
        .limit(1);

      if (!caseRecord) {
        throw new HttpError(404, "Caso no encontrado");
      }

      const documents = await database
        .select()
        .from(caseDocuments)
        .where(eq(caseDocuments.caseId, caseId))
        .orderBy(caseDocuments.uploadDate);

      res.json(documents);
    })
  );
}

const STORAGE_BASE = path.join(process.cwd(), "storage");

async function readDocumentsFromDisk(caseId: string) {
  try {
    const documents: Array<Record<string, unknown>> = [];
    const clientsPath = path.join(STORAGE_BASE, "clients");

    const clientFolders = await fs.readdir(clientsPath);

    for (const clientId of clientFolders) {
      const clientPath = path.join(clientsPath, clientId);
      const stats = await fs.stat(clientPath);
      if (!stats.isDirectory()) continue;

      const phases = await fs.readdir(clientPath);

      for (const phase of phases) {
        const phasePath = path.join(clientPath, phase);
        const phaseStats = await fs.stat(phasePath);
        if (!phaseStats.isDirectory()) continue;

        const folders = await fs.readdir(phasePath);

        for (const folder of folders) {
          const metadataPath = path.join(phasePath, folder, "documents.json");
          try {
            const payload = await fs.readFile(metadataPath, "utf-8");
            const parsed = JSON.parse(payload) as Array<Record<string, unknown>>;
            parsed.forEach((doc) => {
              if (doc.caseId === caseId || doc.clientId === caseId) {
                documents.push(doc);
              }
            });
          } catch {
            // Folder without metadata, skip
          }
        }
      }
    }

    return documents;
  } catch (error) {
    console.error("Error leyendo documentos desde disco", error);
    return [];
  }
}

import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import { asyncHandler, HttpError } from "../lib/http";
import { searchPdf } from "../services/pdfSearch";

const PDF_DIRECTORY = path.resolve(process.cwd(), "pdfs");

const parseLimit = (value: unknown, fallback: number) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.max(1, Math.min(parsed, 50));
};

export function registerPdfRoutes(router: Router) {
  router.get(
    "/pdf/files",
    asyncHandler(async (_req, res) => {
      try {
        const entries = await fs.readdir(PDF_DIRECTORY, { withFileTypes: true });
        const files = await Promise.all(
          entries
            .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".pdf"))
            .map(async (entry) => {
              try {
                const filePath = path.join(PDF_DIRECTORY, entry.name);
                const stats = await fs.stat(filePath);
                return {
                  filename: entry.name,
                  size: stats.size,
                  modifiedAt: stats.mtime.toISOString(),
                };
              } catch {
                return {
                  filename: entry.name,
                  size: 0,
                  modifiedAt: null,
                };
              }
            }),
        );

        res.json({ files });
      } catch (error) {
        console.error("Error listing PDF files", error);
        res.json({ files: [] });
      }
    }),
  );

  // Ruta GET legacy
  router.get(
    "/pdf-search",
    asyncHandler(async (req, res) => {
      const filename = typeof req.query.file === "string" ? req.query.file : undefined;
      const query = typeof req.query.query === "string" ? req.query.query : undefined;

      if (!filename) {
        throw new HttpError(400, "Debes proporcionar el parámetro `file`.");
      }

      if (!query || query.trim().length === 0) {
        throw new HttpError(400, "Debes proporcionar el parámetro `query`.");
      }

      const limit = parseLimit(req.query.limit, 10);

      const result = await searchPdf({
        filename,
        query,
        limit,
      });

      res.json(result);
    }),
  );

  // Nueva ruta POST para búsqueda semántica
  router.post(
    "/pdf/search",
    asyncHandler(async (req, res) => {
      const { query, clientId } = req.body;

      if (!query || typeof query !== "string" || query.trim().length === 0) {
        throw new HttpError(400, "Debes proporcionar un término de búsqueda.");
      }

      // Por ahora retornamos resultados mock
      // TODO: Implementar búsqueda real en PDFs del cliente
      const mockResults = [
        {
          filename: "documento_caso_1.pdf",
          page: 5,
          excerpt: `Fragmento que contiene "${query}"... contexto relevante del documento.`,
          score: 0.95
        },
        {
          filename: "evidencia_legal.pdf",
          page: 12,
          excerpt: `Otro fragmento relacionado con "${query}"... información adicional del caso.`,
          score: 0.87
        }
      ];

      res.json({ results: mockResults, query, clientId });
    }),
  );
}

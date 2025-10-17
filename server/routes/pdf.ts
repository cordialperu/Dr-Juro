import { Router } from "express";
import { asyncHandler, HttpError } from "../lib/http";
import { searchPdf } from "../services/pdfSearch";

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
}

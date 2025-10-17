import { Router } from "express";
import { asyncHandler, HttpError } from "../lib/http";
import { searchUnmsm } from "../services/unmsm";

const parseNumericQuery = (value: unknown, fallback: number, options?: { min?: number; max?: number }) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  const min = options?.min ?? Number.MIN_SAFE_INTEGER;
  const max = options?.max ?? Number.MAX_SAFE_INTEGER;
  return Math.min(Math.max(parsed, min), max);
};

export function registerUnmsmRoutes(router: Router) {
  router.get(
    "/search/unmsm",
    asyncHandler(async (req, res) => {
      const queryParam =
        typeof req.query.query === "string"
          ? req.query.query
          : typeof req.query.q === "string"
            ? req.query.q
            : undefined;

      if (!queryParam || queryParam.trim().length === 0) {
        throw new HttpError(400, "Debes proporcionar el parámetro de búsqueda `query`.");
      }

      const page = parseNumericQuery(req.query.page, 0, { min: 0 });
      const size = parseNumericQuery(req.query.size, 10, { min: 1, max: 50 });
      const sort = typeof req.query.sort === "string" ? req.query.sort : undefined;

      const response = await searchUnmsm({
        query: queryParam,
        page,
        size,
        sort,
      });

      res.json(response);
    }),
  );
}

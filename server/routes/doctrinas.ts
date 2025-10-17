import type { Router } from "express";
import { ZodError } from "zod";
import { asyncHandler, HttpError, formatZodError } from "../lib/http";
import { db } from "../db";
import { doctrinas, insertDoctrinaSchema, type Doctrina } from "@shared/schema";
import { storage } from "../storage";

const removeDiacritics = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const normalize = (value: string) => removeDiacritics(value).toLowerCase();

const tokenize = (value: string | undefined | null): string[] => {
  if (!value) {
    return [];
  }
  return normalize(value)
    .split(/[^a-z0-9áéíóúñ]+/i)
    .map((token) => token.trim())
    .filter(Boolean);
};

const buildSearchKeywords = (input: {
  caseTitle?: string;
  caseDescription?: string;
  search?: string;
  keywords?: string;
}): Set<string> => {
  const keywords = new Set<string>();
  const pushTokens = (value?: string) => {
    tokenize(value).forEach((token) => keywords.add(token));
  };

  pushTokens(input.caseTitle);
  pushTokens(input.caseDescription);
  pushTokens(input.search);
  if (input.keywords) {
    input.keywords
      .split(",")
      .map((kw) => kw.trim())
      .forEach((kw) => pushTokens(kw));
  }

  return keywords;
};

const extractDoctrinaTokens = (record: Doctrina): Set<string> => {
  const tokens = new Set<string>();
  const pushTokens = (value?: string | null) => {
    tokenize(value ?? undefined).forEach((token) => tokens.add(token));
  };

  pushTokens(record.autor ?? undefined);
  pushTokens(record.obra ?? undefined);
  pushTokens(record.extracto ?? undefined);
  if (Array.isArray(record.palabras_clave)) {
    for (const keyword of record.palabras_clave) {
      if (typeof keyword === "string") {
        pushTokens(keyword);
      }
    }
  }

  return tokens;
};

const filterDoctrinasByKeywords = (records: Doctrina[], keywords: Set<string>) => {
  if (keywords.size === 0) {
    return records;
  }

  return records.filter((record) => {
    const recordTokens = extractDoctrinaTokens(record);
    for (const keyword of Array.from(keywords)) {
      if (recordTokens.has(keyword)) {
        return true;
      }
    }
    return false;
  });
};

export function registerDoctrinaRoutes(router: Router) {
  router.get(
    "/doctrinas",
    asyncHandler(async (req, res) => {
      const caseTitle = typeof req.query.caseTitle === "string" ? req.query.caseTitle : undefined;
      const caseDescription =
        typeof req.query.caseDescription === "string" ? req.query.caseDescription : undefined;
      const search = typeof req.query.search === "string" ? req.query.search : undefined;
      const keywordsParam = typeof req.query.keywords === "string" ? req.query.keywords : undefined;

      const keywordSet = buildSearchKeywords({ caseTitle, caseDescription, search, keywords: keywordsParam });

      const records = db ? await db.select().from(doctrinas) : await storage.getDoctrinas();

      const sanitized = records.map((record) => ({
        ...record,
        palabras_clave: Array.isArray(record.palabras_clave) ? record.palabras_clave : [],
      }));

      const filtered = filterDoctrinasByKeywords(sanitized, keywordSet);
      res.json(filtered);
    }),
  );

  router.post(
    "/doctrinas",
    asyncHandler(async (req, res) => {
      try {
        const validated = insertDoctrinaSchema.parse(req.body);
        if (!db) {
          const created = await storage.createDoctrina(validated);
          res.status(201).json(created);
          return;
        }

        const [created] = await db.insert(doctrinas).values(validated).returning();
        res.status(201).json(created);
      } catch (error) {
        if (error instanceof ZodError) {
          throw new HttpError(400, `Datos inválidos: ${formatZodError(error)}`);
        }
        throw error;
      }
    }),
  );
}

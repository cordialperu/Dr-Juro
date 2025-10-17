import fs from "fs/promises";
import path from "path";
import { HttpError } from "../lib/http";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const PDF_DIRECTORY = path.resolve(import.meta.dirname, "../../pdfs");

const pageCache = new Map<string, { pages: string[]; mtimeMs: number }>();

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

const ensureWithinPdfDirectory = (filePath: string) => {
  const relative = path.relative(PDF_DIRECTORY, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new HttpError(400, "El archivo solicitado no es válido.");
  }
};

async function loadPdfPages(filename: string) {
  const absolute = path.resolve(PDF_DIRECTORY, filename);
  ensureWithinPdfDirectory(absolute);

  let stats;
  try {
    stats = await fs.stat(absolute);
  } catch {
    throw new HttpError(404, "No se encontró el PDF solicitado.");
  }

  const cached = pageCache.get(absolute);
  if (cached && cached.mtimeMs === stats.mtimeMs) {
    return cached.pages;
  }

  const buffer = await fs.readFile(absolute);
  const pages: string[] = [];

  try {
    const data = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    
    // Extraer texto de todas las páginas
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str || "")
        .join(" ");
      
      const normalized = normalizeWhitespace(pageText);
      pages.push(normalized);
    }
  } catch (error) {
    console.error("Error al cargar PDF:", error);
    throw new HttpError(500, "No se pudo procesar el PDF.");
  }

  pageCache.set(absolute, { pages, mtimeMs: stats.mtimeMs });
  return pages;
}

const createPreview = (pageText: string, index: number, length: number) => {
  const radius = 120;
  const start = Math.max(0, index - radius);
  const end = Math.min(pageText.length, index + length + radius);

  let before = pageText.slice(start, index);
  let match = pageText.slice(index, index + length);
  let after = pageText.slice(index + length, end);

  before = before.trimStart();
  after = after.trimEnd();

  if (start > 0) {
    before = `… ${before}`;
  }
  if (end < pageText.length) {
    after = `${after} …`;
  }

  return { before, match, after };
};

export type PdfSearchMatch = {
  page: number;
  preview: {
    before: string;
    match: string;
    after: string;
  };
  url: string;
};

export type PdfSearchResult = {
  matches: PdfSearchMatch[];
  totalMatches: number;
  truncated: boolean;
};

export type PdfSearchOptions = {
  filename: string;
  query: string;
  limit?: number;
};

export async function searchPdf({ filename, query, limit = 10 }: PdfSearchOptions): Promise<PdfSearchResult> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    throw new HttpError(400, "Debes proporcionar un término de búsqueda válido.");
  }

  const pages = await loadPdfPages(filename);
  const normalizedQuery = normalizeWhitespace(trimmedQuery);
  const queryLower = normalizedQuery.toLowerCase();
  const maxResults = Math.max(1, Math.min(limit, 50));

  const matches: PdfSearchMatch[] = [];
  let totalMatches = 0;

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
    const page = pages[pageIndex];
    if (!page) {
      continue;
    }

    const lower = page.toLowerCase();
    let searchIndex = lower.indexOf(queryLower);

    while (searchIndex !== -1) {
      totalMatches += 1;

      if (matches.length < maxResults) {
        const preview = createPreview(page, searchIndex, normalizedQuery.length);
        matches.push({
          page: pageIndex + 1,
          preview,
          url: `/pdfs/${encodeURIComponent(filename)}#page=${pageIndex + 1}&search=${encodeURIComponent(trimmedQuery)}`,
        });
      }

      searchIndex = lower.indexOf(queryLower, searchIndex + queryLower.length);
    }
  }

  return {
    matches,
    totalMatches,
    truncated: totalMatches > matches.length,
  };
}

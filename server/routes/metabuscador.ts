import { Router } from "express";
import axios from "axios";
import { load } from "cheerio";
import { asyncHandler, HttpError } from "../lib/http";

const DEFAULT_SERVICE_URL = "http://localhost:8000";
const METABUSCADOR_SERVICE_URL = process.env.METABUSCADOR_SERVICE_URL ?? DEFAULT_SERVICE_URL;
const REQUEST_TIMEOUT = 20_000;
const MAX_RESULTS_PER_SOURCE = 10;

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const REQUEST_HEADERS = {
  "User-Agent": USER_AGENT,
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "es-PE,es;q=0.9,en;q=0.8",
};

const VALID_DOMAINS: Record<string, string[]> = {
  PUCP: ["tesis.pucp.edu.pe", "repositorio.pucp.edu.pe", "revistas.pucp.edu.pe"],
  UNMSM: ["cybertesis.unmsm.edu.pe"],
  "PJ/TC": ["pj.gob.pe", "tc.gob.pe"],
};

interface MetaBuscadorResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
}

export function registerMetaBuscadorRoutes(router: Router) {
  router.post(
    "/metabuscador/buscar",
    asyncHandler(async (req, res) => {
      const { termino } = req.body ?? {};

      if (typeof termino !== "string" || !termino.trim()) {
        throw new HttpError(400, "Debes proporcionar un término de búsqueda válido.");
      }

      const term = termino.trim();

      try {
        const response = await axios.post(
          `${METABUSCADOR_SERVICE_URL}/search`,
          { term },
          { timeout: REQUEST_TIMEOUT },
        );

        res.json(response.data);
        return;
      } catch (error) {
        console.error("Metabuscador proxy error", error instanceof Error ? error.message : error);

        if (process.env.METABUSCADOR_DISABLE_FALLBACK === "true") {
          throw new HttpError(502, "El servicio de metabuscador no está disponible en este momento.");
        }

        try {
          const results = await runFallbackMetaSearch(term);
          res.json({
            term,
            results,
            fallback: true,
          });
          return;
        } catch (fallbackError) {
          console.error("Metabuscador fallback error", fallbackError);
          throw new HttpError(502, "El servicio de metabuscador no está disponible en este momento.");
        }
      }
    }),
  );
}

function buildDomainFilter(domains: string[]): string {
  return domains.map((domain) => `site:${domain}`).join(" OR ");
}

async function fetchHtml(url: string) {
  const response = await axios.get<string>(url, {
    headers: REQUEST_HEADERS,
    timeout: REQUEST_TIMEOUT,
  });
  return response.data;
}

async function searchGoogleScholar(term: string, domains: string[], source: string): Promise<MetaBuscadorResult[]> {
  const query = `"${term}" ${buildDomainFilter(domains)}`;
  const url = `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`;
  const html = await fetchHtml(url);
  const $ = load(html);

  const results: MetaBuscadorResult[] = [];

  $(".gs_r.gs_or.gs_scl").each((_, element) => {
    if (results.length >= MAX_RESULTS_PER_SOURCE) return false;

    const titleAnchor = $(element).find(".gs_rt a");
    const link = titleAnchor.attr("href");
    const title = titleAnchor.text().trim();

    if (!link || !title) {
      return;
    }

    if (!domains.some((domain) => link.includes(domain))) {
      return;
    }

    const snippet = $(element).find(".gs_rs").text().trim();

    results.push({
      title: title || "Sin título",
      link,
      snippet: snippet || "Sin resumen disponible.",
      source,
    });
  });

  return results;
}

async function searchGoogleWeb(term: string, domains: string[], source: string): Promise<MetaBuscadorResult[]> {
  const query = `"${term}" ${buildDomainFilter(domains)}`;
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  const html = await fetchHtml(url);
  const $ = load(html);

  const results: MetaBuscadorResult[] = [];

  $("div.g").each((_, element) => {
    if (results.length >= MAX_RESULTS_PER_SOURCE) return false;

    const title = $(element).find("h3").text().trim();
    const anchor = $(element).find("a");
    const link = anchor.attr("href");

    if (!title || !link) {
      return;
    }

    if (!domains.some((domain) => link.includes(domain))) {
      return;
    }

    const snippet =
      $(element)
        .find(".VwiC3b, .st")
        .text()
        .trim() || "Resumen no disponible.";

    results.push({
      title,
      link,
      snippet,
      source,
    });
  });

  return results;
}

async function runFallbackMetaSearch(term: string): Promise<MetaBuscadorResult[]> {
  const [pucp, unmsm, pjtc] = await Promise.allSettled([
    searchGoogleScholar(term, VALID_DOMAINS.PUCP, "PUCP"),
    searchGoogleScholar(term, VALID_DOMAINS.UNMSM, "UNMSM"),
    searchGoogleWeb(term, VALID_DOMAINS["PJ/TC"], "PJ/TC"),
  ]);

  const collect = (result: PromiseSettledResult<MetaBuscadorResult[]>) =>
    result.status === "fulfilled" ? result.value : [];

  return [...collect(pucp), ...collect(unmsm), ...collect(pjtc)];
}

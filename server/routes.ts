import type { Express, NextFunction, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import OpenAI from "openai";
import { createApiRouter } from "./routes/index";
import { asyncHandler, HttpError } from "./lib/http";

interface AnalysisPrecedent {
  id: string;
  title: string;
  court: string;
  chamber: string;
  date: string;
  caseNumber: string;
  bindingLevel: "ejecutoria_vinculante" | "acuerdo_plenario" | "jurisprudencia_uniforme" | "relevante";
  summary: string;
  confidence: number;
  articlesMatched: string[];
  excerpt: string;
  officialLink?: string;
}

interface AnalysisResult {
  documentSummary: string;
  keyLegalConcepts: string[];
  legalAreas: string[];
  relevantArticles: string[];
  precedentsFound: AnalysisPrecedent[];
  recommendations: string[];
  risks: string[];
  confidence: number;
  note?: string;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const sanitizeText = (value: unknown): string =>
  typeof value === "string" ? value : "";

const truncate = (text: string, length: number): string =>
  text.length > length ? `${text.slice(0, length - 1)}…` : text;

const guessLegalAreas = (text: string): string[] => {
  const areas: string[] = [];
  const lower = text.toLowerCase();
  if (/(civil|indemnización|contrato)/.test(lower)) areas.push("Derecho Civil");
  if (/(penal|delito|fiscal)/.test(lower)) areas.push("Derecho Penal");
  if (/(laboral|trabajador|sindicato)/.test(lower)) areas.push("Derecho Laboral");
  if (/(administrativo|entidad pública|municipal)/.test(lower)) areas.push("Derecho Administrativo");
  if (/(constitucional|amparo|hábeas)/.test(lower)) areas.push("Derecho Constitucional");
  return areas.length > 0 ? areas : ["General"];
};

const buildFallbackAnalysis = (
  documentText: string,
  metadata: { filename?: string; mimetype?: string; size?: number },
  missingOpenAI: boolean,
  extraNote?: string,
): AnalysisResult => {
  const text = documentText.trim();
  const legalAreas = guessLegalAreas(text);

  const keywordMatches = Array.from(
    new Set((text.match(/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/g) ?? []).slice(0, 8)),
  );

  const precedents: AnalysisPrecedent[] = [
    {
      id: "fallback-1",
      title: "Responsabilidad civil por incumplimiento contractual",
      court: "Corte Suprema de Justicia",
      chamber: "Sala Civil Transitoria",
      date: "2021-05-12",
      caseNumber: "CAS-2021-1543",
      bindingLevel: "jurisprudencia_uniforme",
      summary:
        "Se establece que el incumplimiento de un contrato de obra genera responsabilidad civil cuando se acredita el daño y el nexo causal.",
      confidence: 62,
      articlesMatched: ["Art. 1969 CC", "Art. 1325 CC"],
      excerpt:
        "El proveedor debe resarcir los daños derivados de su inejecución, salvo que demuestre caso fortuito o fuerza mayor.",
      officialLink: undefined,
    },
  ];

  const noteParts = [];
  if (missingOpenAI) {
    noteParts.push("Análisis generado con heurísticas locales porque no se encontró `OPENAI_API_KEY`.");
  }
  if (extraNote) {
    noteParts.push(extraNote);
  }
  if (metadata.filename) {
    noteParts.push(
      `Archivo procesado: ${metadata.filename} (${metadata.mimetype ?? "tipo desconocido"}, ${metadata.size ?? 0} bytes).`,
    );
  }

  return {
    documentSummary:
      text.length > 0
        ? truncate(text, 600)
        : "No se proporcionó contenido legible para el documento analizado.",
    keyLegalConcepts:
      keywordMatches.length > 0 ? keywordMatches : ["Responsabilidad", "Prueba", "Daño", "Contrato"],
    legalAreas,
    relevantArticles: Array.from(
      new Set(
        (text.match(/Art\.?\s?\d+/g) ?? ["Art. 1969 CC", "Art. 1985 CC"]).slice(0, 5),
      ),
    ),
    precedentsFound: precedents,
    recommendations: [
      "Revisar precedentes vinculantes aplicables al caso para reforzar la estrategia.",
      "Solicitar documentación adicional que respalde los hechos alegados.",
      "Evaluar posibilidades de conciliación temprana si el riesgo procesal es elevado.",
    ],
    risks: [
      "Posible insuficiencia de prueba documental para acreditar el nexo causal.",
      "Contradicciones en los testimonios de las partes podrían debilitar la postura.",
    ],
    confidence: missingOpenAI ? 35 : 25,
    note: noteParts.length > 0 ? noteParts.join(" ") : undefined,
  };
};

const normalizeAnalysisResult = (payload: AnalysisResult): AnalysisResult => {
  const ensureArrayOfStrings = (value: unknown): string[] =>
    Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];

  const ensurePrecedents = (value: unknown): AnalysisPrecedent[] => {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.reduce<AnalysisPrecedent[]>((acc, item, index) => {
      if (typeof item !== "object" || item === null) {
        return acc;
      }

      const precedent = item as Record<string, unknown>;
      const baseId = `precedent-${index + 1}`;
      const bindingCandidate = String(precedent.bindingLevel ?? "relevante");
      const bindingLevel: AnalysisPrecedent["bindingLevel"] =
        bindingCandidate === "ejecutoria_vinculante" ||
        bindingCandidate === "acuerdo_plenario" ||
        bindingCandidate === "jurisprudencia_uniforme" ||
        bindingCandidate === "relevante"
          ? bindingCandidate
          : "relevante";

      acc.push({
        id: String(precedent.id ?? baseId),
        title: String(precedent.title ?? "Precedente sin título"),
        court: String(precedent.court ?? "Corte Suprema"),
        chamber: String(precedent.chamber ?? "Sala"),
        date: String(precedent.date ?? "2023-01-01"),
        caseNumber: String(precedent.caseNumber ?? "EXP-0000"),
        bindingLevel,
        summary: String(precedent.summary ?? "Sin resumen disponible para este precedente."),
        confidence: Number(precedent.confidence ?? 50),
        articlesMatched: ensureArrayOfStrings(precedent.articlesMatched),
        excerpt: String(precedent.excerpt ?? ""),
        officialLink:
          precedent.officialLink != null
            ? String(precedent.officialLink)
            : undefined,
      });

      return acc;
    }, []);
  };

  return {
    documentSummary: sanitizeText(payload.documentSummary),
    keyLegalConcepts: ensureArrayOfStrings(payload.keyLegalConcepts).slice(0, 10),
    legalAreas: ensureArrayOfStrings(payload.legalAreas).slice(0, 6),
    relevantArticles: ensureArrayOfStrings(payload.relevantArticles).slice(0, 10),
    precedentsFound: ensurePrecedents(payload.precedentsFound).slice(0, 6),
    recommendations: ensureArrayOfStrings(payload.recommendations).slice(0, 10),
    risks: ensureArrayOfStrings(payload.risks).slice(0, 10),
    confidence: Math.min(100, Math.max(0, Number(payload.confidence ?? 50))),
    note: payload.note ? sanitizeText(payload.note) : undefined,
  } satisfies AnalysisResult;
};

const analyzeWithOpenAI = async (
  documentText: string,
  metadata: { filename?: string; mimetype?: string; size?: number },
): Promise<AnalysisResult> => {
  if (!openai) {
    return buildFallbackAnalysis(documentText, metadata, true);
  }

  const trimmed = documentText.trim();
  if (!trimmed) {
    throw new HttpError(400, "El documento está vacío. Proporcione contenido para analizar.");
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente legal peruano. Devuelve SIEMPRE un JSON válido que coincida exactamente con la estructura especificada por el usuario.",
        },
        {
          role: "user",
          content: `Analiza el siguiente documento legal y responde únicamente con un JSON con las llaves: documentSummary (string), keyLegalConcepts (array de strings), legalAreas (array de strings), relevantArticles (array de strings), precedentsFound (array de objetos con id, title, court, chamber, date, caseNumber, bindingLevel, summary, confidence, articlesMatched, excerpt, officialLink opcional), recommendations (array de strings), risks (array de strings) y confidence (0-100). Documento: """${truncate(trimmed, 6000)}"""`,
        },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const rawOutput = response.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(rawOutput) as AnalysisResult;
    return normalizeAnalysisResult(parsed);
  } catch (error) {
    console.error("OpenAI analysis failed", error);
    return {
      ...buildFallbackAnalysis(trimmed, metadata, false, "El servicio de IA falló y se aplicó un análisis heurístico."),
      note: "El servicio de IA falló y se aplicó un análisis heurístico.",
    };
  }
};

const extractTextFromFile = (file: Express.Multer.File): { text: string; note?: string } => {
  const allowedTypes = new Set([
    "text/plain",
    "application/json",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]);

  if (!allowedTypes.has(file.mimetype)) {
    throw new HttpError(400, `Tipo de archivo no soportado (${file.mimetype}).`);
  }

  if (/^text\//.test(file.mimetype) || file.mimetype === "application/json") {
    return { text: file.buffer.toString("utf-8") };
  }

  return {
    text: "",
    note: "El archivo se cargó correctamente pero requiere procesamiento adicional para extraer el texto.",
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = createApiRouter();

  apiRouter.post(
    "/analyze-document",
    upload.single("file"),
    asyncHandler(async (req, res) => {
      const bodyText = sanitizeText(req.body?.text);
      const file = req.file ?? undefined;

      if (!file && !bodyText.trim()) {
        throw new HttpError(400, "Debe proporcionar texto o un archivo para analizar.");
      }

      let documentText = bodyText;
      let note: string | undefined;

      if (file) {
        const { text, note: fileNote } = extractTextFromFile(file);
        documentText = text || documentText;
        note = fileNote;
      }

      const analysis = await analyzeWithOpenAI(documentText || bodyText, {
        filename: file?.originalname,
        mimetype: file?.mimetype,
        size: file?.size,
      });

      if (note) {
        analysis.note = analysis.note
          ? `${analysis.note} ${note}`
          : note;
      }

      res.json(analysis);
    }),
  );

  app.use("/api", apiRouter);

  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      return next(err);
    }

    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message });
    }

    console.error("Unexpected error", err);
    res.status(500).json({ error: "Error interno del servidor" });
  });

  return createServer(app);
}
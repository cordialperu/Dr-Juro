import { HttpError } from "../lib/http";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "models/gemini-1.5-flash";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const JURISPRUDENCE_SYSTEM_PROMPT = `Eres un asistente jurídico peruano especializado en jurisprudencia.

IMPORTANTE: Responde DIRECTAMENTE sin preámbulos ni introducciones. No digas "Entendido", "Soy un asistente", ni similares.

Lineamientos:
- Céntrate en jurisprudencia peruana (Corte Suprema, Corte IDH, Tribunal Constitucional).
- Si mencionas casos, incluye fecha, sala y número de expediente cuando sea posible.
- Diferencia claramente opiniones de hechos.
- Si no dispones de información, reconoce la limitación y sugiere fuentes oficiales.
- Ve directo al análisis jurisprudencial sin introducción.`;

const MAX_INPUT_LENGTH = 6000;
const MAX_RESPONSE_TOKENS = 1024;

export type GeminiJurisprudenceAnswer = {
  term: string;
  answer: string;
  references?: string[];
};

const trimPrompt = (value: string) => {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length <= MAX_INPUT_LENGTH) {
    return cleaned;
  }
  return cleaned.slice(0, MAX_INPUT_LENGTH);
};

const cleanJurisprudenceResponse = (text: string): string => {
  // Remover preámbulos comunes
  const preambles = [
    /^Entendido\.?\s*/i,
    /^Soy un asistente jurídico.*?\.\s*/i,
    /^Como asistente jurídico.*?\.\s*/i,
    /^En mi capacidad como.*?\.\s*/i,
    /^Me enfocaré en.*?\.\s*/i,
  ];

  let cleaned = text.trim();
  
  for (const pattern of preambles) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Remover frases completas como "Entendido. Soy un asistente jurídico peruano y me enfocaré en..."
  cleaned = cleaned.replace(
    /^Entendido\.?\s+Soy un asistente.*?(?=\n|$)/im,
    ''
  );

  return cleaned.trim();
};

export async function askGeminiAboutJurisprudence(term: string): Promise<GeminiJurisprudenceAnswer> {
  const trimmed = trimPrompt(term);
  if (!trimmed) {
    throw new HttpError(400, "Debes proporcionar un término o pregunta válido.");
  }

  if (!GEMINI_API_KEY) {
    throw new HttpError(500, "Falta configurar GEMINI_API_KEY en el servidor.");
  }

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          { text: JURISPRUDENCE_SYSTEM_PROMPT },
          { text: `Consulta: ${trimmed}` },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: MAX_RESPONSE_TOKENS,
    },
  };

  const url = `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new HttpError(response.status, errorText || "No se pudo obtener respuesta de Gemini.");
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const firstCandidate = data.candidates?.[0]?.content?.parts ?? [];
  const answer = firstCandidate.map((part) => part.text).filter(Boolean).join("\n");

  if (!answer.trim()) {
    throw new HttpError(502, "Gemini devolvió una respuesta vacía.");
  }

  return {
    term: trimmed,
    answer: cleanJurisprudenceResponse(answer),
  };
}

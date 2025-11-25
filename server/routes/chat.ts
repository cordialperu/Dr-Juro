import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";
import type { Client, LegalProcessV2, ChatMessage } from "@shared/schema";
import { clients, legalProcessV2, chatMessages } from "@shared/schema";
import { asyncHandler, HttpError } from "../lib/http";
import { db } from "../db";
import { storage } from "../storage";
import { generateGeminiResponse, type GeminiChatMessage } from "../services/gemini";

const SYSTEM_PROMPT = `Eres "Asistente", analista legal peruano dedicado al caso activo.
Reglas estrictas:
1. Nada de saludos, introducciones ni frases como "entiendo" o "resumen".
2. Nunca repitas ni parafrasees la pregunta del abogado y no formules preguntas salvo que falte un dato crítico.
3. Cada línea debe aportar datos accionables: fechas, montos, responsables, riesgos o próximos pasos concretos.
4. Integra contexto legal, estrategia, finanzas y hallazgos de documentos/búsquedas. Si usas un documento, menciónalo brevemente (p.ej., "Documento: Resolución 17/11").
5. Prioriza velocidad: abre con la respuesta central, luego detalla puntos críticos y cierra con próximos pasos si suman valor.
6. Usa español peruano neutral y mantén las respuestas concisas (máx. 6 viñetas o párrafos cortos).
7. Si falta información indispensable, indícalo en una sola línea con la acción para obtenerla.`;

const MAX_CONTEXT_LENGTH = 4000;
const MAX_HISTORY_MESSAGES = 6;
const STORAGE_CLIENTS_BASE = path.join(process.cwd(), "storage", "clients");
const MAX_DOCUMENT_SNIPPET = 900;
const MAX_DOCUMENT_SECTIONS = 4;

const router = Router();

/**
 * GET /chat/:clientId/history
 * Retrieve chat history for a client
 */
router.get(
  "/:clientId/history",
  asyncHandler(async (req, res) => {
    const { clientId } = req.params;
    const { limit = 50 } = req.query;

    if (!db) {
      return res.json({ messages: [] });
    }

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.clientId, clientId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(Number(limit));

    res.json({
      messages: messages.reverse().map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.createdAt,
        metadata: msg.metadata,
      })),
    });
  }),
);

/**
 * DELETE /chat/:clientId/history
 * Clear chat history for a client
 */
router.delete(
  "/:clientId/history",
  asyncHandler(async (req, res) => {
    const { clientId } = req.params;

    if (!db) {
      return res.json({ success: true });
    }

    await db.delete(chatMessages).where(eq(chatMessages.clientId, clientId));

    res.json({ success: true, message: "Chat history cleared" });
  }),
);

/**
 * POST /chat/:clientId
 * Send a message and get AI response
 */
router.post(
  "/:clientId",
  asyncHandler(async (req, res) => {
    const { clientId } = req.params;
    const { message, conversationHistory } = req.body ?? {};

    if (typeof message !== "string" || !message.trim()) {
      throw new HttpError(400, "Debes enviar un mensaje válido.");
    }

    const client = await findClient(clientId);
    if (!client) {
      throw new HttpError(404, "Cliente no encontrado.");
    }

    const processData = await findProcessData(clientId);
    const caseContext = buildCaseContext(client, processData);
    const documentContext = await buildDocumentContext(clientId);
    const historyMessages = normalizeConversationHistory(conversationHistory);

    const compiledContext = [
      `Contexto esencial del caso:\n${caseContext}`,
      documentContext ? `Documentos y hallazgos previos:\n${documentContext}` : null,
    ]
      .filter(Boolean)
      .join("\n\n");

    const promptMessages: GeminiChatMessage[] = [
      { role: "user", text: SYSTEM_PROMPT },
      {
        role: "user",
        text: compiledContext,
      },
      ...historyMessages,
      {
        role: "user",
        text: `Consulta del abogado: ${message.trim()}\nResponde siguiendo todas las reglas, solo con información relevante.`,
      },
    ];

    try {
      const aiResponse = await generateGeminiResponse(promptMessages, {
        temperature: 0.25,
        maxOutputTokens: 832,
      });

      // Save user message and AI response to database
      if (db) {
        try {
          await db.insert(chatMessages).values({
            clientId,
            role: "user",
            content: message.trim(),
          });

          await db.insert(chatMessages).values({
            clientId,
            role: "assistant",
            content: aiResponse,
          });
        } catch (dbError) {
          console.error("Failed to save chat messages to database:", dbError);
          // Continue even if DB save fails
        }
      }

      res.json({
        response: aiResponse,
      });
    } catch (error) {
      console.error("Gemini chat error", error);
      const fallbackResponse = buildFallbackResponse(client, caseContext, documentContext);
      
      // Save user message and fallback response
      if (db) {
        try {
          await db.insert(chatMessages).values({
            clientId,
            role: "user",
            content: message.trim(),
          });

          await db.insert(chatMessages).values({
            clientId,
            role: "assistant",
            content: fallbackResponse,
            metadata: { fallback: true },
          });
        } catch (dbError) {
          console.error("Failed to save fallback messages:", dbError);
        }
      }

      res.json({
        response: fallbackResponse,
        fallback: true,
      });
    }
  }),
);

async function findClient(clientId: string) {
  if (db) {
    const [client] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
    return client ?? null;
  }
  return storage.getClient(clientId);
}

async function findProcessData(clientId: string) {
  if (!db) {
    return null;
  }

  const [record] = await db
    .select()
    .from(legalProcessV2)
    .where(eq(legalProcessV2.clientId, clientId))
    .limit(1);

  if (!record) {
    return null;
  }

  return (record as LegalProcessV2).data as Record<string, any>;
}

function buildCaseContext(client: Client, processData?: Record<string, any> | null) {
  const sections: string[] = [];

  sections.push(
    [
      `Nombre: ${client.name}`,
      client.email ? `Correo: ${client.email}` : null,
      client.whatsappPrimary ? `WhatsApp: ${client.whatsappPrimary}` : null,
      client.notes ? `Notas: ${client.notes}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  const caseStatus = processData?.caseStatus;
  if (caseStatus) {
    sections.push(
      [
        `Estado procesal:`,
        `- Expediente: ${caseStatus.caseNumber || "Sin número"}`,
        `- Tipo: ${caseStatus.caseType || "No definido"}`,
        `- Etapa actual: ${caseStatus.currentStage || "No registrada"}`,
        `- Resolución: ${caseStatus.resolutionStatus || "en_tramite"}`,
        caseStatus.nextDeadline
          ? `- Próximo plazo: ${caseStatus.nextDeadline.date} (${caseStatus.nextDeadline.description})`
          : null,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  const participants = Array.isArray(processData?.participants)
    ? processData.participants
    : processData?.intervinientes?.participants;

  if (Array.isArray(participants) && participants.length > 0) {
    const summary = participants
      .slice(0, 6)
      .map((participant: any) => {
        const role = participant.role ? participant.role : "sin rol";
        const contact = participant.contact ? ` | ${participant.contact}` : "";
        return `• ${participant.name ?? "Participante"} (${role})${contact}`;
      })
      .join("\n");
    sections.push(`Intervinientes clave:\n${summary}`);
  }

  if (Array.isArray(processData?.milestones) && processData.milestones.length > 0) {
    const recent = [...processData.milestones]
      .slice(-5)
      .map((milestone: any) => `• ${milestone.date ?? "sin fecha"} - ${milestone.title ?? milestone.stage ?? "Hito"}`)
      .join("\n");
    sections.push(`Últimos hitos procesales:\n${recent}`);
  }

  if (processData?.strategy) {
    const strategy = processData.strategy;
    sections.push(
      [
        "Estrategia/Teoría del caso:",
        strategy.caseTheory ? `- Teoría: ${strategy.caseTheory}` : null,
        strategy.legalStrategy ? `- Estrategia legal: ${strategy.legalStrategy}` : null,
        Array.isArray(strategy.objectives) && strategy.objectives.length > 0
          ? `- Objetivos: ${strategy.objectives.slice(0, 3).join(", ")}`
          : null,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  if (processData?.financial) {
    const financial = processData.financial;
    sections.push(
      [
        "Control Financiero:",
        `- Honorarios pactados: S/ ${formatCurrency(financial.honorarios)}`,
        `- Gastos estimados: S/ ${formatCurrency(financial.gastos)}`,
        `- Reparación civil: S/ ${formatCurrency(financial.reparacionCivil)}`,
        Array.isArray(financial.payments) && financial.payments.length > 0
          ? `- Último pago: ${formatPayment(financial.payments[financial.payments.length - 1])}`
          : null,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  const context = sections.filter((section) => Boolean(section?.trim())).join("\n\n");
  return context.length > MAX_CONTEXT_LENGTH
    ? `${context.slice(0, MAX_CONTEXT_LENGTH)}…`
    : context;
}

function normalizeConversationHistory(history: unknown): GeminiChatMessage[] {
  if (!Array.isArray(history)) {
    return [];
  }

  const sanitized: GeminiChatMessage[] = history
    .filter((entry: any) => entry && typeof entry.content === "string" && typeof entry.role === "string")
    .slice(-MAX_HISTORY_MESSAGES)
    .map((entry: any): GeminiChatMessage => ({
      role: entry.role === "assistant" ? "model" : "user",
      text: entry.content as string,
    }));

  return sanitized;
}

function buildFallbackResponse(client: Client, context: string, documentContext?: string | null) {
  return [
    context,
    documentContext ? `Documentos y hallazgos:\n${documentContext}` : null,
    "Nota técnica: respuesta generada localmente porque el motor de IA no estuvo disponible.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function formatCurrency(value: unknown) {
  const num = typeof value === "number" ? value : Number(value ?? 0);
  if (Number.isNaN(num)) {
    return "0.00";
  }
  return num.toFixed(2);
}

function formatPayment(payment: any) {
  if (!payment) {
    return "Sin pagos registrados";
  }
  const date = payment.date ? payment.date : "fecha desconocida";
  const amount = payment.amount ? `S/ ${formatCurrency(payment.amount)}` : "monto no registrado";
  const concept = payment.concept ? `(${payment.concept})` : "";
  return `${date} - ${amount} ${concept}`.trim();
}

type ConsolidatedText = {
  consolidatedText: string;
  documentCount?: number;
  lastUpdated?: string;
};

async function buildDocumentContext(clientId: string) {
  const clientPath = path.join(STORAGE_CLIENTS_BASE, clientId);
  let phaseEntries: string[] = [];
  try {
    const phases = await fs.readdir(clientPath, { withFileTypes: true });
    phaseEntries = phases.filter((item) => item.isDirectory()).map((item) => item.name);
  } catch {
    return null;
  }

  const sections: string[] = [];

  for (const phase of phaseEntries) {
    const phasePath = path.join(clientPath, phase);
    let folderEntries: string[] = [];
    try {
      const folders = await fs.readdir(phasePath, { withFileTypes: true });
      folderEntries = folders.filter((item) => item.isDirectory()).map((item) => item.name);
    } catch {
      continue;
    }

    for (const folder of folderEntries) {
      const consolidatedPath = path.join(phasePath, folder, "consolidated.json");
      try {
        const raw = await fs.readFile(consolidatedPath, "utf-8");
        const data = JSON.parse(raw) as ConsolidatedText;
        if (!data?.consolidatedText) {
          continue;
        }

        const snippet = data.consolidatedText.trim().slice(0, MAX_DOCUMENT_SNIPPET);
        if (!snippet) {
          continue;
        }

        const hasMore = data.consolidatedText.length > snippet.length;
        sections.push(
          [
            `• ${formatPhaseLabel(phase)} › ${formatFolderLabel(folder)} (docs: ${data.documentCount ?? 0}, actualizado ${formatDocumentDate(data.lastUpdated)})`,
            snippet,
            hasMore ? "…" : null,
          ]
            .filter(Boolean)
            .join("\n"),
        );
      } catch {
        continue;
      }
    }
  }

  if (sections.length === 0) {
    return null;
  }

  return sections.slice(-MAX_DOCUMENT_SECTIONS).join("\n");
}

function formatFolderLabel(folder: string) {
  return folder.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatPhaseLabel(phase: string) {
  return phase.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDocumentDate(date: string | undefined) {
  if (!date) {
    return "sin fecha";
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  return parsed.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

export default router;

import type { Router } from "express";
import multer from "multer";
import { asyncHandler, HttpError } from "../lib/http";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Inicializar Gemini
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// Función para extraer texto de PDF usando pdfjs
const extractTextFromPDF = async (buffer: Buffer): Promise<string> => {
  try {
    const data = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    
    let fullText = "";
    
    // Extraer texto de todas las páginas
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      
      fullText += `\n\n=== PÁGINA ${pageNum} ===\n${pageText}`;
    }
    
    return fullText.trim();
  } catch (error) {
    console.error("Error al extraer texto del PDF:", error);
    throw error;
  }
};

// Función para extraer texto usando Gemini Vision
const extractTextWithGemini = async (file: Express.Multer.File): Promise<string> => {
  if (!genAI) {
    throw new HttpError(500, "API de Gemini no configurada. Configure GEMINI_API_KEY en .env");
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-latest",
    });

    // Convertir buffer a base64
    const base64Data = file.buffer.toString("base64");
    
    const imageParts = [
      {
        inlineData: {
          data: base64Data,
          mimeType: file.mimetype,
        },
      },
    ];

    const prompt = `Eres un experto en transcripción de documentos legales peruanos. Tu tarea es extraer TODO el texto visible en este documento, sin excepción.

INSTRUCCIONES CRÍTICAS:
1. Lee CADA palabra, número, fecha y símbolo del documento
2. Transcribe TODO el contenido de TODAS las páginas (no solo la primera)
3. Incluye: encabezados, números de expediente, fechas, nombres completos, DNI, direcciones, cuerpo del texto, firmas, sellos
4. Mantén el orden y estructura original (saltos de línea, párrafos, secciones)
5. Si hay múltiples páginas, transcribe TODAS
6. Si hay tablas, transcríbelas en formato de texto
7. Si hay sellos o firmas, indica [SELLO: descripción] o [FIRMA: nombre]
8. NO resumas, NO omitas nada, NO hagas interpretaciones
9. Si algo no es legible, marca como [ILEGIBLE]

IMPORTANTE: Este es un documento legal y necesitamos TODA la información, no solo el título o resumen.

Transcribe el documento completo a continuación:`;

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    return text || "[No se pudo extraer texto del documento]";
  } catch (error) {
    console.error("Error al extraer texto con Gemini:", error);
    throw new HttpError(500, `Error al procesar con Gemini: ${error instanceof Error ? error.message : "Error desconocido"}`);
  }
};

// Función para extraer texto de diferentes formatos
const extractTextFromFile = async (file: Express.Multer.File): Promise<{ text: string; note?: string }> => {
  // Texto plano
  if (file.mimetype === "text/plain") {
    return { text: file.buffer.toString("utf-8") };
  }

  // Para PDFs, usar pdfjs
  if (file.mimetype === "application/pdf") {
    try {
      console.log("Extrayendo texto del PDF con pdfjs...");
      const extractedText = await extractTextFromPDF(file.buffer);
      
      // Si el PDF tiene texto extraíble, usarlo
      if (extractedText && extractedText.length > 50) {
        console.log(`Texto extraído exitosamente: ${extractedText.length} caracteres`);
        return {
          text: extractedText,
          note: "Texto extraído del PDF",
        };
      }
      
      // Si el PDF no tiene texto, intentar con Gemini
      console.log("PDF sin texto extraíble, usando Gemini Vision...");
      const text = await extractTextWithGemini(file);
      return {
        text,
        note: "PDF escaneado - Texto extraído con Google Gemini Vision API",
      };
    } catch (error) {
      console.error("Error al procesar PDF con pdfjs:", error);
      // Intentar con Gemini como fallback
      try {
        const text = await extractTextWithGemini(file);
        return {
          text,
          note: "Texto extraído con Google Gemini API",
        };
      } catch (geminiError) {
        console.error("Error con Gemini:", geminiError);
        return {
          text: `[Error al extraer texto del PDF ${file.originalname}]\n\nPor favor, copie y pegue el contenido del PDF manualmente.`,
          note: "Error al extraer PDF - Por favor ingrese el texto manualmente",
        };
      }
    }
  }

  // Para imágenes, usar Gemini Vision
  if (file.mimetype.startsWith("image/")) {
    const text = await extractTextWithGemini(file);
    return {
      text,
      note: "Texto extraído con Google Gemini Vision API",
    };
  }

  if (
    file.mimetype === "application/msword" ||
    file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return {
      text: `[Texto extraído del documento ${file.originalname}]\n\nPor favor, copie y pegue el contenido del documento manualmente.`,
      note: "Extracción de Word no soportada - Por favor ingrese el texto manualmente",
    };
  }

  throw new HttpError(400, "Tipo de archivo no soportado para extracción de texto");
};

export function registerExtractTextRoutes(router: Router) {
  router.post(
    "/extract-text",
    upload.single("file"),
    asyncHandler(async (req, res) => {
      const file = req.file;

      if (!file) {
        throw new HttpError(400, "No se proporcionó ningún archivo");
      }

      try {
        const result = await extractTextFromFile(file);
        res.json(result);
      } catch (error) {
        if (error instanceof HttpError) {
          throw error;
        }
        throw new HttpError(500, "Error al procesar el archivo");
      }
    })
  );
}

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db';
import { clientDocuments, consolidatedContext } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

// Configurar el worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = fileURLToPath(
  new URL('../../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs', import.meta.url)
);

/**
 * Extraer texto de un archivo PDF
 */
export async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const uint8Array = new Uint8Array(dataBuffer);
    
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    // Iterar sobre todas las páginas
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += `\n--- PÁGINA ${pageNum} ---\n${pageText}\n`;
    }
    
    // Si el PDF no tiene texto (es escaneado), intentar OCR
    if (fullText.trim().length < 50) {
      console.log('PDF parece escaneado, intentando OCR...');
      // Aquí podrías convertir PDF a imagen y hacer OCR
      // Por ahora retornamos un mensaje
      return fullText + '\n[NOTA: Documento posiblemente escaneado, requiere OCR manual]';
    }
    
    return fullText;
  } catch (error) {
    console.error('Error extrayendo texto de PDF:', error);
    throw new Error(`Error al procesar PDF: ${error}`);
  }
}

/**
 * Extraer texto de una imagen usando OCR
 */
export async function extractTextFromImage(filePath: string): Promise<string> {
  try {
    console.log(`Iniciando OCR para: ${filePath}`);
    
    const result = await Tesseract.recognize(
      filePath,
      'spa', // Idioma español
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progreso: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );
    
    return result.data.text;
  } catch (error) {
    console.error('Error en OCR:', error);
    throw new Error(`Error al extraer texto de imagen: ${error}`);
  }
}

/**
 * Extraer texto de documento Word (DOCX)
 */
export async function extractTextFromWord(filePath: string): Promise<string> {
  try {
    // Por ahora retornamos un placeholder
    // Se puede implementar con librerías como mammoth.js
    return '[Texto de documento Word - Pendiente implementación completa]';
  } catch (error) {
    console.error('Error extrayendo texto de Word:', error);
    throw new Error(`Error al procesar documento Word: ${error}`);
  }
}

/**
 * Extraer texto de archivo de texto plano
 */
export async function extractTextFromTxt(filePath: string): Promise<string> {
  try {
    const text = await fs.readFile(filePath, 'utf-8');
    return text;
  } catch (error) {
    console.error('Error leyendo archivo de texto:', error);
    throw new Error(`Error al leer archivo de texto: ${error}`);
  }
}

/**
 * Optimizar imagen para almacenamiento (reducir resolución manteniendo legibilidad)
 */
export async function optimizeImage(
  inputPath: string,
  outputPath: string,
  maxWidth: number = 1200
): Promise<{ width: number; height: number; size: number }> {
  try {
    const metadata = await sharp(inputPath).metadata();
    
    // Redimensionar si es necesario
    let pipeline = sharp(inputPath);
    
    if (metadata.width && metadata.width > maxWidth) {
      pipeline = pipeline.resize(maxWidth, undefined, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }
    
    // Optimizar compresión
    pipeline = pipeline.jpeg({ quality: 85, progressive: true });
    
    // Guardar imagen optimizada
    const output = await pipeline.toFile(outputPath);
    
    return {
      width: output.width,
      height: output.height,
      size: output.size
    };
  } catch (error) {
    console.error('Error optimizando imagen:', error);
    throw new Error(`Error al optimizar imagen: ${error}`);
  }
}

/**
 * Procesar documento según su tipo
 */
export async function processDocument(
  filePath: string,
  fileType: string
): Promise<string> {
  const ext = fileType.toLowerCase();
  
  if (ext === 'pdf' || ext === 'application/pdf') {
    return await extractTextFromPDF(filePath);
  } else if (ext.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext)) {
    return await extractTextFromImage(filePath);
  } else if (ext.includes('word') || ext === 'docx' || ext === 'doc') {
    return await extractTextFromWord(filePath);
  } else if (ext === 'txt' || ext === 'text/plain') {
    return await extractTextFromTxt(filePath);
  } else {
    throw new Error(`Tipo de archivo no soportado: ${fileType}`);
  }
}

/**
 * Consolidar texto de todos los documentos en una carpeta
 */
export async function consolidateFolderTexts(
  folderId: string,
  clientId: string,
  phase: string
): Promise<{ text: string; documentCount: number; tokenCount: number }> {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }

    // Obtener todos los documentos de la carpeta
    const documents = await db
      .select()
      .from(clientDocuments)
      .where(
        and(
          eq(clientDocuments.folderId, folderId),
          eq(clientDocuments.clientId, clientId)
        )
      );
    
    let consolidatedText = '';
    
    for (const doc of documents) {
      const separator = `\n\n${'='.repeat(80)}\n`;
      const header = `DOCUMENTO: ${doc.fileName}\n`;
      const uploadInfo = `Subido: ${new Date(doc.uploadedAt).toLocaleString('es-PE')}\n`;
      const typeInfo = `Tipo: ${doc.fileType}\n`;
      const divider = `${'-'.repeat(80)}\n\n`;
      
      consolidatedText += separator + header + uploadInfo + typeInfo + divider;
      consolidatedText += doc.extractedText || '[Sin texto extraído]';
      consolidatedText += '\n';
    }
    
    // Estimación aproximada de tokens (1 token ≈ 4 caracteres en español)
    const estimatedTokens = Math.ceil(consolidatedText.length / 4);
    
    // Guardar o actualizar el texto consolidado
    const existing = await db
      .select()
      .from(consolidatedContext)
      .where(eq(consolidatedContext.folderId, folderId))
      .limit(1);
    
    if (existing.length > 0) {
      await db
        .update(consolidatedContext)
        .set({
          consolidatedText,
          documentCount: documents.length.toString(),
          tokenCount: estimatedTokens.toString(),
          lastUpdated: new Date()
        })
        .where(eq(consolidatedContext.folderId, folderId));
    } else {
      await db.insert(consolidatedContext).values({
        clientId,
        folderId,
        phase,
        consolidatedText,
        documentCount: documents.length.toString(),
        tokenCount: estimatedTokens.toString()
      });
    }
    
    return {
      text: consolidatedText,
      documentCount: documents.length,
      tokenCount: estimatedTokens
    };
  } catch (error) {
    console.error('Error consolidando textos:', error);
    throw error;
  }
}

/**
 * Procesar imagen capturada desde cámara
 */
export async function processCameraCapture(
  imageBuffer: Buffer,
  fileName: string,
  clientId: string,
  folderId: string,
  storagePath: string
): Promise<{ filePath: string; extractedText: string; optimizedSize: number }> {
  try {
    // Crear paths
    const originalPath = path.join(storagePath, `original_${fileName}`);
    const optimizedPath = path.join(storagePath, fileName);
    
    // Guardar imagen original temporalmente
    await fs.writeFile(originalPath, imageBuffer);
    
    // Optimizar imagen
    const optimized = await optimizeImage(originalPath, optimizedPath, 1200);
    
    // Extraer texto con OCR
    const extractedText = await extractTextFromImage(optimizedPath);
    
    // Eliminar imagen original (solo mantener la optimizada)
    await fs.unlink(originalPath);
    
    return {
      filePath: optimizedPath,
      extractedText,
      optimizedSize: optimized.size
    };
  } catch (error) {
    console.error('Error procesando captura de cámara:', error);
    throw error;
  }
}

/**
 * Crear estructura de carpetas para almacenamiento
 */
export async function ensureStorageStructure(
  clientId: string,
  phase: string,
  folderType: string
): Promise<string> {
  const basePath = path.join(process.cwd(), 'storage', 'clients', clientId, phase, folderType);
  
  try {
    await fs.mkdir(basePath, { recursive: true });
    return basePath;
  } catch (error) {
    console.error('Error creando estructura de carpetas:', error);
    throw error;
  }
}

/**
 * Contar tokens aproximados de un texto
 */
export function estimateTokenCount(text: string): number {
  // Estimación: 1 token ≈ 4 caracteres para español
  return Math.ceil(text.length / 4);
}

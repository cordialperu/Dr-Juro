import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { 
  processDocument, 
  processCameraCapture, 
  ensureStorageStructure,
  estimateTokenCount 
} from '../services/documentProcessor';

const router = Router();

// Configurar multer para almacenamiento en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

interface Document {
  id: string;
  clientId: string;
  phase: string;
  folderType: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  extractedText: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface ConsolidatedText {
  consolidatedText: string;
  documentCount: number;
  tokenCount: number;
  lastUpdated: string;
}

// Rutas base para almacenamiento
const STORAGE_BASE = path.join(process.cwd(), 'storage');
const METADATA_FILE = 'documents.json';
const CONSOLIDATED_FILE = 'consolidated.json';

/**
 * Obtener la ruta de almacenamiento para un cliente/fase/carpeta
 */
function getStoragePath(clientId: string, phase: string, folderType: string): string {
  return path.join(STORAGE_BASE, 'clients', clientId, phase, folderType);
}

/**
 * Leer documentos desde el archivo JSON
 */
async function readDocuments(storagePath: string): Promise<Document[]> {
  try {
    const metadataPath = path.join(storagePath, METADATA_FILE);
    const data = await fs.readFile(metadataPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

/**
 * Guardar documentos en el archivo JSON
 */
async function saveDocuments(storagePath: string, documents: Document[]): Promise<void> {
  // Crear estructura de carpetas si no existe
  try {
    await fs.mkdir(storagePath, { recursive: true });
  } catch (error) {
    // Carpeta ya existe
  }
  const metadataPath = path.join(storagePath, METADATA_FILE);
  await fs.writeFile(metadataPath, JSON.stringify(documents, null, 2), 'utf-8');
}

/**
 * Consolidar texto de todos los documentos en una carpeta
 */
async function consolidateTexts(storagePath: string, documents: Document[]): Promise<void> {
  let consolidatedText = '';
  
  for (const doc of documents) {
    if (doc.extractedText) {
      consolidatedText += `\n${'='.repeat(80)}\n`;
      consolidatedText += `DOCUMENTO: ${doc.fileName}\n`;
      consolidatedText += `TIPO: ${doc.fileType}\n`;
      consolidatedText += `FECHA: ${new Date(doc.uploadedAt).toLocaleDateString('es-PE')}\n`;
      consolidatedText += `${'='.repeat(80)}\n\n`;
      consolidatedText += doc.extractedText;
      consolidatedText += '\n\n';
    }
  }

  const consolidated: ConsolidatedText = {
    consolidatedText: consolidatedText.trim(),
    documentCount: documents.filter(d => d.extractedText).length,
    tokenCount: estimateTokenCount(consolidatedText),
    lastUpdated: new Date().toISOString(),
  };

  const consolidatedPath = path.join(storagePath, CONSOLIDATED_FILE);
  await fs.writeFile(consolidatedPath, JSON.stringify(consolidated, null, 2), 'utf-8');
}

/**
 * GET /clients/:clientId/documents/:phase
 * Obtener todos los documentos de todas las carpetas de una fase
 */
router.get('/clients/:clientId/documents/:phase', async (req, res) => {
  try {
    const { clientId, phase } = req.params;
    const allDocuments: Document[] = [];

    const phasePath = path.join(STORAGE_BASE, 'clients', clientId, phase);

    try {
      const folders = await fs.readdir(phasePath);

      for (const folderType of folders) {
        const folderPath = path.join(phasePath, folderType);
        const stat = await fs.stat(folderPath);

        if (stat.isDirectory()) {
          const documents = await readDocuments(folderPath);
          allDocuments.push(...documents);
        }
      }
    } catch (error) {
      // Si no existe la carpeta, devolver array vacío
    }

    res.json(allDocuments);
  } catch (error) {
    console.error('Error obteniendo documentos:', error);
    res.status(500).json({ error: 'Error al obtener documentos' });
  }
});

/**
 * GET /clients/:clientId/documents/:phase/:folderType
 * Obtener los documentos de una carpeta específica
 */
router.get('/clients/:clientId/documents/:phase/:folderType', async (req, res) => {
  try {
    const { clientId, phase, folderType } = req.params;
    const storagePath = getStoragePath(clientId, phase, folderType);
    const documents = await readDocuments(storagePath);

    res.json({ documents });
  } catch (error) {
    console.error('Error obteniendo documentos de la carpeta:', error);
    res.status(500).json({ error: 'Error al obtener documentos de la carpeta' });
  }
});

/**
 * POST /clients/:clientId/documents/upload
 * Subir un archivo a una carpeta específica
 */
router.post('/clients/:clientId/documents/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('=== UPLOAD REQUEST ===');
    console.log('Params:', req.params);
    console.log('Body:', req.body);
    console.log('File:', req.file ? { name: req.file.originalname, size: req.file.size, type: req.file.mimetype } : 'NO FILE');
    
    const { clientId } = req.params;
    const { folderType, phase } = req.body;
    const file = req.file;

    if (!file || !folderType || !phase) {
      console.error('Faltan parámetros:', { file: !!file, folderType, phase });
      return res.status(400).json({ error: 'Faltan parámetros requeridos' });
    }

    const storagePath = getStoragePath(clientId, phase, folderType);
    console.log('Storage path:', storagePath);
    
    // Crear estructura de carpetas
    await fs.mkdir(storagePath, { recursive: true });
    console.log('Carpeta creada');

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const safeFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${safeFileName}`;
    const filePath = path.join(storagePath, fileName);

    // Guardar archivo
    await fs.writeFile(filePath, file.buffer);
    console.log('Archivo guardado:', filePath);

    // Procesar documento (extraer texto)
    console.log('Procesando documento...');
    const extractedText = await processDocument(filePath, file.mimetype);
    console.log('Texto extraído, longitud:', extractedText.length);

    // Crear registro del documento
    const document: Document = {
      id: `${clientId}_${phase}_${folderType}_${timestamp}`,
      clientId,
      phase,
      folderType,
      fileName: file.originalname,
      filePath,
      fileType: file.mimetype,
      fileSize: file.size,
      extractedText,
      uploadedAt: new Date().toISOString(),
      uploadedBy: (req.session as any)?.userId || 'unknown',
    };

    console.log('Documento creado:', document.id);

    // Leer documentos existentes, agregar nuevo, y guardar
    const documents = await readDocuments(storagePath);
    console.log('Documentos existentes:', documents.length);
    documents.push(document);
    await saveDocuments(storagePath, documents);
    console.log('Documentos guardados:', documents.length);

    // Consolidar textos
    await consolidateTexts(storagePath, documents);
    console.log('Textos consolidados');

    res.json({ 
      success: true, 
      document,
      message: 'Archivo subido y procesado correctamente' 
    });
  } catch (error) {
    console.error('Error subiendo archivo:', error);
    res.status(500).json({ error: 'Error al subir archivo', details: String(error) });
  }
});

/**
 * POST /clients/:clientId/documents/camera-capture
 * Capturar imagen con cámara, optimizar y extraer texto OCR
 */
router.post('/clients/:clientId/documents/camera-capture', upload.single('image'), async (req, res) => {
  try {
    const { clientId } = req.params;
    const { folderType, phase } = req.body;
    const file = req.file;

    if (!file || !folderType || !phase) {
      return res.status(400).json({ error: 'Faltan parámetros requeridos' });
    }

    const storagePath = getStoragePath(clientId, phase, folderType);
    // Crear estructura de carpetas
    await fs.mkdir(storagePath, { recursive: true });

    // Generar nombre único
    const timestamp = Date.now();
    const fileName = `camera_${timestamp}.jpg`;

    // Procesar captura (optimizar y OCR) - NO necesitamos clientId ni folderId
    const result = await processCameraCapture(
      file.buffer,
      fileName,
      clientId,
      folderType,
      storagePath
    );

    // Crear registro del documento
    const document: Document = {
      id: `${clientId}_${phase}_${folderType}_${timestamp}`,
      clientId,
      phase,
      folderType,
      fileName: `Captura_${new Date().toLocaleDateString('es-PE')}.jpg`,
      filePath: result.filePath,
      fileType: 'image/jpeg',
      fileSize: result.optimizedSize,
      extractedText: result.extractedText,
      uploadedAt: new Date().toISOString(),
      uploadedBy: (req.session as any)?.userId || 'unknown',
    };

    // Guardar metadata
    const documents = await readDocuments(storagePath);
    documents.push(document);
    await saveDocuments(storagePath, documents);

    // Consolidar textos
    await consolidateTexts(storagePath, documents);

    res.json({ 
      success: true, 
      document,
      message: 'Imagen capturada y procesada correctamente' 
    });
  } catch (error) {
    console.error('Error capturando imagen:', error);
    res.status(500).json({ error: 'Error al capturar imagen' });
  }
});

/**
 * GET /clients/:clientId/documents/:phase/consolidated
 * Obtener texto consolidado de toda la fase (todas las carpetas)
 */
router.get('/clients/:clientId/documents/:phase/consolidated', async (req, res) => {
  try {
    const { clientId, phase } = req.params;
    const phasePath = path.join(STORAGE_BASE, 'clients', clientId, phase);
    
    let allConsolidatedText = '';
    let totalDocuments = 0;
    let totalTokens = 0;

    try {
      const folders = await fs.readdir(phasePath);
      
      for (const folderType of folders) {
        const folderPath = path.join(phasePath, folderType);
        const consolidatedPath = path.join(folderPath, CONSOLIDATED_FILE);
        
        try {
          const data = await fs.readFile(consolidatedPath, 'utf-8');
          const consolidated: ConsolidatedText = JSON.parse(data);
          
          if (consolidated.consolidatedText) {
            allConsolidatedText += `\n\n${'#'.repeat(80)}\n`;
            allConsolidatedText += `CARPETA: ${folderType.toUpperCase().replace(/_/g, ' ')}\n`;
            allConsolidatedText += `${'#'.repeat(80)}\n\n`;
            allConsolidatedText += consolidated.consolidatedText;
            
            totalDocuments += consolidated.documentCount;
            totalTokens += consolidated.tokenCount;
          }
        } catch (error) {
          // Carpeta sin documentos consolidados
        }
      }
    } catch (error) {
      // Fase sin carpetas
    }

    res.json({
      consolidatedText: allConsolidatedText.trim() || 'No hay documentos en esta fase',
      documentCount: totalDocuments,
      tokenCount: totalTokens,
    });
  } catch (error) {
    console.error('Error obteniendo texto consolidado:', error);
    res.status(500).json({ error: 'Error al obtener texto consolidado' });
  }
});

/**
 * GET /clients/:clientId/documents/:phase/:folderType/consolidated
 * Obtener texto consolidado de UNA carpeta específica (para análisis independientes)
 */
router.get('/clients/:clientId/documents/:phase/:folderType/consolidated', async (req, res) => {
  try {
    const { clientId, phase, folderType } = req.params;
    const storagePath = getStoragePath(clientId, phase, folderType);
    const consolidatedPath = path.join(storagePath, CONSOLIDATED_FILE);
    
    try {
      const data = await fs.readFile(consolidatedPath, 'utf-8');
      const consolidated: ConsolidatedText = JSON.parse(data);
      res.json(consolidated);
    } catch (error) {
      res.json({
        consolidatedText: 'No hay documentos en esta carpeta',
        documentCount: 0,
        tokenCount: 0,
        lastUpdated: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error obteniendo texto consolidado de carpeta:', error);
    res.status(500).json({ error: 'Error al obtener texto consolidado' });
  }
});

/**
 * DELETE /documents/:documentId
 * Eliminar un documento
 */
router.delete('/documents/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    
    // El documentId tiene formato: clientId_phase_folderType_timestamp
    const parts = documentId.split('_');
    if (parts.length < 4) {
      return res.status(400).json({ error: 'ID de documento inválido' });
    }

    const clientId = parts[0];
    const phase = parts[1];
    const folderType = parts[2];
    
    const storagePath = getStoragePath(clientId, phase, folderType);
    const documents = await readDocuments(storagePath);
    
    const documentToDelete = documents.find(d => d.id === documentId);
    if (!documentToDelete) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    // Eliminar archivo físico
    try {
      await fs.unlink(documentToDelete.filePath);
    } catch (error) {
      console.error('Error eliminando archivo físico:', error);
    }

    // Eliminar de metadata
    const updatedDocuments = documents.filter(d => d.id !== documentId);
    await saveDocuments(storagePath, updatedDocuments);

    // Re-consolidar textos
    await consolidateTexts(storagePath, updatedDocuments);

    res.json({ 
      success: true, 
      message: 'Documento eliminado correctamente' 
    });
  } catch (error) {
    console.error('Error eliminando documento:', error);
    res.status(500).json({ error: 'Error al eliminar documento' });
  }
});

/**
 * DELETE /clients/:clientId/documents/:phase/:folderType/:documentId
 * Eliminar un documento específico de una carpeta
 */
router.delete('/clients/:clientId/documents/:phase/:folderType/:documentId', async (req, res) => {
  try {
    const { clientId, phase, folderType, documentId } = req.params;
    
    const storagePath = getStoragePath(clientId, phase, folderType);
    const documents = await readDocuments(storagePath);
    
    const documentToDelete = documents.find(d => d.id === documentId);
    if (!documentToDelete) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    // Eliminar archivo físico
    try {
      await fs.unlink(documentToDelete.filePath);
    } catch (error) {
      console.error('Error eliminando archivo físico:', error);
    }

    // Eliminar de metadata
    const updatedDocuments = documents.filter(d => d.id !== documentId);
    await saveDocuments(storagePath, updatedDocuments);

    // Re-consolidar textos
    await consolidateTexts(storagePath, updatedDocuments);

    res.json({ 
      success: true, 
      message: 'Documento eliminado correctamente' 
    });
  } catch (error) {
    console.error('Error eliminando documento:', error);
    res.status(500).json({ error: 'Error al eliminar documento' });
  }
});

/**
 * GET /clients/:clientId/documents/:phase/:folderType/:documentId/download
 * Descargar o visualizar un documento existente
 */
router.get('/clients/:clientId/documents/:phase/:folderType/:documentId/download', async (req, res) => {
  try {
    const { clientId, phase, folderType, documentId } = req.params;
    const storagePath = getStoragePath(clientId, phase, folderType);
    const documents = await readDocuments(storagePath);
    const document = documents.find((doc) => doc.id === documentId);

    if (!document) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    try {
      await fs.stat(document.filePath);
    } catch (error) {
      console.error('Archivo de documento no encontrado:', error);
      return res.status(404).json({ error: 'Archivo de documento no encontrado' });
    }

    res.setHeader('Content-Type', document.fileType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(document.fileName)}"`);
    res.sendFile(path.resolve(document.filePath));
  } catch (error) {
    console.error('Error descargando documento:', error);
    res.status(500).json({ error: 'Error al descargar documento' });
  }
});

/**
 * POST /clients/:clientId/documents/:phase/:folderType/regenerate
 * Regenerar texto consolidado de una carpeta específica
 */
router.post('/clients/:clientId/documents/:phase/:folderType/regenerate', async (req, res) => {
  try {
    const { clientId, phase, folderType } = req.params;
    const storagePath = getStoragePath(clientId, phase, folderType);
    
    const documents = await readDocuments(storagePath);
    await consolidateTexts(storagePath, documents);

    const consolidatedPath = path.join(storagePath, CONSOLIDATED_FILE);
    const data = await fs.readFile(consolidatedPath, 'utf-8');
    const consolidated: ConsolidatedText = JSON.parse(data);

    res.json({ 
      success: true, 
      consolidated,
      message: 'Texto consolidado regenerado correctamente' 
    });
  } catch (error) {
    console.error('Error regenerando texto consolidado:', error);
    res.status(500).json({ error: 'Error al regenerar texto consolidado' });
  }
});

export default router;

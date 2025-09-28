import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import OpenAI from "openai";
import { storage } from "./storage";

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/plain', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Mock jurisprudence database for demonstration
const mockPrecedents = [
  {
    id: "1",
    title: "Responsabilidad Civil por Daños en Obras de Construcción",
    court: "Corte Suprema de Justicia",
    chamber: "Sala Civil Transitoria",
    date: "15 Mar 2023",
    caseNumber: "CAS-2023-1845",
    bindingLevel: "ejecutoria_vinculante" as const,
    summary: "Se establece que el contratista es responsable por los daños causados por defectos en la construcción, incluso después de la entrega de la obra.",
    confidence: 95,
    articlesMatched: ["Art. 1969 CC", "Art. 1970 CC"],
    excerpt: "La responsabilidad del constructor no se extingue con la entrega de la obra, sino que subsiste por los daños que puedan manifestarse posteriormente por vicios ocultos."
  },
  {
    id: "2",
    title: "Incumplimiento Contractual en Contratos de Obra",
    court: "Corte Superior de Lima",
    chamber: "Primera Sala Civil",
    date: "22 Sep 2023",
    caseNumber: "EXP-2023-4567",
    bindingLevel: "relevante" as const,
    summary: "Análisis sobre los remedios disponibles ante el incumplimiento de obligaciones contractuales en contratos de construcción.",
    confidence: 88,
    articlesMatched: ["Art. 1321 CC", "Art. 1762 CC"],
    excerpt: "El incumplimiento de las obligaciones contractuales genera el derecho del acreedor a exigir la ejecución forzada o la resolución del contrato."
  },
  {
    id: "3",
    title: "Despido Arbitrario y Reposición Laboral",
    court: "Tribunal Constitucional",
    chamber: "Sala Primera",
    date: "10 Jun 2023",
    caseNumber: "EXP-2023-2890",
    bindingLevel: "ejecutoria_vinculante" as const,
    summary: "Criterios para determinar cuándo un despido es arbitrario y los remedios disponibles para el trabajador.",
    confidence: 92,
    articlesMatched: ["Art. 27 Const", "Art. 22 LPCL"],
    excerpt: "El despido es nulo cuando se funda en la discriminación por razón de sexo, raza, religión, opinión o idioma."
  }
];

// Function to extract text from different file types
async function extractTextFromFile(file: Express.Multer.File): Promise<string> {
  if (file.mimetype === 'text/plain') {
    return file.buffer.toString('utf-8');
  }
  
  // For PDF and Word documents, we would need additional libraries
  // For now, provide a clear error with actionable message
  const supportedFormats = {
    'application/pdf': 'PDF',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX'
  };
  
  const formatName = supportedFormats[file.mimetype as keyof typeof supportedFormats] || 'documento';
  throw new Error(`La extracción de texto de archivos ${formatName} aún no está implementada. Por favor, copie y pegue el texto del documento en el área de texto o use archivos .txt por ahora.`);
}

// Function to create a fallback analysis when OpenAI is not available
function createFallbackAnalysis(text: string) {
  const words = text.toLowerCase();
  
  // Basic keyword detection for legal areas
  const legalAreas = [];
  const keyLegalConcepts = [];
  const relevantArticles = [];
  const recommendations = [];
  const risks = [];
  
  if (words.includes('constructor') || words.includes('construcción') || words.includes('obra')) {
    legalAreas.push('Derecho Civil - Contratos');
    keyLegalConcepts.push('Responsabilidad contractual del constructor');
    keyLegalConcepts.push('Vicios ocultos en la construcción');
    relevantArticles.push('Art. 1762 CC', 'Art. 1969 CC', 'Art. 1970 CC');
    recommendations.push('Solicitar inspección técnica independiente');
    recommendations.push('Recopilar documentación del proyecto completo');
    risks.push('Prescripción de la acción (10 años)');
    risks.push('Dificultad probatoria del nexo causal');
  }
  
  if (words.includes('despido') || words.includes('laboral') || words.includes('trabajador')) {
    legalAreas.push('Derecho Laboral');
    keyLegalConcepts.push('Despido arbitrario');
    keyLegalConcepts.push('Estabilidad laboral');
    relevantArticles.push('Art. 27 Const', 'Art. 22 LPCL');
    recommendations.push('Evaluar si procede acción de amparo');
    risks.push('Plazos de caducidad de la acción');
  }
  
  if (words.includes('daños') || words.includes('perjuicios') || words.includes('responsabilidad')) {
    legalAreas.push('Derecho Civil - Responsabilidad');
    keyLegalConcepts.push('Responsabilidad por daños y perjuicios');
    relevantArticles.push('Art. 1969 CC', 'Art. 1985 CC');
    recommendations.push('Cuantificar correctamente el daño');
    risks.push('Demostración del nexo causal');
  }
  
  // Default values if no specific patterns found
  if (legalAreas.length === 0) {
    legalAreas.push('Derecho General');
    keyLegalConcepts.push('Análisis legal requerido');
    recommendations.push('Consultar con especialista en la materia');
    risks.push('Evaluar plazos procesales aplicables');
  }
  
  return {
    documentSummary: `Análisis automático del documento: Se ha identificado un caso que involucra ${legalAreas.join(', ')}. El documento presenta elementos que requieren evaluación legal especializada para determinar las mejores estrategias procesales.`,
    keyLegalConcepts,
    legalAreas,
    relevantArticles,
    recommendations,
    risks,
    confidence: 75
  };
}

// Function to analyze document with OpenAI (with fallback)
async function analyzeDocumentWithAI(text: string) {
  const prompt = `
Analiza el siguiente documento legal peruano y proporciona:

1. Un resumen ejecutivo del documento
2. Los conceptos legales clave identificados
3. Las áreas del derecho involucradas
4. Los artículos de ley que podrían ser relevantes (formato: "Art. XXX CC/CONST/etc")
5. Recomendaciones estratégicas para el caso
6. Riesgos legales identificados
7. Un nivel de confianza del análisis (0-100)

Documento a analizar:
${text}

Responde en formato JSON con la siguiente estructura:
{
  "documentSummary": "...",
  "keyLegalConcepts": ["concepto1", "concepto2"],
  "legalAreas": ["Derecho Civil", "Derecho Laboral"],
  "relevantArticles": ["Art. 1969 CC", "Art. 27 Const"],
  "recommendations": ["recomendación1", "recomendación2"],
  "risks": ["riesgo1", "riesgo2"],
  "confidence": 85
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "Eres un experto asistente legal especializado en el sistema jurídico peruano. Analiza documentos legales con precisión y proporciona recomendaciones estratégicas basadas en la jurisprudencia y legislación peruana."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No se recibió respuesta del análisis de IA');
    }

    // Try to parse JSON response
    try {
      return JSON.parse(content);
    } catch (e) {
      // If JSON parsing fails, create a structured response
      return {
        documentSummary: content,
        keyLegalConcepts: ["Análisis detallado disponible"],
        legalAreas: ["Derecho General"],
        relevantArticles: [],
        recommendations: ["Revisar análisis completo proporcionado"],
        risks: ["Consultar con especialista para validación"],
        confidence: 70
      };
    }
  } catch (error) {
    console.error('Error analyzing document with OpenAI:', error);
    
    // Check if it's a quota/rate limit error and provide fallback
    if (error instanceof Error && (error.message.includes('quota') || error.message.includes('rate') || error.message.includes('429'))) {
      console.log('Using fallback analysis due to OpenAI quota/rate limit');
      return {
        ...createFallbackAnalysis(text),
        note: 'Análisis realizado con sistema de respaldo. Para análisis completo con IA, verifique la configuración de OpenAI.'
      };
    }
    
    // For other errors, still provide fallback but indicate the issue
    console.log('Using fallback analysis due to OpenAI error');
    return {
      ...createFallbackAnalysis(text),
      note: 'Análisis realizado con sistema de respaldo debido a un error temporal del servicio de IA.'
    };
  }
}

// Function to find related precedents based on analysis
function findRelatedPrecedents(analysis: any): any[] {
  const searchTerms = [
    ...analysis.keyLegalConcepts.map((c: string) => c.toLowerCase()),
    ...analysis.legalAreas.map((a: string) => a.toLowerCase()),
    ...analysis.relevantArticles
  ];

  return mockPrecedents.filter(precedent => {
    const precedentText = [
      precedent.title.toLowerCase(),
      precedent.summary.toLowerCase(),
      precedent.excerpt.toLowerCase(),
      ...precedent.articlesMatched
    ].join(' ');

    return searchTerms.some(term => 
      precedentText.includes(term.toLowerCase()) ||
      term.toLowerCase().includes('civil') && precedentText.includes('civil') ||
      term.toLowerCase().includes('laboral') && precedentText.includes('laboral')
    );
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Document analysis endpoint
  app.post('/api/analyze-document', upload.single('file'), async (req, res) => {
    try {
      let documentText = '';

      // Get text from either file upload or direct text input
      if (req.file) {
        documentText = await extractTextFromFile(req.file);
      } else if (req.body.text) {
        documentText = req.body.text;
      } else {
        return res.status(400).json({ error: 'Se requiere un archivo o texto para analizar' });
      }

      if (!documentText.trim()) {
        return res.status(400).json({ error: 'El documento no contiene texto válido' });
      }

      // Analyze document with AI
      const analysis = await analyzeDocumentWithAI(documentText);
      
      // Find related precedents
      const precedentsFound = findRelatedPrecedents(analysis);

      // Combine analysis with precedents
      const result = {
        ...analysis,
        precedentsFound
      };

      res.json(result);
    } catch (error) {
      console.error('Error in document analysis:', error);
      
      // Handle file extraction errors (unsupported formats)
      if (error instanceof Error && error.message.includes('extracción de texto')) {
        return res.status(422).json({ 
          error: error.message,
          type: 'unsupported_file_format'
        });
      }
      
      // For other errors, try to provide fallback analysis if we have text
      if (req.body.text && req.body.text.trim()) {
        try {
          console.log('Attempting fallback analysis after error');
          const fallbackAnalysis = createFallbackAnalysis(req.body.text);
          const precedentsFound = findRelatedPrecedents(fallbackAnalysis);
          
          return res.json({
            ...fallbackAnalysis,
            precedentsFound,
            note: 'Análisis realizado con sistema de respaldo debido a un error temporal del servicio.'
          });
        } catch (fallbackError) {
          console.error('Fallback analysis also failed:', fallbackError);
        }
      }
      
      // If no fallback is possible, return user-friendly error
      let errorMessage = 'Error interno del servidor';
      
      if (error instanceof Error) {
        if (error.message.includes('quota') || error.message.includes('429')) {
          errorMessage = 'El servicio de análisis de IA ha alcanzado su límite temporal.';
        } else if (error.message.includes('conexión') || error.message.includes('network')) {
          errorMessage = 'Error de conexión con el servicio de IA. Intente nuevamente.';
        } else if (error.message.includes('texto válido')) {
          errorMessage = error.message;
        } else {
          errorMessage = 'No se pudo completar el análisis. Intente nuevamente.';
        }
      }
      
      res.status(500).json({ 
        error: errorMessage
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

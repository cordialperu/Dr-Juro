# 🤖 DR. JURO V5 - PLAN DE ARQUITECTURA CHATBOT-CÉNTRICA

## 🎯 VISIÓN V5
**Sistema de gestión legal centrado en un ChatBot experto que se nutre de TODO el contexto del cliente para brindar asesoría legal precisa basada en leyes peruanas.**

---

## 📋 ANÁLISIS: 3 CASOS MÁS COMPLETOS PARA MIGRAR

### 🥇 Caso #1: Proceso Penal - Estafa y Defraudación
**Cliente:** Fernando Vargas León
**Complejidad:** ALTA ⭐⭐⭐⭐⭐
**Documentos:** Denuncia, Declaración instructiva, Pruebas de descargo
**Fase:** Investigación (40%)
**Razón de selección:**
- Caso penal con alta complejidad jurídica
- Múltiples etapas procesales
- Requiere análisis profundo de jurisprudencia penal
- Ideal para demostrar capacidad del ChatBot en derecho penal

### 🥈 Caso #2: Impugnación de Resolución Administrativa SUNAT
**Cliente:** Roberto Silva Torres  
**Complejidad:** ALTA ⭐⭐⭐⭐⭐
**Documentos:** Resolución SUNAT, Estados financieros, Declaraciones juradas
**Fase:** Seguimiento (85%)
**Razón de selección:**
- Caso tributario con documentación extensa
- Resoluciones administrativas complejas
- Requiere conocimiento de normativa tributaria peruana
- Estado avanzado permite mostrar todo el ciclo

### 🥉 Caso #3: Acción de Amparo - Derechos Fundamentales
**Cliente:** Ana Lucía Perez
**Complejidad:** ALTA ⭐⭐⭐⭐
**Documentos:** Memoriales, Pruebas documentales, Testimoniales
**Fase:** Estrategia (50%)
**Razón de selección:**
- Caso constitucional
- Involucra derechos fundamentales
- Requiere análisis de jurisprudencia del TC
- Diversidad en tipos de documentos

---

## 🏗️ ARQUITECTURA V5: ESTRUCTURA DE DATOS

### 📁 Archivo Consolidado por Cliente: `client_knowledge_base.json`

```json
{
  "clientId": "uuid",
  "clientName": "Fernando Vargas León",
  "lastUpdated": "2025-11-18T10:30:00Z",
  "metadata": {
    "totalDocuments": 47,
    "totalSearches": 23,
    "knowledgeBaseSize": "2.3MB",
    "lastChatInteraction": "2025-11-18T09:15:00Z"
  },
  
  "clientInfo": {
    "personal": { /* datos personales */ },
    "contact": { /* contacto */ },
    "timeline": [ /* eventos importantes */ ]
  },
  
  "cases": [
    {
      "caseId": "uuid",
      "title": "Proceso Penal - Estafa",
      "status": "active",
      "phase": "investigation",
      "completion": 40,
      "legalAreas": ["Derecho Penal", "Delitos Económicos"],
      "relevantArticles": ["Art. 196 CP", "Art. 197 CP"],
      "summary": "Cliente acusado de estafa agravada...",
      "timeline": [ /* cronología del caso */ ]
    }
  ],
  
  "documents": {
    "byPhase": {
      "investigacion": [
        {
          "id": "doc_123",
          "filename": "Denuncia_Fiscal.pdf",
          "uploadDate": "2025-10-15",
          "extractedText": "TEXTO COMPLETO EXTRAÍDO...",
          "summary": "Denuncia presentada por...",
          "relevantLaws": ["Art. 196 CP"],
          "keywords": ["estafa", "defraudación", "perjuicio económico"],
          "fileSize": 145000,
          "pageCount": 5
        }
      ],
      "estrategia": [ /* ... */ ],
      "reunion": [ /* ... */ ],
      "seguimiento": [ /* ... */ ]
    },
    "byType": {
      "denuncias": [ /* ... */ ],
      "resoluciones": [ /* ... */ ],
      "pruebas": [ /* ... */ ]
    }
  },
  
  "searches": {
    "jurisprudence": [
      {
        "query": "estafa agravada jurisprudencia",
        "date": "2025-11-10",
        "results": [ /* precedentes encontrados */ ],
        "relevantCases": ["CAS 2021-1543", "CAS 2019-876"]
      }
    ],
    "legislation": [
      {
        "query": "delitos económicos código penal",
        "results": [ /* artículos relevantes */ ]
      }
    ],
    "doctrine": [ /* búsquedas en doctrina */ ]
  },
  
  "financialInfo": {
    "budget": 15000,
    "paid": 8000,
    "pending": 7000,
    "payments": [ /* historial de pagos */ ],
    "invoices": [ /* facturas generadas */ ]
  },
  
  "meetings": [
    {
      "date": "2025-11-05",
      "type": "initial_consultation",
      "notes": "Cliente muy preocupado por...",
      "agreements": [ /* acuerdos tomados */ ],
      "nextSteps": [ /* siguientes pasos */ ]
    }
  ],
  
  "chatHistory": [
    {
      "timestamp": "2025-11-18T09:15:00Z",
      "question": "¿Qué precedentes hay sobre estafa agravada?",
      "answer": "Según la jurisprudencia peruana...",
      "sources": ["CAS 2021-1543", "doc_123"],
      "confidence": 0.92
    }
  ],
  
  "aiAnalysis": {
    "caseStrength": "MEDIA-ALTA",
    "risks": [
      "Insuficiencia probatoria en elemento subjetivo",
      "Contradicciones en testimoniales"
    ],
    "recommendations": [
      "Solicitar pericias contables adicionales",
      "Reforzar teoría del caso con precedentes del TC"
    ],
    "relevantPrecedents": [ /* precedentes aplicables */ ]
  },
  
  "consolidatedText": {
    "fullContext": "TEXTO COMPLETO CONSOLIDADO DE TODOS LOS DOCUMENTOS...",
    "tokenCount": 45000,
    "lastUpdate": "2025-11-18T10:30:00Z",
    "summary": "Resumen ejecutivo de todo el caso..."
  }
}
```

---

## 🔢 ORDEN DE PRIORIDADES

### 🎯 FASE 1: INFRAESTRUCTURA DE DATOS (Semana 1)
**Prioridad: CRÍTICA** ⭐⭐⭐⭐⭐

1. **Crear sistema de archivo consolidado**
   - Migrar estructura actual a `client_knowledge_base.json`
   - Sistema de actualización incremental (no regenerar todo cada vez)
   - Versionado de archivos de conocimiento
   - Compresión eficiente para archivos grandes

2. **Optimizar extracción y consolidación de texto**
   - Mejorar extractor de PDFs (usar pdf-parse + Tesseract para imágenes)
   - Extraer texto de imágenes con OCR
   - Procesar Word, Excel, emails
   - Indexación semántica para búsqueda rápida

3. **Sistema de actualización automática**
   - Webhook que actualiza knowledge base cuando:
     - Se sube un documento
     - Se registra una búsqueda
     - Se actualiza información del caso
     - Se realiza un pago
     - Se tiene una reunión

---

### 🤖 FASE 2: CHATBOT INTELIGENTE (Semana 2)
**Prioridad: CRÍTICA** ⭐⭐⭐⭐⭐

1. **Implementar ChatBot con contexto completo**
   - Usar Gemini 2.0 Flash con contexto largo (1M tokens)
   - Cargar `client_knowledge_base.json` completo en cada consulta
   - Sistema de caché para consultas frecuentes
   - Streaming de respuestas para velocidad percibida

2. **Prompt Engineering especializado en derecho peruano**
   ```
   Eres Dr. Juro, un experto en derecho peruano con especialización en:
   - Constitución Política del Perú
   - Código Civil y Código Penal
   - Jurisprudencia del Tribunal Constitucional
   - Precedentes vinculantes de la Corte Suprema
   - Normativa tributaria, laboral, comercial
   
   Tienes acceso a TODO el contexto del cliente: [KNOWLEDGE BASE]
   
   Responde con:
   1. Análisis legal preciso
   2. Citas de artículos relevantes
   3. Precedentes aplicables
   4. Recomendaciones estratégicas
   5. Advertencias de riesgos
   ```

3. **Sistema de referencias y fuentes**
   - Cada respuesta debe citar documentos específicos
   - Links a precedentes mencionados
   - Referencias a artículos de ley
   - Tracking de qué información usó el ChatBot

4. **Análisis automático de documentos**
   - Al subir documento, AI lo analiza y genera:
     - Resumen ejecutivo
     - Artículos legales relevantes
     - Precedentes relacionados
     - Puntos clave para el caso
     - Posibles riesgos u oportunidades

---

### ⚡ FASE 3: OPTIMIZACIÓN DE VELOCIDAD (Semana 3)
**Prioridad: ALTA** ⭐⭐⭐⭐

1. **Caché inteligente**
   - Redis para consultas frecuentes
   - Cache de knowledge base en memoria
   - Invalidación selectiva (solo lo que cambió)

2. **Lazy loading y paginación**
   - Cargar documentos bajo demanda
   - Virtualización de listas largas
   - Infinite scroll optimizado

3. **Índices de búsqueda**
   - Elasticsearch o Meilisearch para búsqueda full-text
   - Vector embeddings para búsqueda semántica
   - Búsqueda instantánea tipo-ahead

4. **Optimización de UI**
   - React.memo en componentes pesados
   - Suspense para loading states
   - Web Workers para procesamiento en background

---

### 🔍 FASE 4: BÚSQUEDA Y RECOPILACIÓN (Semana 4)
**Prioridad: ALTA** ⭐⭐⭐⭐

1. **Integrar búsquedas al knowledge base**
   - Guardar cada búsqueda de jurisprudencia
   - Almacenar precedentes encontrados
   - Relacionar búsquedas con casos específicos
   - Timeline de investigación legal

2. **Sistema de recomendaciones proactivas**
   - AI sugiere búsquedas basadas en el caso
   - Notifica cuando hay nuevo precedente relevante
   - Alerta de cambios en legislación aplicable

3. **Integración con herramientas existentes**
   - Metabuscador → guardar resultados en knowledge base
   - UNMSM → vincular tesis con casos
   - Doctrina → almacenar extractos relevantes

---

### 💼 FASE 5: INTERFACE OPTIMIZADA (Semana 5)
**Prioridad: MEDIA** ⭐⭐⭐

1. **Dashboard centrado en ChatBot**
   - ChatBot siempre visible (sidebar o floating)
   - Resumen ejecutivo del caso en header
   - Métricas clave: docs, búsquedas, completitud
   - Timeline visual del proceso

2. **Vista unificada de información**
   - Single page app con tabs
   - Todo accesible sin cambiar de vista
   - Drag & drop para organizar
   - Comandos de teclado para power users

3. **Visualización de relaciones**
   - Graph de documentos relacionados
   - Timeline interactiva
   - Mapa de precedentes aplicables
   - Red de artículos legales citados

---

## 📊 MÉTRICAS DE ÉXITO

### Velocidad
- ✅ Carga inicial < 2 segundos
- ✅ Respuesta ChatBot < 3 segundos
- ✅ Búsqueda < 500ms
- ✅ Upload documento < 5 segundos

### Calidad ChatBot
- ✅ 95% de respuestas con fuentes citadas
- ✅ 90% de satisfacción del usuario
- ✅ 100% de documentos analizados automáticamente

### Recopilación de Información
- ✅ Todos los documentos procesados y en knowledge base
- ✅ Todas las búsquedas almacenadas
- ✅ 100% de información financiera integrada
- ✅ Timeline completa del caso

---

## 🔧 STACK TECNOLÓGICO V5

### Backend
- **Node.js + Express** (mantener)
- **PostgreSQL** (Neon) para datos estructurados
- **Redis** para caché
- **Elasticsearch/Meilisearch** para búsqueda

### AI/ML
- **Gemini 2.0 Flash** (contexto largo 1M tokens)
- **OpenAI** (backup)
- **pdf-parse + Tesseract.js** para OCR
- **Vector embeddings** para búsqueda semántica

### Frontend
- **React 18** (mantener)
- **TanStack Query v5** (mantener)
- **Zustand** para estado global (agregar)
- **Framer Motion** para animaciones

### Storage
- **Sistema de archivos** para documentos
- **JSON** para knowledge base
- **S3-compatible** para backups

---

## 📝 LISTA DE TAREAS DETALLADA

### Sprint 1: Fundamentos (Semana 1)
```
☐ Crear schema para client_knowledge_base.json
☐ Migrar 3 casos seleccionados a nueva estructura
☐ Implementar sistema de consolidación de texto
☐ Crear servicio de actualización automática
☐ Optimizar extracción de texto PDF
☐ Agregar OCR para imágenes
☐ Sistema de versionado de knowledge base
☐ Pruebas de carga con archivos grandes
```

### Sprint 2: ChatBot (Semana 2)
```
☐ Integrar Gemini 2.0 Flash
☐ Crear prompt engineering especializado
☐ Implementar sistema de contexto completo
☐ Sistema de citas y referencias
☐ Streaming de respuestas
☐ Análisis automático de documentos nuevos
☐ UI del ChatBot mejorada
☐ Historial de conversaciones persistente
```

### Sprint 3: Performance (Semana 3)
```
☐ Implementar Redis cache
☐ Índices de búsqueda
☐ Lazy loading en listas
☐ React.memo en componentes críticos
☐ Web Workers para procesamiento
☐ Optimización de bundle size
☐ Service Worker para offline
☐ Métricas de performance
```

### Sprint 4: Búsqueda (Semana 4)
```
☐ Integrar búsquedas a knowledge base
☐ Timeline de investigación
☐ Sistema de recomendaciones
☐ Búsqueda semántica
☐ Alertas proactivas
☐ Relacionar precedentes con casos
```

### Sprint 5: UI/UX (Semana 5)
```
☐ Rediseñar dashboard
☐ ChatBot siempre visible
☐ Vista unificada
☐ Visualización de relaciones
☐ Comandos de teclado
☐ Modo oscuro optimizado
☐ Responsive mobile
☐ Testing de usabilidad
```

---

## 🚀 INICIO RÁPIDO V5

### Paso 1: Clonar proyecto actual
```bash
cd /Users/m2dt/Downloads
cp -r DrJuro DrJuro-v5
cd DrJuro-v5
```

### Paso 2: Limpiar y preparar
```bash
# Mantener solo los 3 casos seleccionados
# Crear nueva estructura de carpetas
mkdir -p server/services/knowledge-base
mkdir -p server/services/chatbot
mkdir -p storage/knowledge-bases
```

### Paso 3: Instalar dependencias nuevas
```bash
npm install @langchain/core @langchain/google-genai
npm install meilisearch redis ioredis
npm install pdf-parse tesseract.js
npm install zustand
```

### Paso 4: Implementar paso a paso según sprints

---

## 🎯 OBJETIVO FINAL

**Un sistema donde el abogado pueda:**
1. Subir cualquier documento y sea automáticamente analizado
2. Hacer cualquier pregunta sobre el caso al ChatBot
3. Recibir respuestas precisas con citas legales exactas
4. Ver todo el contexto del cliente en un solo lugar
5. Obtener recomendaciones estratégicas basadas en IA
6. Navegar todo de forma rápida y fluida

**El ChatBot debe ser capaz de:**
- Citar artículos específicos del código penal/civil
- Referenciar precedentes vinculantes
- Analizar fortalezas y debilidades del caso
- Sugerir estrategias legales
- Alertar sobre riesgos
- Generar documentos legales
- Resumir expedientes completos
- Responder preguntas complejas de derecho peruano

---

## 📌 NOTAS IMPORTANTES

- ✅ Mantener versión actual (v4) funcionando en producción
- ✅ V5 se desarrolla en paralelo en nueva carpeta
- ✅ Migración gradual de funcionalidades
- ✅ Testing exhaustivo antes de reemplazar v4
- ✅ Backup de datos antes de cualquier migración
- ✅ Documentar todo el proceso

---

**Fecha de creación:** 18 de noviembre de 2025
**Versión:** 1.0
**Estado:** En planificación

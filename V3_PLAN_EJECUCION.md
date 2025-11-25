# 🚀 Dr. Juro V3 - Plan de Ejecución Detallado
## Cliente-Céntrico Total | Implementación Completa

**Fecha**: 15 de Noviembre, 2024  
**Objetivo**: Aplicación 100% cliente-céntrica, navegación simple, código limpio

---

## 📊 ESTADO ACTUAL (Auditoría)

### Componentes Actuales (48 archivos .tsx)
```
✅ MANTENER Y MIGRAR (10):
1. ClientSelector.tsx → Mejorar diseño
2. LegalProcessV2.tsx → Migrar a CaseDetail
3. DocumentAnalysis.tsx → Integrar en Herramientas
4. ClientsPage.tsx → Usar en modal selector
5. TasksPage.tsx → Base para Tasks V3
6. DocumentosPage.tsx → Base para Documents V3
7. CasesPage.tsx → Base para Cases V3
8. ClientWorkspaceLayout.tsx → Rediseñar completo
9. ThemeToggle.tsx → Mantener
10. LoginForm.tsx → Mantener

❌ ELIMINAR (38):
1. WorkflowToggle.tsx - sin modos
2. AppSidebar.tsx - reemplazar por tabs
3. MobileBottomNav.tsx - reemplazar por tabs
4. CommandPalette.tsx - simplificar navegación
5. Dashboard.tsx - solo existe client dashboard
6. ProcesoFasePage.tsx - legacy (2227 líneas)
7. ProcesoFasePage.tsx.backup2 - backup
8. ProcesoFasePage.tsx.old - backup
9. ProcesoFasePageRefactored.tsx - legacy
10. ProcesosPage.tsx - legacy
11. ProcessPage.tsx - legacy
12. CaseHubPage.tsx - legacy
13. CaseDetailsPage.tsx - reemplazar con CaseDetail V3
14. ExpedientesPage.tsx - vista global no necesaria
15. JurisprudenciaPage.tsx - integrar en Herramientas
16. DoctrinaPage.tsx - integrar en Herramientas
17. MetaBuscadorPage.tsx - integrar en Herramientas
18. AIAnalysisModal.tsx - rediseñar
19. AnalysisToolbar.tsx - rediseñar
20. Breadcrumbs.tsx - nuevo diseño
21. CaseCard.tsx - rediseñar
22. CaseDashboard.tsx - rediseñar
23. CaseTimeline.tsx - integrar en CaseDetail
24. ClientContactForm.tsx - integrar en Dashboard
25. ClientForm.tsx - integrar en ClientSelector
26. DoctrinaList.tsx - integrar en Herramientas
27. DocumentFolderManager.tsx - rediseñar
28. ExportPdfButton.tsx - integrar en acciones
29. FileUploadZone.tsx - rediseñar
30. FolderDetailView.tsx - rediseñar
31. GlobalSearch.tsx - eliminar
32. NotesPanel.tsx - integrar en CaseDetail
33. PrecedentCard.tsx - integrar en Herramientas
34. SearchFilters.tsx - eliminar
35. TagManager.tsx - integrar en CaseDetail
36. AlertsPanel.tsx - rediseñar
37. examples/ - carpeta de ejemplos
38. __tests__/ - migrar luego
```

### Contextos Actuales
```
✅ MANTENER:
- UnifiedClientContext.tsx → Renombrar a ClientContext.tsx

❌ ELIMINAR:
- WorkflowModeContext.tsx
```

### Rutas Actuales (~25 rutas)
```
❌ ELIMINAR TODAS, crear 6 nuevas:
- /
- /client/:id
- /client/:id/cases
- /client/:id/tasks
- /client/:id/documents
- /client/:id/tools
```

---

## 🏗️ ESTRUCTURA V3 FINAL

```
client/src/
├── App.tsx (V3 - router simple)
├── main.tsx (sin cambios)
├── index.css (sin cambios)
│
├── contexts/
│   └── ClientContext.tsx (renombrado de UnifiedClientContext)
│
├── layouts/
│   ├── ClientWorkspaceLayout.tsx (V3 - header + tabs)
│   └── AuthLayout.tsx (para login)
│
├── pages/
│   ├── ClientSelector.tsx (modal mejorado)
│   ├── Dashboard.tsx (V3 - vista principal)
│   ├── Cases.tsx (V3 - lista de casos)
│   ├── CaseDetail.tsx (V3 - caso individual con 5 fases)
│   ├── Tasks.tsx (V3 - tareas del cliente)
│   ├── Documents.tsx (V3 - repositorio)
│   ├── Tools.tsx (V3 - herramientas IA)
│   ├── Login.tsx (wrapper de LoginForm)
│   └── NotFound.tsx (404)
│
├── components/
│   ├── shared/ (componentes comunes)
│   │   ├── Header.tsx
│   │   ├── Tabs.tsx
│   │   ├── ClientDropdown.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── UserMenu.tsx
│   │
│   ├── case/ (componentes de casos)
│   │   ├── CaseCard.tsx (V3)
│   │   ├── CasePhases.tsx (5 fases)
│   │   ├── PhaseDocuments.tsx
│   │   └── CaseTasks.tsx
│   │
│   ├── tasks/ (componentes de tareas)
│   │   ├── TaskList.tsx
│   │   ├── TaskCard.tsx
│   │   ├── TaskForm.tsx
│   │   └── TaskFilters.tsx
│   │
│   ├── documents/ (componentes de documentos)
│   │   ├── DocumentTree.tsx
│   │   ├── DocumentUploader.tsx
│   │   ├── DocumentCard.tsx
│   │   └── DocumentViewer.tsx
│   │
│   ├── tools/ (herramientas IA)
│   │   ├── DocumentAnalyzer.tsx
│   │   ├── PDFSearcher.tsx
│   │   ├── JurisprudenceSearch.tsx
│   │   ├── DoctrineSearch.tsx
│   │   └── MetaSearcher.tsx
│   │
│   └── ui/ (shadcn - sin cambios)
│
├── hooks/
│   ├── useClient.ts (del contexto)
│   ├── useCases.ts
│   ├── useTasks.ts
│   ├── useDocuments.ts
│   └── useAI.ts
│
└── lib/ (sin cambios)
```

---

## 🎯 ORDEN DE IMPLEMENTACIÓN

### **SPRINT 1: Fundamentos (2-3 horas)**
#### 1.1 Contexto (30 min)
- [ ] Renombrar `UnifiedClientContext.tsx` → `ClientContext.tsx`
- [ ] Simplificar API del contexto
- [ ] Agregar helpers: `getCases()`, `getTasks()`, `getDocuments()`
- [ ] Testing del contexto

#### 1.2 Layout Base (45 min)
- [ ] Crear `layouts/ClientWorkspaceLayout.tsx` V3
  - Header fijo con: Logo | ClientDropdown | Tools button | Notifications | UserMenu
  - Tabs horizontales: Dashboard | Casos | Tareas | Docs | Herramientas
- [ ] Crear `components/shared/Header.tsx`
- [ ] Crear `components/shared/Tabs.tsx`
- [ ] Crear `components/shared/ClientDropdown.tsx`

#### 1.3 Routing (45 min)
- [ ] Crear `App.tsx` V3 simplificado
- [ ] Implementar 6 rutas principales
- [ ] Agregar redirects
- [ ] Testing de navegación

---

### **SPRINT 2: Dashboard + ClientSelector (2 horas)**
#### 2.1 ClientSelector Mejorado (60 min)
- [ ] Rediseñar `pages/ClientSelector.tsx`
  - Modal elegante centrado
  - Búsqueda inteligente
  - Clientes recientes (top 5)
  - Botón "Nuevo Cliente" inline
- [ ] Integrar con ClientContext
- [ ] Testing de selección

#### 2.2 Dashboard V3 (60 min)
- [ ] Crear `pages/Dashboard.tsx` V3
  - Sección: Resumen del cliente (card)
  - Sección: Casos activos (3 cards)
  - Sección: Próximas tareas (5 items)
  - Sección: Documentos recientes (lista)
  - Sección: Actividad reciente (timeline)
- [ ] Crear componentes helpers
- [ ] Testing del dashboard

---

### **SPRINT 3: Cases (3 horas)**
#### 3.1 Lista de Casos (60 min)
- [ ] Crear `pages/Cases.tsx` V3
  - Lista de casos del cliente
  - Botón "Nuevo Caso"
  - Búsqueda/filtros
- [ ] Crear `components/case/CaseCard.tsx` V3
- [ ] Integrar con API

#### 3.2 CaseDetail (120 min)
- [ ] Crear `pages/CaseDetail.tsx` V3
- [ ] Migrar lógica de `LegalProcessV2.tsx`
- [ ] Crear `components/case/CasePhases.tsx` (5 fases)
- [ ] Crear `components/case/PhaseDocuments.tsx`
- [ ] Crear `components/case/CaseTasks.tsx`
- [ ] Sistema de navegación entre fases
- [ ] Testing completo

---

### **SPRINT 4: Tasks (1.5 horas)**
#### 4.1 Tasks V3 (90 min)
- [ ] Crear `pages/Tasks.tsx` V3
- [ ] Crear `components/tasks/TaskList.tsx`
- [ ] Crear `components/tasks/TaskCard.tsx`
- [ ] Crear `components/tasks/TaskForm.tsx` (CRUD)
- [ ] Crear `components/tasks/TaskFilters.tsx`
- [ ] Vinculación con casos
- [ ] Testing CRUD

---

### **SPRINT 5: Documents (2 horas)**
#### 5.1 Documents V3 (120 min)
- [ ] Crear `pages/Documents.tsx` V3
- [ ] Crear `components/documents/DocumentTree.tsx`
  - Carpetas por caso
  - Carpetas por fase
  - Carpetas generales
- [ ] Crear `components/documents/DocumentUploader.tsx`
  - Drag & drop
  - Progress bar
  - Multi-upload
- [ ] Crear `components/documents/DocumentCard.tsx`
  - Preview
  - Context menu (Analizar, Descargar, Eliminar)
- [ ] Integrar búsqueda
- [ ] Testing de upload

---

### **SPRINT 6: Herramientas IA (2.5 horas)**
#### 6.1 Tools Page (30 min)
- [ ] Crear `pages/Tools.tsx` V3
  - Layout en grid de 5 herramientas
  - Cada herramienta en card expandible

#### 6.2 Herramientas Individuales (120 min)
- [ ] Crear `components/tools/DocumentAnalyzer.tsx`
  - Migrar de `DocumentAnalysis.tsx`
  - Integrar Gemini
  - Contextualizar al cliente
- [ ] Crear `components/tools/PDFSearcher.tsx`
  - Búsqueda semántica en PDFs del cliente
- [ ] Crear `components/tools/JurisprudenceSearch.tsx`
  - Migrar de `JurisprudenciaPage.tsx`
- [ ] Crear `components/tools/DoctrineSearch.tsx`
  - Migrar de `DoctrinaPage.tsx`
- [ ] Crear `components/tools/MetaSearcher.tsx`
  - Migrar de `MetaBuscadorPage.tsx`

#### 6.3 Testing (30 min)
- [ ] Testing de cada herramienta
- [ ] Verificar contextualización

---

### **SPRINT 7: Limpieza (1.5 horas)**
#### 7.1 Eliminar Legacy (60 min)
- [ ] Borrar 38 componentes obsoletos
- [ ] Borrar `WorkflowModeContext.tsx`
- [ ] Limpiar imports en archivos
- [ ] Verificar que no hay referencias rotas

#### 7.2 Optimización (30 min)
- [ ] Code splitting (React.lazy)
- [ ] Optimizar imports
- [ ] Verificar bundle size

---

### **SPRINT 8: Testing Final (1.5 horas)**
#### 8.1 Testing End-to-End (90 min)
- [ ] Flujo 1: Seleccionar cliente → Dashboard
- [ ] Flujo 2: Crear caso → Subir documento
- [ ] Flujo 3: Analizar documento con IA
- [ ] Flujo 4: Crear tarea vinculada a caso
- [ ] Flujo 5: Navegar entre tabs sin perder contexto
- [ ] Flujo 6: Cambiar de cliente → Verificar persistencia
- [ ] Flujo 7: Refresh página → Cliente se mantiene
- [ ] Testing mobile (responsive)

---

## 📋 CHECKLIST FINAL

### Funcionalidad
- [ ] ClientSelector funciona (búsqueda + recientes)
- [ ] Dashboard muestra resumen completo
- [ ] Casos: Crear, ver, editar, fases funcionales
- [ ] Tareas: CRUD completo + filtros
- [ ] Documentos: Upload, organización, búsqueda
- [ ] Herramientas IA: 5 herramientas funcionan

### Navegación
- [ ] Tabs cambien sin reload
- [ ] Cliente persiste en todas las páginas
- [ ] URLs amigables y cortas
- [ ] Máximo 2 clics para cualquier acción

### Código
- [ ] 0 errores TypeScript
- [ ] 0 warnings relevantes
- [ ] -60% líneas de código vs V2
- [ ] Estructura de carpetas lógica

### UX
- [ ] Responsive (mobile, tablet, desktop)
- [ ] Loading states en todas las acciones
- [ ] Error handling apropiado
- [ ] Toast notifications
- [ ] Animaciones sutiles

---

## 🎯 MÉTRICAS DE ÉXITO

| Métrica | V2 (Actual) | V3 (Meta) | Reducción |
|---------|-------------|-----------|-----------|
| Componentes | 48 | 25 | -48% |
| Rutas principales | 25 | 6 | -76% |
| Contextos | 2 | 1 | -50% |
| Líneas de código | ~15,000 | ~6,000 | -60% |
| Clics para acción | 3-5 | 1-2 | -60% |
| Tiempo aprendizaje | 30 min | 5 min | -83% |

---

## 🚀 COMENZAMOS

**Hora de inicio**: Ahora  
**Tiempo estimado**: 12-15 horas  
**Método**: Implementación continua sin parar

**NO PARAR HASTA COMPLETAR V3** ✅

---

**Preparado por**: GitHub Copilot (Claude Sonnet 4.5)  
**Metodología**: Arquitectura iterativa + TDD + User-Centric Design

# 🏛️ Dr. Juro - Versión 4: Arquitectura Proceso-Céntrica

**Fecha**: 15 de noviembre de 2025  
**Versión**: 4.0.0  
**Filosofía**: El proceso legal de 7 etapas es la columna vertebral de la aplicación

---

## 🎯 Filosofía V4

> **"Un cliente, un caso, un proceso completo de principio a fin"**

### Principios Fundamentales

1. **Proceso como Navegación Principal**
   - Las 7 etapas del proceso legal son la estructura de navegación
   - Todo gira en torno a seguir el caso de principio a fin
   - No es un gestor de casos, es una **guía procesal completa**

2. **Vista Global + Vista Detallada**
   - **Dashboard Global**: Vista panorámica del caso (resumen, próximas audiencias, documentos clave)
   - **Proceso Detallado**: Navegación por las 7 etapas con toda la información

3. **Notificaciones y Calendario**
   - Sistema de alertas de audiencias
   - Recordatorios de citas con jueces, fiscales, vocales
   - Integración WhatsApp para notificaciones

4. **Herramientas Contextuales**
   - Las herramientas IA se integran en el flujo del proceso
   - Disponibles desde cada etapa según el contexto

---

## 🏗️ Arquitectura de Navegación

```
┌─────────────────────────────────────────────────────────────┐
│  ClientSelector                                              │
│  Selecciona el cliente con el que vas a trabajar            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Dashboard Global del Caso                                   │
│  • Información del Cliente + Imputado                        │
│  • Resumen del Estado del Caso                              │
│  • Próximas Audiencias (calendario)                         │
│  • Documentos Clave                                         │
│  • Estado Actual del Proceso                                │
│  • Acceso Rápido a las 7 Etapas                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  PROCESO LEGAL (7 ETAPAS) - COLUMNA VERTEBRAL               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Tab 1: Dashboard del Proceso                         │  │
│  │  • Estado general                                    │  │
│  │  • Línea de tiempo                                  │  │
│  │  • Resumen de cada etapa                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Tab 2: Intervinientes                                │  │
│  │  • Defensor, Cliente, Imputado                       │  │
│  │  • Fiscal, Juez, Vocales                           │  │
│  │  • Testigos, Peritos, Agraviados                   │  │
│  │  • Contactos y notas de cada uno                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Tab 3: Expediente (7 Carpetas de Documentos)        │  │
│  │  1. 📁 Documentos Generales / Cliente               │  │
│  │  2. 📁 Investigación Preparatoria                   │  │
│  │  3. 📁 Etapa Intermedia                             │  │
│  │  4. 📁 Juicio Oral                                  │  │
│  │  5. 📁 Apelación (2da Instancia)                    │  │
│  │  6. 📁 Casación (Corte Suprema)                     │  │
│  │  7. 📁 Ejecución                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Tab 4: Hitos del Proceso                             │  │
│  │  • Timeline de eventos importantes                   │  │
│  │  • Audiencias (pasadas y futuras)                   │  │
│  │  • Sentencias y resoluciones                        │  │
│  │  • Primera, Segunda Instancia, Casación            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Tab 5: Estrategia Legal                              │  │
│  │  • Teoría del caso                                   │  │
│  │  • Análisis de hechos                               │  │
│  │  • Objetivos y estrategia                           │  │
│  │  • Notas privadas                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Tab 6: Control Financiero                            │  │
│  │  • Honorarios                                        │  │
│  │  • Gastos del proceso                               │  │
│  │  • Reparación civil                                 │  │
│  │  • Registro de pagos                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Tab 7: Reportes                                      │  │
│  │  • Exportar PDF completo                             │  │
│  │  • Cronología del caso                              │  │
│  │  • Estado procesal                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  HERRAMIENTAS DE ANÁLISIS (Contextuales)                    │
│  • Análisis de Documentos                                   │
│  • Búsqueda en PDFs                                        │
│  • Jurisprudencia                                          │
│  • Doctrina                                                │
│  • Meta-buscador                                           │
│  → Accesibles desde cualquier etapa del proceso           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 Flujo de Usuario V4

### 1. Entrada al Sistema
```
Usuario → Login → ClientSelector
```

### 2. Selección de Cliente
```
ClientSelector 
  ├─ Ver lista de clientes
  ├─ Buscar por nombre
  ├─ Crear nuevo cliente
  └─ Seleccionar → Ir a Dashboard Global
```

### 3. Dashboard Global (Vista Panorámica)
```
Dashboard Global del Caso
  ├─ 📋 Información del Cliente
  │   ├─ Nombre, Email, WhatsApp
  │   ├─ Botón "Enviar notificación" (WhatsApp)
  │   └─ Datos del Imputado (si es diferente)
  │
  ├─ 📊 Estado del Caso
  │   ├─ Número de expediente
  │   ├─ Tipo de caso (Penal, Civil, etc.)
  │   ├─ Etapa actual
  │   └─ Estado de resolución
  │
  ├─ 📅 Próximas Audiencias
  │   ├─ Fecha y hora
  │   ├─ Tipo de audiencia
  │   ├─ Juez/Sala
  │   └─ Alertas/Recordatorios
  │
  ├─ 📂 Documentos Recientes
  │   └─ Últimos 5 documentos subidos
  │
  ├─ 🎯 Acceso Rápido a Etapas
  │   ├─ Botón "Ir a Etapa 1: Documentos Generales"
  │   ├─ Botón "Ir a Etapa 2: Investigación"
  │   ├─ ...
  │   └─ Botón "Ir a Etapa 7: Ejecución"
  │
  └─ ✨ Botón Principal: "Ir al Proceso Completo"
```

### 4. Proceso Legal (Navegación Principal)
```
Proceso Legal (7 Tabs)
  │
  ├─ Tab 1: Dashboard
  │   └─ Vista consolidada de todo el proceso
  │
  ├─ Tab 2: Intervinientes
  │   └─ Gestión de todas las partes del proceso
  │
  ├─ Tab 3: Expediente (7 Carpetas)
  │   ├─ Upload de documentos por etapa
  │   ├─ Categorización
  │   └─ Búsqueda y filtrado
  │
  ├─ Tab 4: Hitos
  │   └─ Timeline de eventos + Audiencias
  │
  ├─ Tab 5: Estrategia
  │   └─ Teoría del caso + Estrategia legal
  │
  ├─ Tab 6: Financiero
  │   └─ Control de honorarios y gastos
  │
  └─ Tab 7: Reportes
      └─ Exportar PDF completo del caso
```

### 5. Sistema de Notificaciones
```
Notificaciones
  ├─ Alertas de Audiencias (7 días antes, 1 día antes)
  ├─ Recordatorios de Citas
  ├─ Notificaciones WhatsApp
  └─ Emails automáticos
```

---

## 🔧 Componentes Core V4

### 1. `ClientSelector.tsx`
- Lista de clientes
- Búsqueda y filtrado
- Crear nuevo cliente
- Redirección a Dashboard Global

### 2. `DashboardGlobal.tsx` (NUEVO)
**Propósito**: Vista panorámica del caso completo
```tsx
<DashboardGlobal clientId={clientId}>
  <ClientInfo />
  <CaseStatus />
  <UpcomingHearings />
  <RecentDocuments />
  <QuickAccessToStages />
  <CTAButton: "Ir al Proceso Completo" />
</DashboardGlobal>
```

### 3. `ProcesoLegal.tsx` (ADAPTADO de LegalProcessV2.tsx)
**Propósito**: Navegación por las 7 etapas
- Ya implementado (1478 líneas)
- Tiene todo: intervinientes, documentos, hitos, estrategia, financiero, reportes
- Solo necesita adaptaciones UI/UX y mejoras en notificaciones

### 4. `AudienciaCalendar.tsx` (NUEVO)
**Propósito**: Gestión de audiencias y notificaciones
```tsx
<AudienciaCalendar>
  <CalendarView />
  <UpcomingHearings />
  <NotificationSettings />
  <WhatsAppIntegration />
</AudienciaCalendar>
```

### 5. `Tools.tsx` (EXISTENTE, adaptar)
**Propósito**: Herramientas IA contextuales
- Análisis de documentos
- Búsqueda en PDFs
- Jurisprudencia
- Doctrina
- Meta-buscador

---

## 🗺️ Rutas V4

```typescript
// App.tsx V4
<Routes>
  <Route path="/" component={ClientSelector} />
  
  {/* Dashboard Global del Caso */}
  <Route path="/client/:id" component={DashboardGlobal} />
  
  {/* Proceso Legal (7 etapas) - COLUMNA VERTEBRAL */}
  <Route path="/client/:id/proceso" component={ProcesoLegal} />
  
  {/* Herramientas IA */}
  <Route path="/client/:id/tools" component={Tools} />
  
  {/* Fallback */}
  <Route component={NotFound} />
</Routes>
```

---

## 📊 Estado del Proceso Legal

### Estructura de Datos

```typescript
interface ProcessState {
  // Información básica del caso
  caseStatus: {
    caseNumber: string;
    caseType: string;
    currentStage: string; // Etapa actual (1-7)
    resolutionStatus: string; // en_tramite, absuelto_1ra, condenado_1ra, etc.
    nextDeadline?: {
      date: string;
      description: string;
    };
  };
  
  // Intervinientes
  participants: Array<{
    id: string;
    name: string;
    role: "defensor" | "cliente" | "imputado" | "agraviado" | "fiscal" | "juez" | "vocal" | "testigo" | "perito";
    contact?: string;
    email?: string;
    dni?: string;
    relation?: string;
    notes?: string;
  }>;
  
  // Documentos organizados por las 7 etapas
  documentFolders: Array<{
    stage: "general" | "investigacion" | "intermedia" | "juicio_oral" | "apelacion" | "casacion" | "ejecucion";
    label: string;
    documents: Array<{
      id: string;
      filename: string;
      uploadDate: string;
      category: string;
    }>;
  }>;
  
  // Hitos (audiencias, sentencias, resoluciones)
  milestones: Array<{
    id: string;
    instance: "primera" | "segunda" | "casacion";
    stage: string;
    title: string;
    date: string;
    description: string;
    isVerdict?: boolean;
    verdictResult?: string;
  }>;
  
  // Estrategia legal
  strategy: {
    caseTheory: string;
    factsAnalysis: string;
    objectives: string[];
    legalStrategy: string;
    privateNotes: string;
    attachments: Array<{
      id: string;
      name: string;
      content?: string;
      type: "file" | "note";
      uploadDate: string;
    }>;
  };
  
  // Control financiero
  financial: {
    honorarios: number;
    gastos: number;
    reparacionCivil: number;
    payments: Array<{
      date: string;
      amount: number;
      concept: string;
    }>;
  };
}
```

---

## 🔔 Sistema de Notificaciones

### Tipos de Notificaciones

1. **Audiencias Próximas**
   - 7 días antes → Email + WhatsApp
   - 1 día antes → Recordatorio urgente
   - 1 hora antes → Alerta final

2. **Citas Programadas**
   - Con jueces, fiscales, vocales
   - Recordatorios personalizables

3. **Vencimientos**
   - Plazos procesales
   - Fechas límite de presentación

4. **Actualizaciones del Caso**
   - Nuevas resoluciones
   - Cambios de estado

### Canales de Notificación

- **WhatsApp**: Cliente + Asistente
- **Email**: Cliente + Defensor
- **In-App**: Alertas en el Dashboard

---

## 🎨 Mejoras UI/UX V4

### Dashboard Global
- Cards visuales con iconos
- Gráficos de progreso del proceso
- Timeline horizontal de las 7 etapas
- Indicador de etapa actual

### Proceso Legal
- Tabs grandes y claros (7 tabs)
- Iconos distintivos por etapa
- Colores para cada tipo de documento
- Vista de línea de tiempo para hitos

### Notificaciones
- Badge de notificaciones pendientes
- Panel lateral de alertas
- Calendario integrado

---

## 🚀 Plan de Implementación V4

### Fase 1: Estructura Base
- [ ] Crear `DashboardGlobal.tsx`
- [ ] Adaptar rutas en `App.tsx`
- [ ] Renombrar `LegalProcessV2` → `ProcesoLegal`

### Fase 2: Dashboard Global
- [ ] Componente `ClientInfo`
- [ ] Componente `CaseStatus`
- [ ] Componente `UpcomingHearings`
- [ ] Componente `RecentDocuments`
- [ ] Componente `QuickAccessToStages`

### Fase 3: Sistema de Notificaciones
- [ ] Modelo de `Audiencia` en schema
- [ ] Hook `useAudiencias`
- [ ] Componente `AudienciaCalendar`
- [ ] Integración WhatsApp
- [ ] Sistema de alertas

### Fase 4: Mejoras al Proceso Legal
- [ ] Mejorar UI/UX de tabs
- [ ] Agregar timeline visual
- [ ] Mejorar gestión de documentos
- [ ] Agregar búsqueda global

### Fase 5: Integración de Herramientas
- [ ] Contextualizar herramientas IA
- [ ] Acceso rápido desde cada etapa
- [ ] Integrar resultados en el proceso

### Fase 6: Testing y Pulido
- [ ] Testing end-to-end
- [ ] Optimización de performance
- [ ] Documentación de usuario
- [ ] Video tutorial

---

## ✅ Ventajas de V4

1. **Claridad**: Un cliente → Un caso → Un proceso claro de 7 etapas
2. **Guía completa**: Te ayuda a seguir el caso de principio a fin
3. **Vista global**: Dashboard con toda la información clave
4. **Organización**: Documentos organizados por etapa procesal
5. **Notificaciones**: Sistema de alertas de audiencias y citas
6. **Estrategia**: Espacio dedicado a teoría del caso y estrategia legal
7. **Financiero**: Control de honorarios y gastos
8. **Reportes**: Exportar PDF completo del caso

---

## 📝 Notas de Diseño

- **Colores por Etapa**: Cada etapa tiene un color distintivo
- **Iconos**: Usar iconos de lucide-react consistentes
- **Responsive**: Mobile-first design
- **Performance**: Lazy loading de documentos
- **Auto-save**: Guardar cambios automáticamente cada 3 segundos
- **Offline**: Continuar trabajando sin conexión (futuro)

---

**Última actualización**: 15 de noviembre de 2025

# ✅ Implementación Client-Centric con Proceso Legal Central

## 🎯 Cambios Implementados

### 1. **Migración de Base de Datos - Campos Obligatorios de Contacto**

**Archivo:** `migrations/0002_add_client_contact_fields.sql` y `migrations/apply_client_fields.sql`

**Campos agregados a la tabla `clients`:**
- ✅ `email` (varchar(255)) - **OBLIGATORIO**: Email principal del cliente
- ✅ `whatsapp_primary` (varchar(20)) - **OBLIGATORIO**: WhatsApp para coordinaciones  
- ✅ `email_assistant` (varchar(255)) - OPCIONAL: Email del asistente
- ✅ `whatsapp_assistant` (varchar(20)) - OPCIONAL: WhatsApp del asistente (aparece al activar notificaciones)
- ✅ `assistant_name` (varchar(255)) - OPCIONAL: Nombre del asistente
- ✅ `notify_client` (varchar(10)) - Default 'true': Enviar notificaciones al titular
- ✅ `notify_assistant` (varchar(10)) - Default 'false': Enviar notificaciones al asistente
- ✅ `notes` (text) - Notas adicionales sobre el cliente

**Para aplicar la migración:**
```bash
# Opción 1: Via psql
psql -d "postgresql://neondb_owner:npg_q6u9sbapxOKl@ep-polished-sky-ae30k2bi-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require" -f migrations/apply_client_fields.sql

# Opción 2: Via cliente PostgreSQL
# Conectarse a la base de datos y ejecutar el contenido de apply_client_fields.sql
```

---

### 2. **Schema Actualizado**

**Archivo:** `shared/schema.ts`

```typescript
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  // CAMPOS OBLIGATORIOS (con .notNull())
  email: varchar("email", { length: 255 }).notNull(), // ⚠️ OBLIGATORIO
  whatsappPrimary: varchar("whatsapp_primary", { length: 20 }).notNull(), // ⚠️ OBLIGATORIO
  // CAMPOS OPCIONALES
  emailAssistant: varchar("email_assistant", { length: 255 }),
  whatsappAssistant: varchar("whatsapp_assistant", { length: 20 }),
  assistantName: varchar("assistant_name", { length: 255 }),
  notifyClient: varchar("notify_client", { length: 10 }).default("true").notNull(),
  notifyAssistant: varchar("notify_assistant", { length: 10 }).default("false").notNull(),
  notes: text("notes"),
  // ... otros campos
});
```

---

### 3. **Componente ClientForm - Formulario Mejorado**

**Archivo:** `client/src/components/ClientForm.tsx` (NUEVO)

**Características:**
- ✅ Validación con Zod schema
- ✅ Campos OBLIGATORIOS destacados con asterisco rojo (*)
- ✅ Email y WhatsApp del cliente requeridos
- ✅ Sección separada para asistente (opcional)
- ✅ Checkboxes para preferencias de notificación:
  - "Enviar notificaciones al cliente titular" (checked por defecto)
  - "Enviar notificaciones al asistente" (se activa solo si hay email de asistente)
- ✅ Campo WhatsApp del asistente se habilita SOLO cuando se activa notificación al asistente
- ✅ Textarea para notas adicionales
- ✅ Mensajes de error en tiempo real
- ✅ Iconos descriptivos (Mail, MessageCircle, User, Phone)
- ✅ Nota informativa sobre campos obligatorios

**Uso del componente:**
```typescript
import { ClientForm } from '@/components/ClientForm';

<ClientForm 
  onSubmit={(values) => {
    // values incluye: name, email, whatsappPrimary, emailAssistant, etc.
    createClient(values);
  }}
  onCancel={() => setDialogOpen(false)}
  isSubmitting={mutation.isPending}
  defaultValues={editingClient} // Para modo edición
  submitLabel="Crear Cliente" // O "Actualizar Cliente"
/>
```

---

### 4. **Integración de ProcessPage en Modo Client-Centric**

**Archivo:** `client/src/App.tsx`

**Cambios:**
- ✅ Importado `ProcessPage` component
- ✅ Agregada ruta `/client/:clientId/process` en ClientCentricRouter
- ✅ ProcessPage envuelto en div con padding consistente

```typescript
<Route path="/client/:clientId/process" component={() => (
  <div className="p-6">
    <ProcessPage />
  </div>
)} />
```

---

### 5. **ClientWorkspaceDashboard - Proceso como Centro**

**Archivo:** `client/src/pages/ClientWorkspaceDashboard.tsx`

**Mejoras:**
- ✅ Card DESTACADA de "Gestión del Proceso Legal" (con shadow y border especial)
- ✅ Descripción clara: "Sigue el caso de principio a fin"
- ✅ Botón grande "Ir al Proceso" con icono TrendingUp
- ✅ 3 mini-cards explicativas:
  - 🔵 Documentos: "Carga y transcribe"
  - 🟣 Análisis IA: "Estrategia legal"
  - 🟢 Seguimiento: "Citas y avances"
- ✅ Nota informativa: "Proceso guiado paso a paso desde el registro hasta el cierre del caso"
- ✅ Gradiente de fondo en el card para mayor visibilidad
- ✅ Emoji 👋 en el título de bienvenida

---

## 🎨 Flujo de Usuario - Modo Client-Centric

### Navegación Principal:
1. Usuario cambia a modo **"Client-Centric"** con el toggle 🔨
2. Selecciona un cliente del `ClientSelector`
3. Llega al `ClientWorkspaceDashboard`
4. **VE INMEDIATAMENTE** el card grande de "Gestión del Proceso Legal"
5. Hace clic en **"Ir al Proceso"**
6. Entra a `ProcessPage` ya contextualizado para ese cliente

### Flujo del Proceso Legal (ProcessPage):
1. **Fase 0: Registro de Cliente**
   - Formulario con nombre, teléfono, email (OBLIGATORIOS)
   - Opción de descripción del caso
   - Se valida email format
   - Se crea cliente en BD
   
2. **Fase 1: Avance de Investigación**
   - Botón central "Cargar Documento"
   - Modal de preview del texto extraído (OCR con Gemini)
   - Usuario elige categoría: Notificaciones / Denuncia / Adicionales
   - Documentos se guardan en carpeta del caso
   - Botón "Transcribir" para extraer texto con IA
   - Campos colapsables para ingresar/editar texto manualmente
   
3. **Fase 2: Estrategia Legal**
   - Tab "Hechos": Botón "Analizar hechos" (IA)
   - Tab "Teoría": Botón "Generar teoría del caso" (IA)
   - Tab "Objetivos": Lista de objetivos a lograr
   - Tab "Estrategia Legal": Plan detallado de acción
   
4. **Fase 3: Programar Cita con Cliente**
   - Fecha y hora de reunión
   - Confirmación de datos del cliente
   - Notas para la reunión
   
5. **Fase 4: Seguimiento** (Placeholder)
   - Se implementará próximamente

### Auto-guardado:
- ✅ Estado del proceso se guarda cada 3 segundos
- ✅ Indicador visual "Guardado ahora" / "Guardando..."
- ✅ Persistencia en tabla `case_process_state`
- ✅ Documentos en tabla `case_documents`

---

## 📊 Ventajas del Nuevo Flujo

### Para el Abogado:
- ✅ **Contacto garantizado**: Email y WhatsApp siempre disponibles
- ✅ **Notificaciones automáticas**: A titular y/o asistente según preferencia
- ✅ **Proceso guiado**: No se pierde ninguna fase
- ✅ **Análisis IA integrado**: Acelera elaboración de estrategia
- ✅ **Todo en un lugar**: Documentos, análisis, citas y seguimiento

### Para el Cliente:
- ✅ **Transparencia**: Puede recibir notificaciones de avances
- ✅ **Flexibilidad**: Puede delegar al asistente si lo prefiere
- ✅ **Seguimiento claro**: Sabe en qué fase está su caso

### Para el Despacho:
- ✅ **Estandarización**: Todos los casos siguen el mismo flujo
- ✅ **Trazabilidad**: Historial completo de cada fase
- ✅ **Productividad**: IA reduce tiempo de análisis
- ✅ **Compliance**: Registro de comunicaciones y documentos

---

## 🔧 Tareas Pendientes

### Migración de Base de Datos:
⚠️ **IMPORTANTE**: Aplicar `migrations/apply_client_fields.sql` manualmente
- Opción A: Via psql conectándose a Neon
- Opción B: Via pgAdmin o DBeaver
- Opción C: Via Drizzle Kit (requiere configuración)

### Backend:
- [ ] Actualizar endpoint POST `/api/clients` para aceptar nuevos campos
- [ ] Actualizar endpoint PUT `/api/clients/:id` para editar campos
- [ ] Validar email y whatsappPrimary en el backend
- [ ] Implementar servicio de notificaciones (email + WhatsApp)

### Frontend:
- [ ] Integrar `ClientForm` en `ClientsPage.tsx` (reemplazar formulario actual)
- [ ] Agregar botón "Editar datos de contacto" en ClientWorkspaceLayout
- [ ] Implementar modal de edición de cliente desde workspace
- [ ] Mostrar iconos de WhatsApp y email en header del cliente
- [ ] Agregar tooltip con información de contacto al hacer hover

### Testing:
- [ ] Probar flujo completo: Registro → Proceso → Guardado → Recarga
- [ ] Verificar que campos obligatorios bloquean submit
- [ ] Validar que WhatsApp del asistente solo aparece cuando se activa checkbox
- [ ] Confirmar auto-guardado cada 3 segundos
- [ ] Probar ProcessPage en mobile

---

## 📁 Archivos Modificados/Creados

### NUEVOS:
```
migrations/0002_add_client_contact_fields.sql
migrations/apply_client_fields.sql
client/src/components/ClientForm.tsx
```

### MODIFICADOS:
```
shared/schema.ts
client/src/App.tsx
client/src/pages/ClientWorkspaceDashboard.tsx
```

---

## 🚀 Cómo Probar

1. **Aplicar migración** (ver sección "Migración de Base de Datos")

2. **Reiniciar servidor** (si está corriendo):
```bash
# En terminal del servidor
# Ctrl+C para detener
npm run dev
```

3. **Cambiar a modo Client-Centric**:
   - Abrir http://localhost:3000
   - Login
   - Click en toggle 🔨 "Modo de Trabajo"
   - Seleccionar "Modo Client-Centric"

4. **Seleccionar o crear cliente**:
   - Si hay clientes: usar ClientSelector
   - Si no: ir a modo Classic → /clients → Crear cliente con formulario mejorado

5. **Entrar al Proceso**:
   - En Dashboard del cliente
   - Click en "Ir al Proceso"
   - Seguir el flujo completo

---

## 💡 Próximos Pasos Recomendados

### Inmediato (Hoy):
1. Aplicar migración SQL
2. Probar flujo completo en desarrollo
3. Ajustar validaciones si es necesario

### Corto Plazo (Esta Semana):
1. Integrar ClientForm en ClientsPage
2. Implementar endpoints backend para nuevos campos
3. Agregar servicio de notificaciones básico

### Mediano Plazo (Próximas Semanas):
1. Implementar Fase 4 de seguimiento (recordatorios, plazos)
2. Agregar historial de comunicaciones con cliente
3. Dashboard de métricas de procesos
4. Exportar proceso a PDF/Word

---

*Implementación completada el 12 de noviembre de 2025 por GitHub Copilot*

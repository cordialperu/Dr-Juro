# 🧪 Guía de Testing Manual - Dr. Juro
## Validación de Arquitectura Unificada

**Objetivo**: Verificar que la nueva arquitectura funciona correctamente en todos los flujos.

**Tiempo estimado**: 15-20 minutos

**Servidor**: http://localhost:3000 (ya corriendo)

---

## ✅ CHECKLIST DE TESTING

### 1. Testing Básico (5 min)

#### Test 1.1: Aplicación Carga
```
[ ] Abrir http://localhost:3000
[ ] Verificar que la app carga sin errores
[ ] Verificar que no hay errores en consola del navegador (F12)
[ ] Verificar que el Dashboard aparece correctamente
```

**Resultado esperado**: 
- ✅ App carga en <2 segundos
- ✅ Console sin errores críticos
- ✅ Dashboard muestra estadísticas

---

### 2. Testing de Selección de Cliente (Modo Clásico) (3 min)

#### Test 2.1: Seleccionar Cliente desde Clientes
```
[ ] Click en "Clientes" en sidebar izquierdo
[ ] Verificar que aparece lista de clientes
[ ] Click en cualquier cliente
[ ] Verificar navegación a /client/:id
[ ] Verificar que aparece dashboard del cliente
```

**Resultado esperado**:
- ✅ Lista de clientes carga correctamente
- ✅ Click navega a dashboard del cliente
- ✅ Nombre del cliente aparece en header/breadcrumbs

#### Test 2.2: Navegación con Cliente Activo
```
[ ] Con cliente seleccionado, navegar a:
    [ ] Dashboard (/)
    [ ] Clientes (/clients)
    [ ] Expedientes (/cases)
[ ] Verificar que cliente persiste en toda la navegación
```

**Resultado esperado**:
- ✅ Cliente se mantiene seleccionado en todas las páginas
- ✅ No se pierde el estado al navegar

---

### 3. Testing de Persistencia (2 min)

#### Test 3.1: LocalStorage
```
[ ] Con cliente seleccionado, abrir DevTools (F12)
[ ] Ir a Application → Local Storage → http://localhost:3000
[ ] Buscar key: 'drjuro_unified_client'
[ ] Verificar que contiene JSON del cliente
```

**Resultado esperado**:
```json
{
  "id": "uuid-aquí",
  "name": "Nombre Cliente",
  "email": "email@example.com",
  ...
}
```

#### Test 3.2: Refresh de Página
```
[ ] Con cliente seleccionado
[ ] Presionar F5 (refresh)
[ ] Verificar que cliente sigue seleccionado después del refresh
```

**Resultado esperado**:
- ✅ Cliente NO se pierde al refrescar
- ✅ App carga con cliente ya seleccionado

---

### 4. Testing de Cambio de Modo (3 min)

#### Test 4.1: Clásico → Cliente-Céntrico
```
[ ] En modo clásico, seleccionar un cliente
[ ] Verificar que cliente aparece en header
[ ] Click en toggle de modo (botón WorkflowMode)
[ ] Cambiar a modo "Client-Centric"
[ ] Verificar que:
    [ ] UI cambia a ClientWorkspaceLayout
    [ ] Cliente se mantiene seleccionado
    [ ] Dashboard del cliente aparece
```

**Resultado esperado**:
- ✅ Cambio de modo es instantáneo
- ✅ Cliente NO se pierde
- ✅ Layout se adapta al nuevo modo

#### Test 4.2: Cliente-Céntrico → Clásico
```
[ ] En modo cliente-céntrico con cliente activo
[ ] Cambiar a modo "Classic"
[ ] Verificar que:
    [ ] UI vuelve a Dashboard global
    [ ] Cliente sigue disponible (verificar en DevTools)
    [ ] Al volver a /client/:id, cliente aparece
```

**Resultado esperado**:
- ✅ Cambio fluido sin pérdida de estado
- ✅ Cliente persiste en contexto

---

### 5. Testing de Modo Cliente-Céntrico (4 min)

#### Test 5.1: Inicio sin Cliente
```
[ ] Limpiar localStorage (DevTools → Application → Clear storage)
[ ] Refrescar página en modo cliente-céntrico
[ ] Verificar que ClientSelector se abre automáticamente
[ ] Seleccionar un cliente
[ ] Verificar navegación a /client/:id
```

**Resultado esperado**:
- ✅ ClientSelector aparece al no tener cliente
- ✅ Después de seleccionar, navega correctamente
- ✅ Dashboard del cliente carga

#### Test 5.2: Navegación en ClientWorkspace
```
[ ] Con cliente activo en modo cliente-céntrico:
    [ ] Click en "Proceso Legal"
    [ ] Click en "Expedientes"
    [ ] Click en "Tareas"
    [ ] Click en "Documentos"
[ ] Verificar que todas las páginas cargan correctamente
[ ] Verificar que nombre del cliente aparece en headers
```

**Resultado esperado**:
- ✅ Todas las tabs funcionan
- ✅ Cliente siempre visible en UI
- ✅ Navegación fluida

---

### 6. Testing de Navegación Directa (URL) (2 min)

#### Test 6.1: URL Directa a Proceso
```
[ ] Copiar ID de un cliente (desde DevTools localStorage)
[ ] Abrir nueva tab
[ ] Navegar manualmente a: http://localhost:3000/client/{CLIENTE_ID}/process
[ ] Verificar que:
    [ ] Página carga correctamente
    [ ] Cliente se carga desde API
    [ ] LegalProcessV2 muestra datos del cliente
    [ ] Contexto global se sincroniza (verificar en localStorage)
```

**Resultado esperado**:
- ✅ Navegación directa funciona
- ✅ Cliente se carga y sincroniza automáticamente
- ✅ localStorage se actualiza con cliente correcto

#### Test 6.2: URL Inválida
```
[ ] Navegar a: http://localhost:3000/client/invalid-id/process
[ ] Verificar que:
    [ ] No hay crash de aplicación
    [ ] Aparece mensaje de error o fallback UI
```

**Resultado esperado**:
- ✅ App no crashea
- ✅ Error handling apropiado

---

### 7. Testing de AnalysisToolbar (1 min)

#### Test 7.1: Herramientas IA
```
[ ] Con cliente seleccionado en modo cliente-céntrico
[ ] Verificar que aparece botón flotante (bottom-right)
[ ] Click para expandir
[ ] Verificar que aparecen 5 herramientas:
    [ ] Análisis IA
    [ ] Buscar en PDFs
    [ ] Jurisprudencia
    [ ] Metabuscador
    [ ] Doctrina
[ ] Click en cualquier herramienta
[ ] Verificar navegación correcta
```

**Resultado esperado**:
- ✅ Toolbar aparece solo con cliente activo
- ✅ Todas las herramientas navegan correctamente
- ✅ URLs incluyen clientId: /client/:id/...

---

### 8. Testing de ClientSelector (1 min)

#### Test 8.1: Búsqueda de Clientes
```
[ ] Abrir ClientSelector (desde modo cliente-céntrico)
[ ] Escribir en campo de búsqueda
[ ] Verificar que filtra clientes por nombre
[ ] Seleccionar un cliente
[ ] Verificar que selector se cierra y navega
```

**Resultado esperado**:
- ✅ Búsqueda funciona en tiempo real
- ✅ Selección actualiza contexto
- ✅ Modal se cierra automáticamente

#### Test 8.2: Clientes Recientes
```
[ ] Seleccionar 2-3 clientes diferentes
[ ] Volver a abrir ClientSelector
[ ] Verificar que sección "Recientes" muestra clientes usados
```

**Resultado esperado**:
- ✅ Clientes recientes aparecen al inicio
- ✅ Máximo 3 clientes recientes

---

## 🚨 ERRORES COMUNES A BUSCAR

### En Console del Navegador (F12):
```
❌ "useClient must be used within UnifiedClientProvider"
   → CRÍTICO: Proveedor no está envolviendo componente

❌ "Cannot read property 'id' of null"
   → Componente intenta usar client antes de verificar si existe

❌ 404 en API calls
   → Backend no está corriendo o endpoint incorrecto

⚠️ Warnings de React Query
   → Normal: stale data, refetch, etc.
```

### En Network Tab (DevTools):
```
✅ GET /api/clients → 200 (lista de clientes)
✅ GET /api/clients/:id → 200 (datos de cliente específico)
✅ GET /api/clients/:id/workspace → 200 (workspace data)

❌ 401 Unauthorized → Verificar autenticación
❌ 500 Server Error → Verificar logs del backend
```

---

## 📊 CRITERIOS DE ÉXITO

### ✅ TESTING EXITOSO SI:
- [ ] Todos los flujos cargan sin errores
- [ ] Cliente persiste al cambiar modo
- [ ] Cliente persiste al refrescar página
- [ ] LocalStorage guarda/carga correctamente
- [ ] Navegación directa sincroniza contexto
- [ ] 0 errores críticos en console
- [ ] Todas las herramientas IA funcionan

### ⚠️ TESTING PARCIAL SI:
- [ ] Algún flujo tiene problemas menores
- [ ] Warnings en console (no críticos)
- [ ] UX no óptima pero funcional

### ❌ TESTING FALLIDO SI:
- [ ] App crashea al cambiar modo
- [ ] Cliente se pierde al navegar
- [ ] LocalStorage no persiste
- [ ] Errores críticos en console
- [ ] Navegación directa no funciona

---

## 🐛 REPORTE DE BUGS

Si encuentras problemas, documenta:

```markdown
### Bug #X: [Título descriptivo]

**Severidad**: Crítico / Alto / Medio / Bajo

**Pasos para reproducir**:
1. ...
2. ...
3. ...

**Resultado esperado**:
...

**Resultado actual**:
...

**Console Errors** (si aplica):
```
[copiar error aquí]
```

**Screenshots**:
[adjuntar si es relevante]

**Ambiente**:
- Navegador: Chrome/Firefox/Safari
- Versión: ...
- Modo: Classic / Client-Centric
```

---

## 📝 TEMPLATE DE REPORTE

Después del testing, completar:

```markdown
## REPORTE DE TESTING - Dr. Juro

**Fecha**: [fecha]
**Testeador**: [nombre]
**Duración**: [minutos]

### Tests Ejecutados:
- [ ] 1. Testing Básico
- [ ] 2. Selección de Cliente (Modo Clásico)
- [ ] 3. Persistencia
- [ ] 4. Cambio de Modo
- [ ] 5. Modo Cliente-Céntrico
- [ ] 6. Navegación Directa (URL)
- [ ] 7. AnalysisToolbar
- [ ] 8. ClientSelector

### Resultado Global:
✅ EXITOSO / ⚠️ PARCIAL / ❌ FALLIDO

### Bugs Encontrados:
[listar bugs aquí]

### Observaciones:
[comentarios adicionales]

### Recomendaciones:
[sugerencias de mejora]
```

---

## 🎯 SIGUIENTE PASO

**Después del testing exitoso:**
1. Marcar PLAN_CORRECCION.md como 100% completado
2. Notificar al equipo
3. Preparar deploy a staging/producción
4. Crear tests automatizados E2E

**Si hay bugs críticos:**
1. Documentar con template de reporte
2. Priorizar por severidad
3. Abrir issues en sistema de tracking
4. Resolver antes de considerar completo

---

**¡Buena suerte con el testing!** 🚀

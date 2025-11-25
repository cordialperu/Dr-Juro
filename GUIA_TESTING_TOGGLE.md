# 🧪 Guía de Testing - Toggle Unificado

## ✅ Checklist de Pruebas

### 1. Toggle UI Component

#### Desktop Testing
- [ ] El botón toggle aparece en el header (arriba a la derecha)
- [ ] Muestra icono 🔨 (martillo)
- [ ] Muestra texto "Vista Global" en modo classic
- [ ] Muestra texto "Por Cliente" en modo client-centric
- [ ] Al hacer click, abre dropdown correctamente
- [ ] Dropdown muestra 2 opciones con iconos y descripciones
- [ ] Checkmark (✓) aparece en la opción activa
- [ ] Dropdown cierra al seleccionar una opción
- [ ] Dropdown cierra al hacer click fuera

#### Mobile Testing (<640px)
- [ ] Toggle muestra solo icono 🔨 (sin texto)
- [ ] Dropdown es responsive y se ajusta al ancho
- [ ] Touch targets son suficientemente grandes
- [ ] No hay overlap con otros elementos del header

---

### 2. Modo Classic (Vista Global)

#### UI Elements
- [ ] Sidebar izquierdo visible
- [ ] SidebarTrigger (☰) funciona correctamente
- [ ] Header muestra "Sesión iniciada como [username]"
- [ ] MobileBottomNav visible en mobile
- [ ] CommandPalette accesible con Cmd/Ctrl+K

#### Routing
- [ ] `/` redirige a Dashboard global
- [ ] `/clients` muestra lista de todos los clientes
- [ ] `/cases` muestra todos los expedientes
- [ ] `/tasks` muestra todas las tareas
- [ ] `/jurisprudencia` funciona
- [ ] `/doctrina` funciona
- [ ] `/metabuscador` funciona
- [ ] Navegación entre páginas sin errores

#### Functionality
- [ ] Se pueden ver todos los clientes
- [ ] Se pueden ver todos los expedientes
- [ ] Se pueden crear nuevos casos
- [ ] Se pueden editar tareas
- [ ] Búsqueda global funciona

---

### 3. Modo Client-Centric (Por Cliente)

#### UI Elements
- [ ] Sidebar izquierdo OCULTO
- [ ] Header muestra "Modo Client-Centric"
- [ ] MobileBottomNav OCULTO
- [ ] AnalysisToolbar (5 botones) visible en bottom-right
- [ ] ClientWorkspaceLayout muestra header del cliente

#### Client Selection
- [ ] Al entrar al modo sin cliente, muestra ClientSelector
- [ ] ClientSelector tiene campo de búsqueda funcional
- [ ] Muestra lista de clientes recientes (máx 5)
- [ ] Avatares con iniciales se generan correctamente
- [ ] Click en cliente lo selecciona y cierra modal
- [ ] "Ver todos los clientes" muestra lista completa
- [ ] Búsqueda filtra en tiempo real

#### Client Workspace
- [ ] Header muestra avatar y nombre del cliente
- [ ] Muestra email y teléfono del cliente
- [ ] Badges muestran cantidad de expedientes/tareas/docs
- [ ] Botón "Cambiar Cliente" funcional
- [ ] Navegación horizontal (tabs) funciona
- [ ] ClientWorkspaceDashboard renderiza correctamente

#### Routing
- [ ] `/` muestra ClientWorkspaceDashboard
- [ ] `/client/:clientId` muestra dashboard del cliente
- [ ] `/client/:clientId/cases` filtra casos del cliente
- [ ] `/client/:clientId/tasks` filtra tareas del cliente
- [ ] `/client/:clientId/documents` filtra docs del cliente

#### AnalysisToolbar
- [ ] 5 botones flotantes visibles
- [ ] Colores correctos: Violet, Blue, Amber, Green, Rose
- [ ] Tooltips aparecen al hover
- [ ] Click en cada botón abre herramienta correcta
- [ ] Botón de colapsar/expandir funciona
- [ ] Animaciones smooth
- [ ] Posición fixed bottom-right

---

### 4. Transiciones Entre Modos

#### Classic → Client-Centric
1. [ ] Click en toggle, seleccionar "Modo Client-Centric"
2. [ ] Sidebar desaparece suavemente
3. [ ] ClientSelector aparece si no hay cliente activo
4. [ ] Al seleccionar cliente, navega a su workspace
5. [ ] AnalysisToolbar aparece
6. [ ] MobileBottomNav desaparece
7. [ ] No hay errores en consola

#### Client-Centric → Classic
1. [ ] Click en toggle, seleccionar "Vista Clásica"
2. [ ] Sidebar reaparece
3. [ ] Navega a Dashboard global
4. [ ] AnalysisToolbar desaparece
5. [ ] MobileBottomNav reaparece (en mobile)
6. [ ] Cliente activo se preserva en localStorage
7. [ ] No hay errores en consola

#### Cambio Rápido (Spam Testing)
- [ ] Cambiar 5 veces rápido entre modos
- [ ] Sin race conditions
- [ ] Sin memory leaks visibles
- [ ] UI permanece estable

---

### 5. Persistencia de Estado

#### LocalStorage
- [ ] Abrir app → Verificar modo guardado
- [ ] Cambiar a client-centric → Recargar → Modo persiste
- [ ] Seleccionar cliente → Recargar → Cliente persiste
- [ ] Cambiar a classic → Recargar → Modo persiste
- [ ] Volver a client-centric → Cliente anterior cargado

#### Browser Navigation
- [ ] Back button mantiene modo correcto
- [ ] Forward button mantiene modo correcto
- [ ] Recargar página mantiene estado
- [ ] Abrir en nueva pestaña mantiene preferencia

---

### 6. Edge Cases

#### Sin Cliente en Client-Centric
- [ ] Entra al modo sin cliente → Muestra selector
- [ ] Cerrar selector sin elegir → Muestra fallback message
- [ ] Botón "Seleccionar Cliente" vuelve a abrir modal

#### LocalStorage Deshabilitado
- [ ] App funciona con default mode (classic)
- [ ] Sin errores en consola
- [ ] Toggle funciona pero no persiste

#### Cliente Eliminado
- [ ] Si cliente activo es eliminado
- [ ] App detecta error 404
- [ ] Limpia activeClient
- [ ] Muestra ClientSelector nuevamente

#### Narrow Viewport
- [ ] Probar en 320px width (iPhone SE)
- [ ] Toggle visible y funcional
- [ ] Dropdown no sale de pantalla
- [ ] Botones tienen touch targets adecuados

---

### 7. Performance

#### Load Times
- [ ] Modo classic carga en <2 segundos
- [ ] Cambio de modo toma <200ms
- [ ] ClientSelector aparece en <300ms
- [ ] AnalysisToolbar slide-in smooth

#### Memory Usage
- [ ] Abrir DevTools → Performance
- [ ] Cambiar entre modos 10 veces
- [ ] Verificar que no hay memory leaks
- [ ] Heap size se mantiene estable

#### Network
- [ ] No hay fetch requests innecesarios al cambiar modo
- [ ] Solo carga datos del cliente cuando se selecciona
- [ ] WebSocket mantiene conexión estable

---

### 8. Accessibility (A11y)

#### Keyboard Navigation
- [ ] Tab navega correctamente por el toggle
- [ ] Enter abre el dropdown
- [ ] Arrows navegan opciones del dropdown
- [ ] Enter selecciona opción
- [ ] Escape cierra dropdown

#### Screen Readers
- [ ] Toggle tiene label descriptivo
- [ ] Opciones del dropdown anunciadas correctamente
- [ ] Estado activo anunciado (con checkmark)

#### Color Contrast
- [ ] Texto del toggle legible en ambos temas
- [ ] Dropdown tiene contraste suficiente
- [ ] AnalysisToolbar buttons distinguibles

---

### 9. Integration Tests

#### Con Otros Componentes
- [ ] CommandPalette funciona en ambos modos
- [ ] ThemeToggle (dark/light) funciona en ambos modos
- [ ] Logout funciona en ambos modos
- [ ] Toasts/notificaciones se muestran correctamente

#### Con Backend
- [ ] API calls correctos al cargar clientes
- [ ] Filtros por cliente funcionan en client-centric
- [ ] Actualizaciones de datos se reflejan correctamente
- [ ] WebSocket events se manejan bien

---

### 10. Browser Compatibility

#### Chrome/Edge
- [ ] Toggle funciona
- [ ] Transiciones smooth
- [ ] LocalStorage persiste
- [ ] Sin errores en consola

#### Firefox
- [ ] Toggle funciona
- [ ] Transiciones smooth
- [ ] LocalStorage persiste
- [ ] Sin errores en consola

#### Safari
- [ ] Toggle funciona
- [ ] Transiciones smooth
- [ ] LocalStorage persiste
- [ ] Sin errores en consola (especialmente Webkit issues)

---

## 🎯 Testing Scenarios

### Escenario 1: Usuario Nuevo (Primera Vez)

**Steps:**
1. Abrir app sin localStorage previo
2. Login correcto
3. Verificar que inicia en modo "classic"
4. Ver Dashboard global
5. Click en toggle → Seleccionar "Client-Centric"
6. Seleccionar un cliente
7. Explorar workspace del cliente
8. Usar AnalysisToolbar
9. Volver a modo classic
10. Verificar que todo funciona

**Expected:**
- Sin errores
- Transiciones fluidas
- Persistencia funciona

---

### Escenario 2: Usuario Recurrente (Con Preferencias)

**Steps:**
1. Abrir app con localStorage existente
2. Verificar que carga en último modo usado
3. Si es client-centric, verificar que carga último cliente
4. Trabajar normalmente
5. Cambiar de modo varias veces
6. Cerrar y reabrir app
7. Verificar que vuelve al último estado

**Expected:**
- Persistencia total
- Sin reset de preferencias
- Experiencia continua

---

### Escenario 3: Mobile Power User

**Steps:**
1. Abrir en mobile (375px)
2. Login
3. Verificar que toggle solo muestra icono
4. Cambiar a client-centric
5. Seleccionar cliente
6. Usar AnalysisToolbar en mobile
7. Cambiar entre tabs del workspace
8. Volver a classic
9. Usar MobileBottomNav

**Expected:**
- UI responsive perfecta
- Touch targets suficientes
- Sin overlap de elementos

---

### Escenario 4: Abogado Multi-Cliente

**Steps:**
1. Modo client-centric activo
2. Seleccionar Cliente A
3. Trabajar en 2-3 expedientes
4. Click en "Cambiar Cliente"
5. Seleccionar Cliente B
6. Trabajar en sus expedientes
7. Volver a seleccionar Cliente A
8. Verificar que aparece en "Recientes"
9. Cambiar varias veces entre clientes

**Expected:**
- Lista de recientes actualizada
- Sin pérdida de datos
- Transiciones rápidas

---

## 🐛 Bug Report Template

Si encuentras un bug, reportarlo así:

```markdown
### Bug: [Título descriptivo]

**Modo:** Classic / Client-Centric
**Navegador:** Chrome 120 / Firefox 121 / Safari 17
**Viewport:** Desktop (1920x1080) / Mobile (375x667)

**Pasos para reproducir:**
1. 
2. 
3. 

**Resultado esperado:**
[Qué debería pasar]

**Resultado actual:**
[Qué está pasando]

**Screenshots/Video:**
[Adjuntar si es posible]

**Consola (errores):**
```
[Paste console errors]
```

**LocalStorage state:**
```json
{
  "drjuro_workflow_mode": "...",
  "drjuro_active_client": {...}
}
```
```

---

## 📊 Testing Metrics

### Coverage Target
- [ ] UI Components: 90%+
- [ ] Context Providers: 95%+
- [ ] Routers: 85%+
- [ ] Edge Cases: 80%+

### Performance Benchmarks
- [ ] Toggle response time: <100ms
- [ ] Mode transition: <200ms
- [ ] ClientSelector load: <500ms
- [ ] AnalysisToolbar animation: <300ms

---

## ✅ Sign-Off Checklist

Antes de considerar el testing completo:

- [ ] Todos los tests manuales pasados
- [ ] Sin errores críticos en consola
- [ ] Performance dentro de benchmarks
- [ ] Accessibility checklist completo
- [ ] Cross-browser testing done
- [ ] Mobile testing completo
- [ ] Edge cases verificados
- [ ] Persistencia funcional al 100%
- [ ] Documentación actualizada
- [ ] Demo funcional para mostrar

---

## 🚀 Post-Testing Actions

Una vez completado el testing:

1. **Documentar Issues Encontrados**
   - Crear lista de bugs
   - Priorizar por severidad
   - Asignar a corrección

2. **Reporte de Testing**
   - Resumen ejecutivo
   - Métricas de coverage
   - Performance results
   - Recomendaciones

3. **User Acceptance Testing (UAT)**
   - Seleccionar 2-3 usuarios beta
   - Darles guía de prueba
   - Recoger feedback
   - Iterar si es necesario

4. **Deploy Checklist**
   - Verificar que build de producción funciona
   - Smoke test en staging
   - Backup de base de datos
   - Plan de rollback listo

---

*Testing guide para asegurar calidad del toggle unificado antes de deploy a producción.*

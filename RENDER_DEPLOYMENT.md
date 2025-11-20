# Guía de Despliegue en Render

## 📋 Prerrequisitos

1. Cuenta de GitHub con el repositorio DrJuro
2. Cuenta de Render (https://render.com)
3. API Keys:
   - GEMINI_API_KEY (para búsqueda jurisprudencial y chat IA)
   - OPENAI_API_KEY (opcional, para análisis de documentos)

## 🚀 Pasos de Despliegue

### 1. Conectar Repositorio a Render

1. Ir a https://dashboard.render.com
2. Click en "New +" → "Blueprint"
3. Conectar tu repositorio de GitHub: `DrJuro`
4. Render detectará automáticamente el archivo `render.yaml`
5. Click en "Apply" para crear los servicios

### 2. Configurar Variables de Entorno

Una vez creados los servicios, ir al dashboard del servicio **dr-juro** y configurar:

#### Variables Obligatorias:

```bash
# DATABASE_URL - Se genera automáticamente al conectar la base de datos
# Ya está conectada por el render.yaml

# API Keys (configurar manualmente)
GEMINI_API_KEY=tu-gemini-api-key-aqui
OPENAI_API_KEY=tu-openai-api-key-aqui  # Opcional

# Las siguientes se auto-generan por render.yaml:
# SESSION_SECRET (auto-generado)
# JWT_SECRET (auto-generado)
# NODE_ENV=production (definido en render.yaml)
# PORT=10000 (definido en render.yaml)
```

#### Obtener API Keys:

**Gemini API Key:**
1. Ir a https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copiar la key

**OpenAI API Key (opcional):**
1. Ir a https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copiar la key

### 3. Verificar Despliegue

1. Esperar a que el build termine (5-10 minutos)
2. La URL será: `https://dr-juro.onrender.com` (o la que asigne Render)
3. Verificar el health check: `https://tu-app.onrender.com/api/health`
4. Deberías ver: `{"status":"ok","uptime":...}`

### 4. Ejecutar Migraciones de Base de Datos

**Opción A: Desde Render Shell**

1. En el dashboard de Render, ir a tu servicio "dr-juro"
2. Click en "Shell" en el menú lateral
3. Ejecutar:
```bash
npm run db:push
```

**Opción B: Desde terminal local**

```bash
# Conectar a la base de datos de Render
DATABASE_URL="postgresql://..." npm run db:push
```

(La DATABASE_URL la encuentras en el dashboard de Render → Environment)

### 5. Poblar Datos Demo

Desde tu terminal local, ejecutar:

```bash
# Instalar dependencias si no las tienes
npm install node-fetch

# Ejecutar seed con la URL de producción
APP_URL=https://tu-app.onrender.com node scripts/seed-full-demo.cjs
```

Esto creará:
- ✅ Usuario: `demo` / `demo123456`
- ✅ 3 Clientes específicos:
  - María Elena Rodríguez Salazar (Constructora - Responsabilidad Civil)
  - Carlos Antonio Mendoza Pérez (Caso Penal - Estafa)
  - Patricia Sofía Valverde Castro (Laboral - Despido Arbitrario)
- ✅ Casos con descripción completa
- ✅ Tareas (completadas, en progreso, pendientes)
- ✅ Historial de chat con IA
- ✅ Proceso legal con fases y progreso

### 6. Verificar Funcionalidad

1. Ir a `https://tu-app.onrender.com`
2. Login con: `demo` / `demo123456`
3. Verificar:
   - ✓ Lista de 3 clientes cargados
   - ✓ Casos de cada cliente
   - ✓ Tareas con diferentes estados
   - ✓ Chat funcional con IA
   - ✓ Proceso legal con datos

## 🔧 Troubleshooting

### Build Falla

**Error: "Module not found"**
```bash
# Verificar que todas las dependencias están en package.json
npm install
```

**Error: "Database connection failed"**
- Verificar que DATABASE_URL está configurada correctamente
- Verificar que el servicio de PostgreSQL está corriendo
- Revisar los logs en Render Dashboard

### Migraciones Fallan

```bash
# Error: "permission denied for schema public"
# Solución: Ejecutar desde Render Shell con el usuario correcto
npm run db:push
```

### Seed Script Falla

**Error: "Login failed: 401"**
- El usuario demo aún no existe
- El script lo creará automáticamente

**Error: "Failed to create client"**
- Verificar que las migraciones se ejecutaron correctamente
- Verificar los logs de la aplicación en Render

**Error: "ECONNREFUSED"**
- Verificar que la URL de la app es correcta
- Asegurarse de que el servicio está desplegado y corriendo

### Chat/IA No Funciona

- Verificar que GEMINI_API_KEY está configurada
- Probar la key: https://makersuite.google.com/app/apikey
- Revisar logs: puede haber límites de rate o cuota

## 📊 Monitoreo

### Logs
```bash
# Ver logs en tiempo real desde Render Dashboard
# O desde CLI de Render
render logs -s dr-juro
```

### Métricas
```bash
# Endpoint de métricas (requiere autenticación)
GET https://tu-app.onrender.com/api/metrics
```

### Health Check
```bash
# Verificar estado del servidor
curl https://tu-app.onrender.com/api/health
```

## 🔄 Actualizaciones

Render auto-deploya cuando haces push a la rama principal:

```bash
git add .
git commit -m "Update"
git push origin main
```

Render detectará el cambio y iniciará un nuevo deploy automáticamente.

## 🎉 Resultado Final

Tu aplicación estará disponible en:
- **URL**: `https://dr-juro.onrender.com`
- **Usuario Demo**: `demo`
- **Contraseña**: `demo123456`
- **3 Clientes** con datos completos para testing
- **Casos activos** con diferentes estados y prioridades
- **Chat IA** funcional con historial
- **Sistema de documentos** listo para uso

## 📝 Notas Importantes

1. **Free Tier de Render**: 
   - El servicio se duerme después de 15 minutos de inactividad
   - Primera carga después de dormir puede tardar 30-60 segundos
   - Para evitar esto, considerar plan Starter ($7/mes)

2. **Base de Datos**:
   - PostgreSQL Free tier: 90 días gratis, luego $7/mes
   - 1 GB de almacenamiento
   - Backups diarios automáticos

3. **Variables de Entorno**:
   - SESSION_SECRET y JWT_SECRET se regeneran solo si las eliminas manualmente
   - DATABASE_URL se actualiza automáticamente si cambias la base de datos

4. **CORS**:
   - El frontend y backend están en el mismo dominio
   - No hay problemas de CORS

5. **SSL/HTTPS**:
   - Render proporciona SSL automático y gratuito
   - Todos los endpoints son https:// por defecto

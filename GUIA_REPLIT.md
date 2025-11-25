# 📦 Guía Paso a Paso: Subir DrJuro a Replit

## ✅ Paso 1: Preparar Archivos

**Ya está listo!** ✓
- Se ha creado `DrJuro-deploy.tar.gz` en tu **Desktop**
- Este archivo NO incluye: node_modules, .env, storage, pdfs (se instalarán/configurarán en Replit)

---

## 🌐 Paso 2: Crear Cuenta/Login en Replit

1. Ve a **https://replit.com**
2. Haz login con GitHub, Google o Email
3. Si es tu primera vez, completa el registro (es gratis)

---

## 🆕 Paso 3: Crear Nuevo Repl

1. Click en **"+ Create Repl"** (botón azul arriba a la izquierda)
2. En el modal que aparece:
   - Template: Selecciona **"Node.js"**
   - Title: Escribe **"DrJuro"**
   - Privacy: Selecciona **"Private"** (importante!)
3. Click **"Create Repl"**

---

## 📤 Paso 4: Subir Archivos

### Opción A: Subir el archivo comprimido (Recomendado)

1. En Replit, ve a la pestaña **"Files"** (icono de carpeta 📁 en el panel izquierdo)
2. Click en los **3 puntos verticales (⋮)** arriba de la lista de archivos
3. Selecciona **"Upload file"**
4. Busca y selecciona: **`~/Desktop/DrJuro-deploy.tar.gz`**
5. Espera a que se suba
6. Abre la **Shell** en Replit (pestaña abajo) y ejecuta:
   ```bash
   tar -xzf DrJuro-deploy.tar.gz
   mv DrJuro/* .
   mv DrJuro/.* . 2>/dev/null || true
   rm -rf DrJuro DrJuro-deploy.tar.gz
   ```

### Opción B: Subir carpeta directamente

1. En la pestaña **"Files"** de Replit
2. Click en **⋮** (3 puntos)
3. Selecciona **"Upload folder"**
4. Navega a `/Users/m2dt/Downloads/DrJuro`
5. Selecciona la carpeta **DrJuro** completa
6. Click **"Upload"** (puede tardar varios minutos)

---

## 🔐 Paso 5: Configurar Secrets (Variables de Entorno)

1. En el panel izquierdo de Replit, busca el icono de **🔒 "Secrets"** o **"Tools" → "Secrets"**
2. Agrega estas 4 variables (una por una):

### Secret 1: DATABASE_URL
```
Key: DATABASE_URL
Value: postgresql://neondb_owner:npg_q6u9sbapxOKl@ep-polished-sky-ae30k2bi-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### Secret 2: GEMINI_API_KEY
```
Key: GEMINI_API_KEY
Value: AIzaSyCXcP6X624_Iqh4Z1C4Sl68CfKTWMWaZJ0
```

### Secret 3: OPENAI_API_KEY
```
Key: OPENAI_API_KEY
Value: sk-YOUR-OPENAI-API-KEY
```

### Secret 4: SESSION_SECRET
```
Key: SESSION_SECRET
Value: replit-drjuro-secret-2025
```

---

## 🚀 Paso 6: Iniciar la Aplicación

1. Click el gran botón verde **"Run"** arriba en Replit
2. Replit automáticamente:
   - Instalará todas las dependencias (`npm install`)
   - Ejecutará el comando configurado en `.replit`
   - Mostrará la salida en la consola

3. **Espera 2-3 minutos** mientras se instalan los paquetes

4. Cuando veas el mensaje: **"serving on port 3000"** ✅

5. Replit te mostrará una **vista previa** de tu app en el panel derecho

---

## 🌍 Paso 7: Obtener URL Pública

1. En el panel de vista previa, verás algo como:
   ```
   https://drjuro.tu-usuario.repl.co
   ```

2. Click en el **icono de "abrir en nueva pestaña" ↗️** para ver tu app en el navegador

3. **Copia esta URL** y compártela con tu equipo!

---

## ✅ Paso 8: Verificar que Funciona

### Login
- Usuario: `admin`
- Contraseña: `admin123`

### Pruebas Básicas
1. ✓ Crea un nuevo cliente
2. ✓ Ve a "Proceso" del cliente
3. ✓ Selecciona una fase (ej: "Avance de Investigación")
4. ✓ Sube un documento de prueba
5. ✓ Verifica que el texto se cargue automáticamente
6. ✓ Guarda y verifica que el progreso aparezca (35%)

---

## 🔧 Solución de Problemas

### Error: "Cannot find module..."
- Solución: En la Shell de Replit ejecuta: `npm install`

### Error: "Database connection failed"
- Verifica que el Secret `DATABASE_URL` esté configurado correctamente
- Ejecuta en Shell: `npm run db:push`

### Error: "Port already in use"
- Click en "Stop" y luego "Run" nuevamente

### La app no carga
- Revisa la pestaña **"Console"** en Replit para ver errores
- Verifica que todos los 4 Secrets estén configurados

---

## 📱 Compartir con tu Equipo

Tu app estará disponible 24/7 en:
```
https://drjuro.TU-USUARIO.repl.co
```

**Importante:**
- Replit mantiene la app corriendo mientras haya actividad
- Si no se usa por un tiempo, se "duerme" pero se despierta al acceder
- Para que esté siempre activa, necesitarías un plan de pago (opcional)

---

## 🎉 ¡Listo!

Tu aplicación DrJuro está ahora en producción y lista para usar.

**Próximos pasos:**
- Comparte la URL con tu equipo
- Crea usuarios adicionales si es necesario
- Monitorea el uso en el dashboard de Replit

---

## 📞 Ayuda Adicional

Si algo no funciona:
1. Revisa la consola de Replit (pestaña "Console")
2. Verifica que todos los Secrets estén bien escritos
3. Prueba ejecutar `npm run db:push` en la Shell

**¡Tu app está lista para usar! 🚀**

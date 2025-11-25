# 🚀 Instrucciones para Subir DrJuro a Replit

## Opción 1: Subir a GitHub y luego Importar a Replit (Recomendado)

### Paso 1: Crear Repositorio en GitHub
1. Ve a https://github.com/new
2. Nombre del repositorio: `DrJuro`
3. Descripción: "Case precedent assistant for law firms"
4. Selecciona **Private** (importante para proteger tus datos)
5. NO inicialices con README (ya lo tienes)
6. Click "Create repository"

### Paso 2: Subir tu Código a GitHub
Copia y pega estos comandos en tu terminal:

```bash
# Agregar el remote de GitHub (reemplaza TU_USUARIO con tu usuario de GitHub)
git remote add origin https://github.com/TU_USUARIO/DrJuro.git

# Subir el código
git branch -M main
git push -u origin main
```

### Paso 3: Importar a Replit
1. Ve a https://replit.com
2. Click "+ Create Repl"
3. Selecciona "Import from GitHub"
4. Busca y selecciona tu repositorio `DrJuro`
5. Click "Import from GitHub"

### Paso 4: Configurar Secrets en Replit
En tu Repl, ve a la pestaña "Secrets" (🔒 en el panel izquierdo) y agrega:

```
DATABASE_URL
postgresql://neondb_owner:npg_q6u9sbapxOKl@ep-polished-sky-ae30k2bi-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require

GEMINI_API_KEY
AIzaSyCXcP6X624_Iqh4Z1C4Sl68CfKTWMWaZJ0

OPENAI_API_KEY
sk-YOUR-OPENAI-API-KEY

SESSION_SECRET
change-this-to-random-string-in-production
```

### Paso 5: Iniciar la Aplicación
1. Click el botón **"Run"** en Replit
2. Espera a que se instalen las dependencias
3. Tu app estará disponible en la URL que Replit te proporcione

---

## Opción 2: Subir Directamente a Replit (Sin GitHub)

### Paso 1: Crear Nuevo Repl
1. Ve a https://replit.com
2. Click "+ Create Repl"
3. Selecciona "Node.js" como template
4. Nombre: `DrJuro`
5. Click "Create Repl"

### Paso 2: Subir Archivos
1. En el panel de archivos de Replit, click en los 3 puntos (⋮)
2. Selecciona "Upload folder"
3. Selecciona tu carpeta `/Users/m2dt/Downloads/DrJuro`
4. Espera a que todos los archivos se suban

### Paso 3: Configurar Secrets (igual que arriba)
Agrega los mismos secrets que en la Opción 1

### Paso 4: Iniciar
Click "Run"

---

## 🔥 Opción Rápida: Usar Localtunnel (Para Testing Inmediato)

Si quieres compartir tu app local AHORA mismo sin desplegar:

```bash
# En una terminal, inicia tu app
npm run dev

# En otra terminal, ejecuta:
npx localtunnel --port 3000

# Te dará una URL pública como: https://random-name.loca.lt
# Comparte esa URL con tu equipo
```

⚠️ **Nota**: Localtunnel es solo para testing temporal. Usa Replit para producción.

---

## ✅ Verificación Post-Despliegue

1. Abre la URL de tu app
2. Inicia sesión (user: `admin`, pass: `admin123`)
3. Crea un cliente de prueba
4. Sube un documento
5. Verifica que el progreso se guarde correctamente
6. Prueba el análisis con IA (debe usar Gemini y OpenAI)

---

## 📞 Soporte

Si tienes problemas:
- Revisa los logs en Replit (pestaña "Console")
- Verifica que los Secrets estén configurados correctamente
- Asegúrate de que la conexión a Neon funcione

**Base de datos Neon configurada ✅**
**Código listo para desplegar ✅**
**APIs configuradas ✅**

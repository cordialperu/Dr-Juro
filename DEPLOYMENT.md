# 🚀 Guía de Despliegue - Dr. Juro

## Opción 1: Despliegue en Replit (Recomendado - Gratis)

### Paso 1: Crear cuenta en Replit
1. Ve a [replit.com](https://replit.com)
2. Crea una cuenta gratuita

### Paso 2: Importar el proyecto
1. Haz clic en "+ Create Repl"
2. Selecciona "Import from GitHub"
3. Sube tu repositorio o arrastra la carpeta del proyecto

### Paso 3: Configurar variables de entorno
En Replit, ve a "Tools" → "Secrets" y agrega:

```
OPENAI_API_KEY=tu-clave-de-openai
GEMINI_API_KEY=tu-clave-de-gemini
DATABASE_URL=postgresql://user:password@host:5432/database
```

**Nota sobre la base de datos:**
- Replit incluye PostgreSQL 16 automáticamente
- La DATABASE_URL se configurará automáticamente si usas la base de datos integrada
- Si prefieres usar Neon (gratis), sigue las instrucciones en la Opción 2

### Paso 4: Configurar la base de datos

#### Opción A: Usar PostgreSQL de Replit (Ya incluido)
1. En Replit, el PostgreSQL ya está configurado
2. Ejecuta en la terminal:
```bash
npm install
npm run db:push
```

#### Opción B: Usar Neon Database (Gratis, Recomendado para producción)
1. Ve a [neon.tech](https://neon.tech)
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto
4. Copia la "Connection String"
5. Agrégala como variable de entorno `DATABASE_URL` en Replit

### Paso 5: Ejecutar el proyecto
1. Haz clic en el botón "Run" en Replit
2. La aplicación estará disponible en la URL que te proporciona Replit
3. ¡Comparte la URL con tu equipo!

---

## Opción 2: Despliegue en Render (Gratis)

### Backend (Render Web Service)
1. Ve a [render.com](https://render.com) y crea una cuenta
2. Crea un nuevo "Web Service"
3. Conecta tu repositorio de GitHub
4. Configura:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node
5. Agrega las variables de entorno en "Environment"

### Base de Datos (Neon o Render PostgreSQL)
1. **Opción A - Neon (Recomendado)**:
   - Ve a [neon.tech](https://neon.tech)
   - Crea un proyecto gratuito
   - Copia la connection string
   
2. **Opción B - Render PostgreSQL**:
   - En Render, crea una "PostgreSQL Database"
   - Copia la "Internal Database URL"

---

## Opción 3: Despliegue en Vercel (Frontend) + Neon (Backend)

### Backend API (Separado)
1. Despliega el backend en Render o Railway
2. Asegúrate de que las rutas API estén accesibles

### Frontend (Vercel)
1. Ve a [vercel.com](https://vercel.com)
2. Importa tu proyecto
3. Configura las variables de entorno
4. Vercel detectará automáticamente Vite

---

## 🔑 Variables de Entorno Requeridas

```env
# Base de datos (elige una opción)
DATABASE_URL=postgresql://user:password@host:5432/database

# APIs de IA (ambas requeridas)
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AI...

# Configuración del servidor
PORT=3000
NODE_ENV=production
```

---

## 📦 Obtener las API Keys

### OpenAI API Key
1. Ve a [platform.openai.com](https://platform.openai.com)
2. Crea una cuenta
3. Ve a "API keys" y genera una nueva
4. **Nota**: Necesitarás agregar créditos (mínimo $5)

### Gemini API Key
1. Ve a [ai.google.dev](https://ai.google.dev)
2. Crea una cuenta con tu Google
3. Ve a "Get API Key"
4. Genera una nueva clave
5. **Es GRATIS** con límites generosos

---

## 🗄️ Opciones de Base de Datos (Todas Gratis)

### 1. Neon Database (Recomendado)
- ✅ 10 GB de almacenamiento gratis
- ✅ PostgreSQL serverless
- ✅ Muy fácil de configurar
- 🔗 [neon.tech](https://neon.tech)

### 2. Supabase
- ✅ 500 MB gratis
- ✅ PostgreSQL con interfaz visual
- 🔗 [supabase.com](https://supabase.com)

### 3. Railway PostgreSQL
- ✅ $5 de crédito gratis
- ✅ PostgreSQL administrado
- 🔗 [railway.app](https://railway.app)

---

## ✅ Checklist de Despliegue

- [ ] Cuenta creada en Replit/Render
- [ ] Base de datos PostgreSQL configurada (Neon recomendado)
- [ ] OpenAI API Key obtenida
- [ ] Gemini API Key obtenida
- [ ] Variables de entorno configuradas
- [ ] Proyecto desplegado
- [ ] Base de datos inicializada (`npm run db:push`)
- [ ] URL compartida con el equipo

---

## 🆘 Solución de Problemas

### "Cannot connect to database"
- Verifica que la `DATABASE_URL` esté correcta
- Asegúrate de que incluya el formato: `postgresql://user:password@host:5432/database`

### "OpenAI API error"
- Verifica que tu API key sea válida
- Asegúrate de tener créditos en tu cuenta OpenAI

### "Port already in use"
- En Replit, esto se maneja automáticamente
- En local, cambia el puerto en `.env`

---

## 📞 Contacto y Soporte

Si tienes problemas durante el despliegue, revisa:
1. Los logs de la consola en Replit/Render
2. Las variables de entorno configuradas
3. La conexión a la base de datos

---

## 🎉 ¡Listo!

Una vez desplegado, tu equipo puede acceder a Dr. Juro desde cualquier lugar con la URL proporcionada por Replit/Render.

**URL de ejemplo en Replit**: `https://drjuro-tu-usuario.replit.app`

# Dr. Juro - Asistente Legal

Sistema de gestión de casos legales con análisis de documentos mediante IA.

## 🚀 Despliegue Rápido

### 1. Configurar Base de Datos Neon

Tu proyecto ya está conectado a Neon. Solo necesitas:

1. Copia tu Connection String de Neon
2. Créala como variable de entorno:
   ```bash
   export DATABASE_URL="postgresql://user:pass@host.neon.tech/drjuro?sslmode=require"
   ```

3. Inicializa las tablas:
   ```bash
   npm run db:push
   ```

### 2. Configurar API Keys

```bash
# Gemini API (Jurisprudencia) - GRATIS
export GEMINI_API_KEY="tu-key-aqui"

# OpenAI API (Análisis de documentos)
export OPENAI_API_KEY="tu-key-aqui"
```

### 3. Ejecutar

```bash
npm install
npm run dev
```

## 📝 Variables de Entorno

Crea un archivo `.env` con:

```env
DATABASE_URL=postgresql://user:pass@host.neon.tech/drjuro?sslmode=require
GEMINI_API_KEY=tu-key-de-gemini
OPENAI_API_KEY=tu-key-de-openai
PORT=3000
NODE_ENV=development
```

## 🔧 Scripts Disponibles

```bash
npm run dev      # Desarrollo
npm run build    # Compilar
npm start        # Producción
npm run db:push  # Actualizar base de datos
```

## 📦 Estructura

- `/client` - Frontend React + TypeScript
- `/server` - Backend Express + TypeScript
- `/shared` - Schemas compartidos (Drizzle ORM)
- `/storage` - Archivos y documentos de usuarios

## 🌐 Desplegar en Producción

Ver `QUICKSTART.md` para instrucciones detalladas de despliegue en Replit o Railway.

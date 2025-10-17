#!/bin/bash

echo "🚀 Iniciando Dr. Juro - Setup"
echo "================================"

# Verificar que Node.js esté instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instálalo primero."
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"

# Instalar dependencias
echo ""
echo "📦 Instalando dependencias..."
npm install

# Verificar variables de entorno
echo ""
echo "🔍 Verificando variables de entorno..."

if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  OPENAI_API_KEY no configurada"
    echo "   Configúrala en Replit Secrets o en tu archivo .env"
else
    echo "✅ OPENAI_API_KEY configurada"
fi

if [ -z "$GEMINI_API_KEY" ]; then
    echo "⚠️  GEMINI_API_KEY no configurada"
    echo "   Configúrala en Replit Secrets o en tu archivo .env"
else
    echo "✅ GEMINI_API_KEY configurada"
fi

if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL no configurada"
    echo "   Configúrala en Replit Secrets o en tu archivo .env"
else
    echo "✅ DATABASE_URL configurada"
fi

# Compilar el proyecto
echo ""
echo "🔨 Compilando el proyecto..."
npm run build

# Inicializar base de datos
echo ""
echo "🗄️  Inicializando base de datos..."
npm run db:push

echo ""
echo "================================"
echo "✅ Setup completado!"
echo ""
echo "Para iniciar el servidor en desarrollo:"
echo "  npm run dev"
echo ""
echo "Para iniciar el servidor en producción:"
echo "  npm start"
echo ""
echo "🎉 ¡Dr. Juro está listo!"

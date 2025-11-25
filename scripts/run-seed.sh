#!/bin/bash

# Script para ejecutar el seed de casos demo
echo "🌱 Ejecutando seed de casos demo..."
echo ""

# Verificar que exista tsx
if ! command -v tsx &> /dev/null; then
    echo "❌ tsx no está instalado"
    echo "📦 Instalando tsx..."
    npm install -g tsx
fi

# Ejecutar el seed
tsx scripts/seed-demo-cases.ts

echo ""
echo "✅ Seed completado"

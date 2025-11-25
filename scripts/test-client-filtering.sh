#!/bin/bash

# Script de prueba: Verificar filtrado de clientes por usuario

echo "🧪 Prueba: Filtrado de Clientes por Usuario"
echo "==========================================="
echo ""

# 1. Login como drjuro_v5
echo "1️⃣  Haciendo login como drjuro_v5..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"drjuro_v5","password":"DrJuro2025!"}' \
  -c cookies.txt)

echo "Respuesta de login:"
echo "$LOGIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

# Extraer userId de la respuesta
USER_ID=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
echo "✅ Usuario autenticado: $USER_ID"
echo ""

# 2. Obtener lista de clientes
echo "2️⃣  Obteniendo lista de clientes..."
CLIENTS_RESPONSE=$(curl -s -X GET http://localhost:3000/api/clients \
  -b cookies.txt)

echo "Respuesta de clientes:"
echo "$CLIENTS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CLIENTS_RESPONSE"
echo ""

# Contar clientes
CLIENT_COUNT=$(echo "$CLIENTS_RESPONSE" | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('data', [])))" 2>/dev/null)
echo "📊 Total de clientes: $CLIENT_COUNT"
echo ""

# 3. Verificar nombres de los clientes
echo "3️⃣  Verificando nombres de clientes..."
echo "$CLIENTS_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    clients = data.get('data', [])
    for i, client in enumerate(clients, 1):
        print(f'   {i}. {client[\"name\"]} ({client[\"id\"]})')
        print(f'      Email: {client.get(\"email\", \"N/A\")}')
        print(f'      User ID: {client.get(\"userId\", \"N/A\")}')
        print()
except Exception as e:
    print(f'Error: {e}')
" 2>/dev/null
echo ""

# 4. Verificar que solo hay 3 clientes
if [ "$CLIENT_COUNT" = "3" ]; then
    echo "✅ PRUEBA EXITOSA: El usuario drjuro_v5 ve exactamente 3 clientes"
else
    echo "❌ PRUEBA FALLIDA: Se esperaban 3 clientes pero se encontraron $CLIENT_COUNT"
fi
echo ""

# 5. Crear un cliente nuevo para verificar que se asigna userId automáticamente
echo "4️⃣  Creando nuevo cliente de prueba..."
CREATE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Cliente Test Automático",
    "email": "test.auto@drjuro.com",
    "whatsappPrimary": "+51999888777",
    "notifyClient": "true",
    "notifyAssistant": "false"
  }')

echo "Respuesta de creación:"
echo "$CREATE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CREATE_RESPONSE"
echo ""

# Verificar que el userId fue asignado correctamente
NEW_CLIENT_USER_ID=$(echo "$CREATE_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('userId', 'N/A'))" 2>/dev/null)
if [ "$NEW_CLIENT_USER_ID" = "$USER_ID" ]; then
    echo "✅ PRUEBA EXITOSA: El userId se asignó automáticamente al usuario autenticado"
else
    echo "❌ PRUEBA FALLIDA: userId no coincide (esperado: $USER_ID, obtenido: $NEW_CLIENT_USER_ID)"
fi
echo ""

# 6. Verificar que ahora hay 4 clientes
echo "5️⃣  Verificando que ahora hay 4 clientes..."
CLIENTS_RESPONSE_2=$(curl -s -X GET http://localhost:3000/api/clients \
  -b cookies.txt)

CLIENT_COUNT_2=$(echo "$CLIENTS_RESPONSE_2" | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('data', [])))" 2>/dev/null)
echo "📊 Total de clientes después de crear uno nuevo: $CLIENT_COUNT_2"

if [ "$CLIENT_COUNT_2" = "4" ]; then
    echo "✅ PRUEBA EXITOSA: El contador de clientes aumentó correctamente"
else
    echo "⚠️  ADVERTENCIA: Se esperaban 4 clientes pero se encontraron $CLIENT_COUNT_2"
fi
echo ""

# 7. Eliminar el cliente de prueba
echo "6️⃣  Limpiando: Eliminando cliente de prueba..."
NEW_CLIENT_ID=$(echo "$CREATE_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', 'N/A'))" 2>/dev/null)
if [ "$NEW_CLIENT_ID" != "N/A" ]; then
    curl -s -X DELETE "http://localhost:3000/api/clients/by-name/Cliente Test Automático" \
      -b cookies.txt > /dev/null
    echo "✅ Cliente de prueba eliminado"
else
    echo "⚠️  No se pudo obtener el ID del cliente de prueba para eliminarlo"
fi
echo ""

# Limpiar cookies
rm -f cookies.txt

echo "=========================================="
echo "🏁 Pruebas completadas"
echo "=========================================="

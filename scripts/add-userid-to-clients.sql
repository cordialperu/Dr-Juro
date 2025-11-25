-- Migración: Agregar campo user_id a la tabla clients
-- Fecha: 2025-11-18
-- Propósito: Cada cliente debe pertenecer a un usuario específico

-- Paso 1: Agregar la columna user_id (NULL permitido temporalmente)
ALTER TABLE clients 
ADD COLUMN user_id VARCHAR;

-- Paso 2: Agregar la referencia de clave foránea
ALTER TABLE clients 
ADD CONSTRAINT clients_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id);

-- Paso 3: Actualizar clientes existentes con el ID del usuario drjuro_v5
-- Asumiendo que drjuro_v5 es el usuario principal para los 3 clientes de prueba V5
UPDATE clients 
SET user_id = (SELECT id FROM users WHERE username = 'drjuro_v5')
WHERE name IN ('Fernando Vargas León', 'Roberto Silva Torres', 'Ana Lucía Perez');

-- Paso 4: Para otros clientes antiguos sin usuario asignado, 
-- puedes asignarlos a un usuario por defecto o eliminarlos
-- Ejemplo: Asignar todos los clientes sin usuario al primer admin
-- UPDATE clients 
-- SET user_id = (SELECT id FROM users ORDER BY created_at LIMIT 1)
-- WHERE user_id IS NULL;

-- Paso 5: Hacer la columna NOT NULL después de asignar todos los valores
-- DESCOMENTA LA SIGUIENTE LÍNEA DESPUÉS DE VERIFICAR QUE TODOS LOS CLIENTES TIENEN user_id
-- ALTER TABLE clients ALTER COLUMN user_id SET NOT NULL;

-- Verificación: Mostrar clientes con sus usuarios
SELECT 
  c.id,
  c.name,
  c.email,
  u.username as usuario_propietario
FROM clients c
LEFT JOIN users u ON c.user_id = u.id
ORDER BY c.created_at DESC;

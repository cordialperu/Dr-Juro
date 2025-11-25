import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Nota: Estos son tests de integración que requieren servidor corriendo
// Para ejecutarlos: npm run dev (en otra terminal) && npm test
describe('API - Auth (Integration - requires server)', () => {
  const BASE_URL = 'http://localhost:3000/api';
  
  beforeAll(() => {
    // Validar que el servidor esté disponible antes de correr tests
    console.log('⚠️  Estos tests requieren que el servidor esté corriendo en puerto 3000');
  });

  describe('POST /auth/login', () => {
    it.skip('debe rechazar credenciales inválidas', async () => {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'invalid',
          password: 'wrong',
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it.skip('debe aceptar credenciales válidas', async () => {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'admin',
          password: 'admin123',
        }),
        credentials: 'include',
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBeDefined();
      expect(data.username).toBe('admin');
    });
  });

  describe('GET /auth/profile', () => {
    it.skip('debe retornar 401 sin sesión', async () => {
      const response = await fetch(`${BASE_URL}/auth/profile`);
      expect(response.status).toBe(401);
    });
  });
});

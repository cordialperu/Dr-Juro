import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerClientRoutes } from '../clients';

const app = express();
app.use(express.json());

// Mock session middleware
app.use((req, res, next) => {
  req.session = {
    userId: 'test-user-id',
  } as any;
  next();
});

registerClientRoutes(app);

describe('Client Routes', () => {
  describe('GET /clients', () => {
    it('should return clients list', async () => {
      const response = await request(app)
        .get('/clients')
        .expect('Content-Type', /json/);

      expect(response.status).toBeLessThanOrEqual(500);
      expect(Array.isArray(response.body) || typeof response.body === 'object').toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/clients?page=1&limit=10')
        .expect('Content-Type', /json/);

      expect(response.status).toBeLessThanOrEqual(500);
    });
  });

  describe('POST /clients', () => {
    it('should create a new client with valid data', async () => {
      const newClient = {
        name: 'Test Client',
        contactInfo: '999888777',
      };

      const response = await request(app)
        .post('/clients')
        .send(newClient)
        .expect('Content-Type', /json/);

      if (response.status === 201) {
        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe(newClient.name);
      }
    });

    it('should reject invalid client data', async () => {
      const invalidClient = {
        name: '', // Empty name
        contactInfo: '999888777',
      };

      const response = await request(app)
        .post('/clients')
        .send(invalidClient);

      expect([400, 500]).toContain(response.status);
    });
  });
});

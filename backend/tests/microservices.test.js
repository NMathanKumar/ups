/**
 * microservices.test.js — Verification tests for microservices handlers
 */

import { handler as agentHandler } from '../src/microservices/agent-service/index.js';
import { handler as taskHandler } from '../src/microservices/task-service/index.js';
import { handler as hrHandler } from '../src/microservices/hr-service/index.js';
import { handler as itHandler } from '../src/microservices/it-service/index.js';
import { handler as onboardingHandler } from '../src/microservices/onboarding-service/index.js';

describe('Microservices Entry Point Handlers', () => {
  describe('Agent Service', () => {
    test('OPTIONS request returns CORS preflight', async () => {
      const res = await agentHandler({ httpMethod: 'OPTIONS' });
      expect(res.statusCode).toBe(204);
    });

    test('GET /api/health returns health status', async () => {
      const res = await agentHandler({ httpMethod: 'GET', rawPath: '/api/health' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.status).toBe('ok');
    });

    test('Unmatched route returns 400 bad request', async () => {
      const res = await agentHandler({ httpMethod: 'GET', rawPath: '/api/unknown' });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('Task Service', () => {
    test('OPTIONS request returns CORS preflight', async () => {
      const res = await taskHandler({ httpMethod: 'OPTIONS' });
      expect(res.statusCode).toBe(204);
    });

    test('Unmatched route returns 400 bad request', async () => {
      const res = await taskHandler({ httpMethod: 'GET', rawPath: '/api/unknown' });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('HR Service', () => {
    test('OPTIONS request returns CORS preflight', async () => {
      const res = await hrHandler({ httpMethod: 'OPTIONS' });
      expect(res.statusCode).toBe(204);
    });

    test('Unmatched route returns 400 bad request', async () => {
      const res = await hrHandler({ httpMethod: 'GET', rawPath: '/api/unknown' });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('IT Service', () => {
    test('OPTIONS request returns CORS preflight', async () => {
      const res = await itHandler({ httpMethod: 'OPTIONS' });
      expect(res.statusCode).toBe(204);
    });

    test('Unmatched route returns 400 bad request', async () => {
      const res = await itHandler({ httpMethod: 'GET', rawPath: '/api/unknown' });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('Onboarding Service', () => {
    test('OPTIONS request returns CORS preflight', async () => {
      const res = await onboardingHandler({ httpMethod: 'OPTIONS' });
      expect(res.statusCode).toBe(204);
    });

    test('Unmatched route returns 400 bad request', async () => {
      const res = await onboardingHandler({ httpMethod: 'GET', rawPath: '/api/unknown' });
      expect(res.statusCode).toBe(400);
    });
  });
});

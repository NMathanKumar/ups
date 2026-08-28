/**
 * health.test.js
 * Env vars are set via jest.setup.js before module loading.
 */
import { handleHealth } from '../src/handlers/health.js';

describe('Health Handler', () => {
  test('returns 200 with status ok', async () => {
    const response = await handleHealth({});
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('ok');
    expect(body.service).toBe('workpilot-backend');
  });
});

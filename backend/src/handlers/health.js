/**
 * health.js — GET /api/health
 */
import { ok } from '../utils/response.js';

export async function handleHealth() {
  return ok({ status: 'ok', service: 'workpilot-backend' });
}

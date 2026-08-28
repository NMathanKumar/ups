/**
 * it-service/index.js — Microservice for IT Support & Asset Management
 *
 * Microservice domain:
 * - GET  /api/it/assets/:employeeId
 * - POST /api/it/tickets
 */

import { corsPreflightResponse, ok, badRequest, serverError } from '../../utils/response.js';
import { parseBody } from '../../utils/validation.js';
import { getEmployeeAssets } from '../../services/enterpriseSystems.js';
import { createITTicket } from '../../services/workflowService.js';

export const handler = async (event) => {
  const method = event.requestContext?.http?.method ?? event.httpMethod ?? 'GET';
  const path   = event.rawPath ?? event.path ?? '/';

  console.log(`[it-service] ${method} ${path}`);

  if (method === 'OPTIONS') return corsPreflightResponse();

  try {
    // GET /api/it/assets/:employeeId
    if (method === 'GET' && path.startsWith('/api/it/assets/')) {
      const employeeId = path.split('/api/it/assets/')[1];
      const assets = await getEmployeeAssets(employeeId);
      return ok({ assets });
    }

    // POST /api/it/tickets
    if (method === 'POST' && path === '/api/it/tickets') {
      const body = parseBody(event);
      if (!body) return badRequest('Invalid JSON body.');
      const result = await createITTicket(body);
      return ok(result);
    }

    return badRequest(`Route not found in it-service: ${method} ${path}`);
  } catch (err) {
    console.error('[it-service] Error:', err);
    return serverError(err.message);
  }
};

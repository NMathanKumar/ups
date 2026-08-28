/**
 * onboarding-service/index.js — Microservice for Intern Onboarding Workflows
 *
 * Microservice domain:
 * - POST /api/onboarding
 * - GET  /api/onboarding/:employeeId
 */

import { corsPreflightResponse, ok, badRequest, notFound, serverError } from '../../utils/response.js';
import { parseBody } from '../../utils/validation.js';
import { createOnboardingWorkflow, getOnboardingStatus } from '../../services/workflowService.js';

export const handler = async (event) => {
  const method = event.requestContext?.http?.method ?? event.httpMethod ?? 'GET';
  const path   = event.rawPath ?? event.path ?? '/';

  console.log(`[onboarding-service] ${method} ${path}`);

  if (method === 'OPTIONS') return corsPreflightResponse();

  try {
    // POST /api/onboarding
    if (method === 'POST' && path === '/api/onboarding') {
      const body = parseBody(event);
      if (!body) return badRequest('Invalid JSON body.');
      const result = await createOnboardingWorkflow(body);
      return ok(result);
    }

    // GET /api/onboarding/:employeeId
    if (method === 'GET' && path.startsWith('/api/onboarding/')) {
      const employeeId = path.split('/api/onboarding/')[1];
      const result = await getOnboardingStatus({ employeeId });
      if (!result.data) return notFound(`Onboarding workflow for ${employeeId} not found.`);
      return ok(result);
    }

    return badRequest(`Route not found in onboarding-service: ${method} ${path}`);
  } catch (err) {
    console.error('[onboarding-service] Error:', err);
    return serverError(err.message);
  }
};

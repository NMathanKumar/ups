/**
 * hr-service/index.js — Microservice for HR & Employee Management
 *
 * Microservice domain:
 * - GET  /api/hr/employees/:employeeId
 * - GET  /api/hr/leave-balance/:employeeId
 * - POST /api/hr/leave-requests
 * - POST /api/hr/tasks
 */

import { corsPreflightResponse, ok, badRequest, notFound, serverError } from '../../utils/response.js';
import { parseBody } from '../../utils/validation.js';
import { getEmployee, checkLeaveBalance } from '../../services/enterpriseSystems.js';
import { createLeaveRequest, createHRTask } from '../../services/workflowService.js';

export const handler = async (event) => {
  const method = event.requestContext?.http?.method ?? event.httpMethod ?? 'GET';
  const path   = event.rawPath ?? event.path ?? '/';

  console.log(`[hr-service] ${method} ${path}`);

  if (method === 'OPTIONS') return corsPreflightResponse();

  try {
    // GET /api/hr/employees/:employeeId
    if (method === 'GET' && path.startsWith('/api/hr/employees/')) {
      const employeeId = path.split('/api/hr/employees/')[1];
      const employee = await getEmployee(employeeId);
      if (!employee) return notFound(`Employee ${employeeId} not found.`);
      return ok({ employee });
    }

    // GET /api/hr/leave-balance/:employeeId
    if (method === 'GET' && path.startsWith('/api/hr/leave-balance/')) {
      const employeeId = path.split('/api/hr/leave-balance/')[1];
      const balance = await checkLeaveBalance(employeeId);
      if (!balance) return notFound(`Leave balance for ${employeeId} not found.`);
      return ok({ balance });
    }

    // POST /api/hr/leave-requests
    if (method === 'POST' && path === '/api/hr/leave-requests') {
      const body = parseBody(event);
      if (!body) return badRequest('Invalid JSON body.');
      const result = await createLeaveRequest(body);
      return ok(result);
    }

    // POST /api/hr/tasks
    if (method === 'POST' && path === '/api/hr/tasks') {
      const body = parseBody(event);
      if (!body) return badRequest('Invalid JSON body.');
      const result = await createHRTask(body);
      return ok(result);
    }

    return badRequest(`Route not found in hr-service: ${method} ${path}`);
  } catch (err) {
    console.error('[hr-service] Error:', err);
    return serverError(err.message);
  }
};

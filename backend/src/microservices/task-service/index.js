/**
 * task-service/index.js — Microservice for Employee Tasks & Reminders Management
 *
 * Microservice domain:
 * - GET   /api/tasks
 * - POST  /api/tasks
 * - PATCH /api/tasks/:taskId
 * - GET   /api/reminders
 * - POST  /api/reminders
 * - PATCH /api/reminders/:reminderId
 */

import { corsPreflightResponse, badRequest } from '../../utils/response.js';
import { handleGetTasks, handleCreateTask, handleUpdateTask } from '../../handlers/tasks.js';
import { handleGetReminders, handleCreateReminder, handleUpdateReminder } from '../../handlers/reminders.js';

export const handler = async (event) => {
  const method = event.requestContext?.http?.method ?? event.httpMethod ?? 'GET';
  const path   = event.rawPath ?? event.path ?? '/';

  console.log(`[task-service] ${method} ${path}`);

  if (method === 'OPTIONS') return corsPreflightResponse();

  // ── Tasks ────────────────────────────────────────────────────────────────
  if (method === 'GET'  && path === '/api/tasks') return handleGetTasks(event);
  if (method === 'POST' && path === '/api/tasks') return handleCreateTask(event);
  if (method === 'PATCH' && path.startsWith('/api/tasks/')) {
    const taskId = path.split('/api/tasks/')[1];
    return handleUpdateTask({ ...event, pathParameters: { taskId } });
  }

  // ── Reminders ────────────────────────────────────────────────────────────
  if (method === 'GET'  && path === '/api/reminders') return handleGetReminders(event);
  if (method === 'POST' && path === '/api/reminders') return handleCreateReminder(event);
  if (method === 'PATCH' && path.startsWith('/api/reminders/')) {
    const reminderId = path.split('/api/reminders/')[1];
    return handleUpdateReminder({ ...event, pathParameters: { reminderId } });
  }

  return badRequest(`Route not found in task-service: ${method} ${path}`);
};

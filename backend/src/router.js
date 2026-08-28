/**
 * router.js — Lambda entry point / API router
 *
 * Routes incoming API Gateway HTTP API events to the correct handler.
 * Each request is independent — Lambda is stateless.
 * Multiple concurrent invocations are safe (no shared in-memory state).
 */

import { corsPreflightResponse, badRequest } from './utils/response.js';
import { handleHealth }           from './handlers/health.js';
import { handleChat }             from './handlers/chat.js';
import { handleGetTasks, handleCreateTask, handleUpdateTask } from './handlers/tasks.js';
import { handleGetReminders, handleCreateReminder, handleUpdateReminder }          from './handlers/reminders.js';
import { handleGetConversations } from './handlers/conversations.js';

export const handler = async (event) => {
  const method = event.requestContext?.http?.method ?? event.httpMethod ?? 'GET';
  const path   = event.rawPath ?? event.path ?? '/';

  console.log(`[router] ${method} ${path}`);

  // CORS preflight
  if (method === 'OPTIONS') return corsPreflightResponse();

  // ── Health ──────────────────────────────────────────────────────────────
  if (method === 'GET' && path === '/api/health') return handleHealth(event);

  // ── Chat ─────────────────────────────────────────────────────────────────
  if (method === 'POST' && path === '/api/chat') return handleChat(event);

  // ── Conversations ────────────────────────────────────────────────────────
  if (method === 'GET' && (path === '/api/conversations' || path.startsWith('/api/conversations/')))
    return handleGetConversations(event);

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

  // ── 404 ──────────────────────────────────────────────────────────────────
  return badRequest(`Route not found: ${method} ${path}`);
};

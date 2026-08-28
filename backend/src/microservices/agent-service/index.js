/**
 * agent-service/index.js — Microservice for AI Chat & Bedrock Agent RAG
 *
 * Microservice domain:
 * - POST /api/chat
 * - GET  /api/conversations
 * - GET  /api/health
 */

import { corsPreflightResponse, badRequest } from '../../utils/response.js';
import { handleHealth } from '../../handlers/health.js';
import { handleChat } from '../../handlers/chat.js';
import { handleGetConversations } from '../../handlers/conversations.js';
import { handleSignUp, handleLogin, handleGetMe } from '../../handlers/auth.js';

export const handler = async (event) => {
  const method = event.requestContext?.http?.method ?? event.httpMethod ?? 'GET';
  const path   = event.rawPath ?? event.path ?? '/';

  console.log(`[agent-service] ${method} ${path}`);

  if (method === 'OPTIONS') return corsPreflightResponse();

  if (method === 'POST' && path === '/api/auth/signup') return handleSignUp(event);
  if (method === 'POST' && path === '/api/auth/login')  return handleLogin(event);
  if (method === 'GET'  && path === '/api/auth/me')     return handleGetMe(event);

  if (method === 'GET' && path === '/api/health') return handleHealth(event);
  if (method === 'POST' && path === '/api/chat') return handleChat(event);
  if (method === 'GET' && (path === '/api/conversations' || path.startsWith('/api/conversations/'))) {
    return handleGetConversations(event);
  }

  return badRequest(`Route not found in agent-service: ${method} ${path}`);
};

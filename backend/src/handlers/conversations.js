/**
 * conversations.js
 * GET /api/conversations/:userId — retrieve recent chat history for display in UI
 */

import { ok, badRequest, serverError } from '../utils/response.js';
import { validateUserId } from '../utils/validation.js';
import { getRecentMessages } from '../services/conversationService.js';

export async function handleGetConversations(event) {
  const userId = event.pathParameters?.userId ?? event.queryStringParameters?.userId;
  const err = validateUserId(userId);
  if (err) return badRequest(err);

  try {
    const messages = await getRecentMessages(userId);
    return ok({ messages });
  } catch (e) {
    console.error('[conversations] GET error:', e);
    return serverError();
  }
}

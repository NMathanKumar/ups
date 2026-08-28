/**
 * chat.js — POST /api/chat
 *
 * Step 10: Delegates to the Agent Orchestrator.
 *
 * Flow:
 *   validate request
 *     → load conversation history
 *     → runAgent (intent → searchPolicy → KB → generateAnswer)
 *     → persist history
 *     → return { answer, sources, category }
 *
 * The API response shape is unchanged from Step 8 so the frontend requires no update.
 */

import { ok, badRequest, serverError } from '../utils/response.js';
import { validateMessage, validateUserId, parseBody } from '../utils/validation.js';
import { saveMessage, getRecentMessages } from '../services/conversationService.js';
import { runAgent } from '../agent/agent.js';

export async function handleChat(event) {
  // ── Parse & validate ─────────────────────────────────────────────────────
  const body = parseBody(event);
  if (body === null) return badRequest('Invalid JSON in request body.');

  const messageError = validateMessage(body.message);
  if (messageError) return badRequest(messageError);

  const userIdError = validateUserId(body.userId);
  if (userIdError) return badRequest(userIdError);

  const message   = body.message.trim();
  const userId    = body.userId.trim();
  const confirmed = body.confirmed === true;

  try {
    // ── Load recent conversation history ──────────────────────────────────
    const incomingHistory = Array.isArray(body.history) ? body.history : [];
    const storedHistory = await getRecentMessages(userId);
    const history = incomingHistory.length > 0 ? incomingHistory : storedHistory;

    // ── Run agent (intent → tools → Bedrock KB → generation) ─────────────
    let agentResult;
    try {
      agentResult = await runAgent({ message, userId, confirmed, history });
    } catch (agentErr) {
      console.error('[chat] Agent error:', agentErr.message);
      const msg = agentErr.message?.includes('generation')
        ? 'Unable to process the AI request. Model invocation failed.'
        : 'Unable to process the AI request. Knowledge Base retrieval failed.';
      return serverError(msg);
    }

    // Tool-layer failures (KB error caught by searchPolicy) surface as FAILED status
    if (agentResult.status === 'FAILED') {
      console.error('[chat] Agent tool failure:', agentResult.toolResults);
      return serverError('Unable to retrieve enterprise information.');
    }

    const { answer, sources, category } = agentResult;

    // ── Persist history (fire-and-forget — do not block response) ─────────
    Promise.all([
      saveMessage(userId, 'user', message),
      saveMessage(userId, 'assistant', answer),
    ]).catch((err) => console.error('[chat] Failed to save conversation history:', err));

    // ── Return frontend-compatible response ───────────────────────────────
    return ok({ answer, sources, category });

  } catch (err) {
    console.error('[chat] Unexpected error:', err);
    return serverError('Unable to process the request.');
  }
}

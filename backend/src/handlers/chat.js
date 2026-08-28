/**
 * chat.js — POST /api/chat
 *
 * RAG flow:
 * 1. Validate request
 * 2. Load recent conversation history
 * 3. Retrieve relevant KB chunks
 * 4. If no relevant chunks → return "not found" response (no hallucination)
 * 5. Invoke Bedrock model with grounded context
 * 6. Persist user + assistant messages
 * 7. Return structured response
 */

import { ok, badRequest, serverError } from '../utils/response.js';
import { validateMessage, validateUserId, parseBody } from '../utils/validation.js';
import { retrieveRelevantDocuments } from '../services/knowledgeBase.js';
import { generateAnswer } from '../services/bedrock.js';
import { saveMessage, getRecentMessages } from '../services/conversationService.js';

const NOT_FOUND_ANSWER =
  "I couldn't find this information in the available enterprise documents. " +
  "Please contact HR at hr-help@apex-enterprise.com or IT Support at it-support@apex-enterprise.com for assistance.";

export async function handleChat(event) {
  // Parse body
  const body = parseBody(event);
  if (body === null) {
    return badRequest('Invalid JSON in request body.');
  }

  // Validate inputs
  const messageError = validateMessage(body.message);
  if (messageError) return badRequest(messageError);

  const userIdError = validateUserId(body.userId);
  if (userIdError) return badRequest(userIdError);

  const message = body.message.trim();
  const userId  = body.userId.trim();

  try {
    // Step 1: Load recent conversation context
    const history = await getRecentMessages(userId);

    // Step 2: Retrieve relevant enterprise document chunks
    let chunks = [];
    try {
      chunks = await retrieveRelevantDocuments(message);
    } catch (kbErr) {
      console.error('[chat] KnowledgeBase retrieval error:', kbErr);
      return serverError('Unable to process the AI request. Knowledge Base retrieval failed.');
    }

    // Step 3: No relevant enterprise content — refuse to hallucinate
    if (chunks.length === 0) {
      // Still save the exchange so history reflects this
      await Promise.all([
        saveMessage(userId, 'user', message),
        saveMessage(userId, 'assistant', NOT_FOUND_ANSWER),
      ]);
      return ok({
        answer: NOT_FOUND_ANSWER,
        sources: [],
        category: null,
      });
    }

    // Step 4: Generate grounded answer
    let answer;
    try {
      answer = await generateAnswer(message, chunks, history);
    } catch (bedrockErr) {
      console.error('[chat] Bedrock model invocation error:', bedrockErr);
      return serverError('Unable to process the AI request. Model invocation failed.');
    }

    // Step 5: Save conversation history (fire-and-forget — do not block response)
    Promise.all([
      saveMessage(userId, 'user', message),
      saveMessage(userId, 'assistant', answer),
    ]).catch((err) => console.error('[chat] Failed to save conversation history:', err));

    // Step 6: Build sources list
    const sources = chunks.map((c) => ({
      document: c.source,
      category: c.category,
      relevance: Math.round(c.score * 100) / 100,
    }));

    // Determine primary category from highest-scoring chunk
    const primaryCategory = chunks[0]?.category ?? null;

    return ok({ answer, sources, category: primaryCategory });

  } catch (err) {
    console.error('[chat] Unexpected error:', err);
    return serverError('Unable to process the request.');
  }
}

/**
 * agent.js — Agent Orchestrator
 *
 * Step 10: Fully connected to the real Bedrock KB + generation pipeline.
 *
 * Flow:
 *   runAgent()
 *     → detectIntent / createPlan
 *     → executeTool('searchPolicy') → knowledgeBase.retrieveRelevantDocuments()
 *     → if KB has results → bedrock.generateAnswer()
 *     → return { intent, answer, sources, category, toolResults, status }
 */

import { detectIntent, createPlan } from './planner.js';
import { executeTool } from './tools.js';
import { generateAnswer } from '../services/bedrock.js';

const NOT_FOUND_ANSWER =
  "I couldn't find this information in the available enterprise documents. " +
  "Please contact HR at hr-help@apex-enterprise.com or IT Support at it-support@apex-enterprise.com for assistance.";

/**
 * Execute the agent workflow for a given user request.
 *
 * @param {object} params
 * @param {string}  params.message  - Employee question / instruction
 * @param {string}  params.userId   - Employee ID (for per-user isolation)
 * @param {Array}  [params.history] - Recent conversation messages (oldest first)
 * @returns {Promise<{
 *   intent:               string,
 *   answer:               string,
 *   sources:              Array<{ document: string, category: string, relevance: number }>,
 *   category:             string|null,
 *   toolResults:          Array,
 *   requiresConfirmation: boolean,
 *   status:               string,
 *   summary:              string,
 * }>}
 */
export async function runAgent({ message, userId, history = [] }) {
  if (!message || typeof message !== 'string') {
    throw new Error('Agent requires a valid message string.');
  }

  // ── Step 1: Classify intent & build action plan ──────────────────────────
  const intent = detectIntent(message);
  const plan   = createPlan(intent, message);

  const toolResults = [];
  let hasNotImplemented = false;
  let hasFailure        = false;

  // ── Step 2: Execute all planned tools sequentially ───────────────────────
  for (const step of plan.steps) {
    const result = await executeTool(step.tool, {
      query: message,
      message,
      userId,
      history,
    });

    toolResults.push(result);

    if (result.status === 'NOT_IMPLEMENTED') hasNotImplemented = true;
    if (result.status === 'FAILED')          hasFailure = true;
  }

  // ── Step 3: Extract KB documents retrieved by searchPolicy ───────────────
  // The KB search result is the foundation for grounded generation.
  const policyResult = toolResults.find(
    (r) => r.tool === 'searchPolicy' && r.status === 'SUCCESS'
  );
  const retrievedDocs = policyResult?.data?.documents ?? [];

  // ── Step 4: Generate grounded answer (or return "not found") ─────────────
  let answer;
  let sources   = [];
  let category  = null;

  const hasRetrievedContent = retrievedDocs.length > 0;

  if (!hasRetrievedContent) {
    // No relevant enterprise context → never hallucinate
    answer = NOT_FOUND_ANSWER;
  } else {
    try {
      answer = await generateAnswer(message, retrievedDocs, history);
    } catch (genErr) {
      console.error('[agent] Bedrock generation error:', genErr);
      // Throw upward — chat handler will translate to a 500
      throw new Error('Bedrock generation failed.');
    }

    sources = retrievedDocs.map((doc) => ({
      document:  doc.source,
      category:  doc.category,
      relevance: Math.round(doc.score * 100) / 100,
    }));

    category = retrievedDocs[0]?.category ?? null;
  }

  // ── Step 5: Determine overall agent status ────────────────────────────────
  let status = 'COMPLETED';
  if (hasFailure)          status = 'FAILED';
  else if (hasNotImplemented) status = 'PARTIAL_NOT_IMPLEMENTED';
  else if (plan.requiresConfirmation) status = 'REQUIRES_CONFIRMATION';

  const summary = buildSummary(intent, plan, toolResults, status, hasRetrievedContent);

  return {
    intent,
    answer,
    sources,
    category,
    toolResults,
    requiresConfirmation: plan.requiresConfirmation,
    status,
    summary,
  };
}

function buildSummary(intent, plan, toolResults, status, hasContent) {
  const successCount  = toolResults.filter((r) => r.status === 'SUCCESS').length;
  const unimplCount   = toolResults.filter((r) => r.status === 'NOT_IMPLEMENTED').length;
  const stepCount     = plan.steps.length;

  if (!hasContent && intent === 'POLICY_QUESTION') {
    return `No relevant enterprise documents found for intent ${intent}.`;
  }
  if (status === 'PARTIAL_NOT_IMPLEMENTED') {
    return `Intent ${intent}: ${successCount}/${stepCount} steps completed. ${unimplCount} workflow step(s) not yet implemented.`;
  }
  if (status === 'REQUIRES_CONFIRMATION') {
    return `Plan for ${intent} ready. Pending confirmation before write operations.`;
  }
  if (status === 'COMPLETED') {
    return `${intent} handled successfully (${successCount} steps).`;
  }
  return `Agent error while processing intent ${intent}.`;
}

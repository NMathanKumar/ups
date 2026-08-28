/**
 * agent.js — Agent Orchestrator
 *
 * Orchestrates intent classification, plan generation, and tool execution.
 * Returns a normalized execution report.
 */

import { detectIntent, createPlan } from './planner.js';
import { executeTool } from './tools.js';

/**
 * Execute the agent workflow for a given user request.
 *
 * @param {object} params
 * @param {string} params.message - Employee question / instruction
 * @param {string} params.userId - Employee ID
 * @param {Array} [params.history] - Optional conversation history
 * @returns {Promise<{ intent: string, plan: object, toolResults: Array, requiresConfirmation: boolean, status: string, summary: string }>}
 */
export async function runAgent({ message, userId, history = [] }) {
  if (!message || typeof message !== 'string') {
    throw new Error('Agent requires a valid message string.');
  }

  // Step 1: Detect intent & build action plan
  const intent = detectIntent(message);
  const plan   = createPlan(intent, message);

  const toolResults = [];
  let hasNotImplemented = false;
  let hasFailure = false;

  // Step 2: Execute planned tools
  for (const step of plan.steps) {
    const result = await executeTool(step.tool, {
      query: message,
      message,
      userId,
      history,
    });

    toolResults.push(result);

    if (result.status === 'NOT_IMPLEMENTED') {
      hasNotImplemented = true;
    } else if (result.status === 'FAILED') {
      hasFailure = true;
    }
  }

  // Step 3: Determine overall agent status
  let status = 'COMPLETED';
  if (hasFailure) {
    status = 'FAILED';
  } else if (hasNotImplemented) {
    status = 'PARTIAL_NOT_IMPLEMENTED';
  } else if (plan.requiresConfirmation) {
    status = 'REQUIRES_CONFIRMATION';
  }

  // Step 4: Generate summary
  const summary = generateSummary(intent, plan, toolResults, status);

  return {
    intent,
    plan,
    toolResults,
    requiresConfirmation: plan.requiresConfirmation,
    status,
    summary,
  };
}

function generateSummary(intent, plan, toolResults, status) {
  const stepCount = plan.steps.length;
  const executedCount = toolResults.filter((r) => r.status === 'SUCCESS').length;
  const unimplCount = toolResults.filter((r) => r.status === 'NOT_IMPLEMENTED').length;

  if (status === 'PARTIAL_NOT_IMPLEMENTED') {
    return `Identified intent ${intent}. Executed ${executedCount}/${stepCount} steps. ${unimplCount} action steps require enterprise workflow implementation (Step 10-14).`;
  }
  if (status === 'REQUIRES_CONFIRMATION') {
    return `Plan for ${intent} generated. Requires confirmation before executing write operations.`;
  }
  if (status === 'COMPLETED') {
    return `Successfully executed plan for ${intent} (${executedCount} steps).`;
  }
  return `Agent execution encountered errors while processing intent ${intent}.`;
}

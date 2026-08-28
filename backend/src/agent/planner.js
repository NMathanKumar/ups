/**
 * planner.js — Intent Classification & Action Plan Generator
 *
 * Deterministically classifies employee requests into enterprise intents
 * and constructs structured execution plans for the agent orchestrator.
 */

import { getToolMetadata } from './tools.js';

export const INTENTS = {
  POLICY_QUESTION:     'POLICY_QUESTION',
  MATERNITY_LEAVE:     'MATERNITY_LEAVE',
  RESOURCE_ALLOCATION: 'RESOURCE_ALLOCATION',
  EMPLOYEE_TRANSFER:   'EMPLOYEE_TRANSFER',
  INTERN_ONBOARDING:   'INTERN_ONBOARDING',
  IT_SUPPORT:          'IT_SUPPORT',
  TASK_CREATION:       'TASK_CREATION',
  GENERAL:             'GENERAL',
};

/**
 * Classify a user request into a known enterprise intent.
 *
 * @param {string} message
 * @returns {string} One of the INTENTS values
 */
export function detectIntent(message) {
  if (!message || typeof message !== 'string') return INTENTS.GENERAL;
  const text = message.toLowerCase().trim();

  if (/\b(maternity|pregnancy|pregnant|parental leave|paternity|birth leave)\b/.test(text)) {
    return INTENTS.MATERNITY_LEAVE;
  }

  if (/\b(100 employees|resource allocation|staffing|allocate staff|project team|assign staff|available resources)\b/.test(text)) {
    return INTENTS.RESOURCE_ALLOCATION;
  }

  if (/\b(transfer|relocate|move employee|department transfer|change team)\b/.test(text)) {
    return INTENTS.EMPLOYEE_TRANSFER;
  }

  if (/\b(intern|onboard|new hire|onboarding plan|internship)\b/.test(text)) {
    return INTENTS.INTERN_ONBOARDING;
  }

  if (/\b(vpn|password|laptop|wifi|network|it support|hardware|software|reset password)\b/.test(text)) {
    return INTENTS.IT_SUPPORT;
  }

  if (/\b(create task|add task|remind me|add reminder|schedule task|new task)\b/.test(text)) {
    return INTENTS.TASK_CREATION;
  }

  if (/\b(policy|how many|leave|days|wfh|work from home|balance|rules|guidelines|eligibility|what is)\b/.test(text)) {
    return INTENTS.POLICY_QUESTION;
  }

  return INTENTS.GENERAL;
}

/**
 * Generate a structured execution plan based on intent and query.
 *
 * @param {string} intent
 * @param {string} message
 * @returns {{ intent: string, requiresPolicy: boolean, requiresEmployeeData: boolean, requiresConfirmation: boolean, steps: Array<{ tool: string, type: string, requiresConfirmation: boolean }> }}
 */
export function createPlan(intent, message) {
  const selectedIntent = Object.values(INTENTS).includes(intent) ? intent : INTENTS.GENERAL;

  let toolNames = [];
  let requiresPolicy = false;
  let requiresEmployeeData = false;

  switch (selectedIntent) {
    case INTENTS.MATERNITY_LEAVE:
      requiresPolicy = true;
      requiresEmployeeData = true;
      toolNames = ['searchPolicy', 'getEmployee', 'checkLeaveBalance', 'createLeaveRequest', 'createHRTask'];
      break;

    case INTENTS.RESOURCE_ALLOCATION:
      requiresEmployeeData = true;
      toolNames = ['findAvailableResources', 'allocateResources'];
      break;

    case INTENTS.EMPLOYEE_TRANSFER:
      requiresEmployeeData = true;
      toolNames = ['getEmployee', 'getEmployeeAssets', 'transferEmployee'];
      break;

    case INTENTS.INTERN_ONBOARDING:
      toolNames = ['createOnboarding', 'createTask'];
      break;

    case INTENTS.IT_SUPPORT:
      requiresPolicy = true;
      toolNames = ['searchPolicy', 'getEmployeeAssets', 'createITTicket'];
      break;

    case INTENTS.TASK_CREATION:
      toolNames = ['createTask'];
      break;

    case INTENTS.POLICY_QUESTION:
    case INTENTS.GENERAL:
    default:
      requiresPolicy = true;
      toolNames = ['searchPolicy'];
      break;
  }

  const steps = toolNames.map((t) => {
    const meta = getToolMetadata(t) ?? { type: 'READ', requiresConfirmation: false };
    return {
      tool: t,
      type: meta.type,
      requiresConfirmation: meta.requiresConfirmation,
    };
  });

  const requiresConfirmation = steps.some((s) => s.requiresConfirmation);

  return {
    intent: selectedIntent,
    requiresPolicy,
    requiresEmployeeData,
    requiresConfirmation,
    steps,
  };
}

/**
 * planner.js — Intent Classification & Action Plan Generator
 *
 * Deterministically classifies employee requests into enterprise intents
 * and constructs structured execution plans for the agent orchestrator.
 */

import { getToolMetadata } from './tools.js';

export const INTENTS = {
  POLICY_QUESTION:         'POLICY_QUESTION',
  MATERNITY_LEAVE:         'MATERNITY_LEAVE',
  LEAVE_BALANCE:           'LEAVE_BALANCE',
  RESOURCE_ALLOCATION:     'RESOURCE_ALLOCATION',
  EMPLOYEE_TRANSFER:       'EMPLOYEE_TRANSFER',
  INTERN_ONBOARDING:       'INTERN_ONBOARDING',
  INTERN_ONBOARDING_STATUS:'INTERN_ONBOARDING_STATUS',
  EMPLOYEE_LOOKUP:         'EMPLOYEE_LOOKUP',
  EMPLOYEE_ASSETS:         'EMPLOYEE_ASSETS',
  REMINDER_CREATION:       'REMINDER_CREATION',
  IT_SUPPORT:              'IT_SUPPORT',
  TASK_CREATION:           'TASK_CREATION',
  GENERAL:                 'GENERAL',
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

  if (/\b(my leave|days do i have|how many leave days do i|leave balance|how much leave do i|check my leave)\b/i.test(text)) {
    return INTENTS.LEAVE_BALANCE;
  }

  if (/\b(vpn|password|wifi|network|it support|reset password|software access|laptop support|connecting to vpn)\b/i.test(text)) {
    return INTENTS.IT_SUPPORT;
  }

  if (/\b(equipment|assigned assets|hardware list|my devices|what equipment|what assets)\b/i.test(text)) {
    return INTENTS.EMPLOYEE_ASSETS;
  }

  if (/\b(who is|who\'s|employee info|lookup employee|details for emp|emp\d+ details)\b/i.test(text) && /\b(emp\d+|priya|meera|alex|john|sarah|sharma|nair)\b/i.test(text)) {
    return INTENTS.EMPLOYEE_LOOKUP;
  }

  if (/\b(100 employees|resource allocation|staffing|allocate staff|project team|assign staff|available resources|who is available|available for a project|available for project)\b/i.test(text)) {
    return INTENTS.RESOURCE_ALLOCATION;
  }

  if (/\b(create task|add task|remind me|add reminder|schedule task|new task|set reminder|schedule reminder|create reminder)\b/i.test(text)) {
    return INTENTS.TASK_CREATION;
  }

  if (/\b(transfer|relocate|move employee|department transfer|change team)\b/.test(text)) {
    return INTENTS.EMPLOYEE_TRANSFER;
  }

  if (/\b(interns?|onboard\w*|new hire|onboarding plan|internship)\b/i.test(text)) {
    // 1. Status query? e.g. "What onboarding tasks do I have?", "What is my onboarding status?", "What onboarding tasks are pending for EMP007?"
    if (/\b(status|pending|my tasks|tasks do i have|tasks have i|completed|progress|check status)\b/i.test(text)) {
      return INTENTS.INTERN_ONBOARDING_STATUS;
    }
    // 2. Informational question? e.g. "What documents do I need for intern onboarding?", "What training is required for interns?", "How does intern onboarding work?"
    if (/\b(what|how|which|document|documents|training|guide|checklist|policy|requirement|requirements|info|first day|required|need)\b/i.test(text)) {
      return INTENTS.POLICY_QUESTION;
    }
    // 3. Otherwise action request to onboard an employee/intern
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
      toolNames = ['searchPolicy', 'getEmployee', 'checkLeaveBalance', 'createLeaveRequest', 'createHRTask', 'getEmployeeAssets', 'createITTicket'];
      break;

    case INTENTS.LEAVE_BALANCE:
      requiresEmployeeData = true;
      toolNames = ['getEmployee', 'checkLeaveBalance'];
      break;

    case INTENTS.EMPLOYEE_LOOKUP:
      requiresEmployeeData = true;
      toolNames = ['getEmployee'];
      break;

    case INTENTS.EMPLOYEE_ASSETS:
      requiresEmployeeData = true;
      toolNames = ['getEmployee', 'getEmployeeAssets'];
      break;

    case INTENTS.REMINDER_CREATION:
      toolNames = ['createReminder'];
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
      requiresPolicy = true;
      requiresEmployeeData = true;
      toolNames = ['searchPolicy', 'getEmployee', 'createOnboarding'];
      break;

    case INTENTS.INTERN_ONBOARDING_STATUS:
      requiresEmployeeData = true;
      toolNames = ['getOnboardingStatus'];
      break;

    case INTENTS.IT_SUPPORT:
      requiresPolicy = true;
      toolNames = ['searchPolicy'];
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

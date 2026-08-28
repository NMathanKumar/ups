/**
 * tools.js — Enterprise Tool Definition & Execution Layer
 *
 * Defines tool metadata (READ vs WRITE, confirmation requirements)
 * and predictable execution result contracts:
 * {
 *   success: boolean,
 *   status: "SUCCESS" | "NO_RESULTS" | "NOT_IMPLEMENTED" | "FAILED",
 *   tool: string,
 *   data: any,
 *   error: string | null
 * }
 */

import { retrieveRelevantDocuments } from '../services/knowledgeBase.js';

export const TOOL_METADATA = {
  searchPolicy: {
    name: 'searchPolicy',
    type: 'READ',
    requiresConfirmation: false,
    description: 'Searches enterprise policy documents via Bedrock Knowledge Base',
  },
  getEmployee: {
    name: 'getEmployee',
    type: 'READ',
    requiresConfirmation: false,
    description: 'Retrieves employee profile and organizational details',
  },
  checkLeaveBalance: {
    name: 'checkLeaveBalance',
    type: 'READ',
    requiresConfirmation: false,
    description: 'Checks employee leave balances (annual, maternity, sick leave)',
  },
  getEmployeeAssets: {
    name: 'getEmployeeAssets',
    type: 'READ',
    requiresConfirmation: false,
    description: 'Retrieves assigned IT hardware and software assets',
  },
  findAvailableResources: {
    name: 'findAvailableResources',
    type: 'READ',
    requiresConfirmation: false,
    description: 'Finds available staff/resources matching skill or department criteria',
  },
  createLeaveRequest: {
    name: 'createLeaveRequest',
    type: 'WRITE',
    requiresConfirmation: true,
    description: 'Submits a formal leave request (e.g. maternity, annual leave)',
  },
  createHRTask: {
    name: 'createHRTask',
    type: 'WRITE',
    requiresConfirmation: true,
    description: 'Creates an HR action task or ticket',
  },
  createITTicket: {
    name: 'createITTicket',
    type: 'WRITE',
    requiresConfirmation: true,
    description: 'Submits an IT support or hardware replacement ticket',
  },
  allocateResources: {
    name: 'allocateResources',
    type: 'WRITE',
    requiresConfirmation: true,
    description: 'Allocates resources/staff to a project',
  },
  transferEmployee: {
    name: 'transferEmployee',
    type: 'WRITE',
    requiresConfirmation: true,
    description: 'Initiates employee department or location transfer workflow',
  },
  createOnboarding: {
    name: 'createOnboarding',
    type: 'WRITE',
    requiresConfirmation: true,
    description: 'Creates intern/employee onboarding plan and task list',
  },
  createTask: {
    name: 'createTask',
    type: 'WRITE',
    requiresConfirmation: false,
    description: 'Creates a general employee task or reminder',
  },
};

/**
 * Get metadata for a specific tool.
 * @param {string} toolName
 * @returns {object|null}
 */
export function getToolMetadata(toolName) {
  return TOOL_METADATA[toolName] ?? null;
}

/**
 * Execute a tool by name with parameters.
 *
 * @param {string} toolName
 * @param {object} params
 * @returns {Promise<{ success: boolean, status: string, tool: string, data: any, error: string|null }>}
 */
export async function executeTool(toolName, params = {}) {
  const meta = getToolMetadata(toolName);
  if (!meta) {
    return {
      success: false,
      status: 'FAILED',
      tool: toolName,
      data: null,
      error: `Unknown tool: ${toolName}`,
    };
  }

  switch (toolName) {
    case 'searchPolicy': {
      try {
        const query = params.query ?? params.message ?? '';
        const docs = await retrieveRelevantDocuments(query);

        // Distinguish between "retrieved documents" and "empty retrieval" —
        // empty is NOT a success for the policy answer path.
        if (docs.length === 0) {
          return {
            success: true,
            status: 'NO_RESULTS',
            tool: toolName,
            data: { documents: [] },
            error: null,
          };
        }

        return {
          success: true,
          status: 'SUCCESS',
          tool: toolName,
          data: { documents: docs },
          error: null,
        };
      } catch (err) {
        return {
          success: false,
          status: 'FAILED',
          tool: toolName,
          data: null,
          error: err.message,
        };
      }
    }

    // All other enterprise operational tools: stubs.
    // IMPORTANT: Never return fake success.
    default:
      return {
        success: false,
        status: 'NOT_IMPLEMENTED',
        tool: toolName,
        data: null,
        error: `Tool "${toolName}" is not implemented yet.`,
      };
  }
}

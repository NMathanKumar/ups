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
import {
  getEmployee,
  checkLeaveBalance,
  getEmployeeAssets,
  findAvailableResources,
} from '../services/enterpriseSystems.js';
import {
  createLeaveRequest as dbCreateLeaveRequest,
  createHRTask       as dbCreateHRTask,
  createITTicket     as dbCreateITTicket,
  createOnboardingWorkflow,
  createTaskRecord,
  getOnboardingStatus,
  transferEmployeeRecord,
} from '../services/workflowService.js';

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
  getOnboardingStatus: {
    name: 'getOnboardingStatus',
    type: 'READ',
    requiresConfirmation: false,
    description: 'Retrieves current onboarding workflow status and pending/completed tasks for an employee',
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
        if (docs.length === 0) {
          return { success: true, status: 'NO_RESULTS', tool: toolName, data: { documents: [] }, error: null };
        }
        return { success: true, status: 'SUCCESS', tool: toolName, data: { documents: docs }, error: null };
      } catch (err) {
        return { success: false, status: 'FAILED', tool: toolName, data: null, error: err.message };
      }
    }

    case 'getEmployee': {
      const res = await getEmployee(params.employeeId ?? params.userId);
      return { ...res, tool: toolName };
    }

    case 'checkLeaveBalance': {
      const res = await checkLeaveBalance(params.employeeId ?? params.userId);
      return { ...res, tool: toolName };
    }

    case 'getEmployeeAssets': {
      const res = await getEmployeeAssets(params.employeeId ?? params.userId);
      return { ...res, tool: toolName };
    }

    case 'findAvailableResources': {
      const res = await findAvailableResources(params.criteria ?? {});
      return { ...res, tool: toolName };
    }

    case 'getOnboardingStatus': {
      const targetEmp = params.employeeId ?? params.userId;
      const res = await getOnboardingStatus({ userId: targetEmp, employeeId: targetEmp });
      return { ...res, tool: toolName };
    }

    case 'createLeaveRequest': {
      const { userId, startDate, endDate, durationDays } = params;
      if (!startDate || !endDate) {
        return { success: false, status: 'FAILED', tool: toolName, data: null, error: 'startDate and endDate are required.' };
      }
      const res = await dbCreateLeaveRequest({ userId, startDate, endDate, durationDays });
      return { ...res, tool: toolName };
    }

    case 'createHRTask': {
      const { userId, workflowId, title, dueDate } = params;
      if (!userId || !title) {
        return { success: false, status: 'FAILED', tool: toolName, data: null, error: 'userId and title are required.' };
      }
      const res = await dbCreateHRTask({ userId, workflowId, title, dueDate });
      return { ...res, tool: toolName };
    }

    case 'createITTicket': {
      const { userId, workflowId, assets } = params;
      if (!userId || !assets || assets.length === 0) {
        // No assets → skip IT ticket (not an error)
        return { success: true, status: 'SKIPPED', tool: toolName, data: null, error: null };
      }
      const res = await dbCreateITTicket({ userId, workflowId, assets });
      return { ...res, tool: toolName };
    }

    case 'createOnboarding': {
      const { userId, employeeId, role, startDate } = params;
      const targetEmp = employeeId ?? userId;

      const empRes = await getEmployee(targetEmp);
      const empName = empRes.success && empRes.data ? empRes.data.name : targetEmp;

      const wfRes = await createOnboardingWorkflow({
        userId: targetEmp,
        employeeName: empName,
        role: role || 'Software Engineering Intern',
        startDate: startDate || new Date().toISOString().split('T')[0],
      });

      if (!wfRes.success) return { ...wfRes, tool: toolName };

      const workflowId = wfRes.data.workflowId;

      const t1 = await createTaskRecord({
        userId: targetEmp,
        workflowId,
        title: `Complete HR tax & direct deposit forms in HR Portal`,
        category: 'HR',
      });
      const t2 = await createTaskRecord({
        userId: targetEmp,
        workflowId,
        title: `Set up SSO password, Duo MFA & IT laptop provisioning`,
        category: 'IT',
      });
      const t3 = await createTaskRecord({
        userId: targetEmp,
        workflowId,
        title: `Complete mandatory Security Awareness Training`,
        category: 'LEARNING',
      });

      const tasksCreated = [t1.data, t2.data, t3.data].filter(Boolean);

      return {
        success: true,
        status: 'SUCCESS',
        tool: toolName,
        data: {
          workflow: wfRes.data,
          tasksCreated,
        },
        error: null,
      };
    }

    case 'createTask': {
      const { userId, title, category, dueDate } = params;
      if (!userId || !title) {
        return { success: false, status: 'FAILED', tool: toolName, data: null, error: 'userId and title are required.' };
      }
      const res = await createTaskRecord({ userId, title, category: category || 'GENERAL', dueDate });
      return { ...res, tool: toolName };
    }

    case 'transferEmployee': {
      const { userId, employeeId, targetDepartment, targetManager, reason } = params;
      const targetEmp = employeeId ?? userId;
      if (!targetEmp || !targetDepartment) {
        return { success: false, status: 'FAILED', tool: toolName, data: null, error: 'employeeId and targetDepartment are required.' };
      }
      const res = await transferEmployeeRecord({ userId: targetEmp, targetDepartment, targetManager, reason });
      return { ...res, tool: toolName };
    }

    // Remaining WRITE tools — not yet implemented
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

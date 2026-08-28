/**
 * workflowService.js — DynamoDB persistence for agentic workflow state
 *
 * Used by WRITE tools (createLeaveRequest, createHRTask, createITTicket) to
 * persist real workflow records.
 *
 * Architecture:
 *   tools.js → workflowService.js → DynamoDB (workflows table + tasks table)
 *
 * Never fakes successful operations.
 */

import { randomUUID } from 'crypto';
import * as db from './dynamodb.js';
import { config } from '../config/environment.js';

const workflowsTable = () => config.workflowsTableName;
const tasksTable     = () => config.tasksTableName;

// ── Leave Request ────────────────────────────────────────────────────────────

/**
 * Create a maternity leave workflow record in DynamoDB.
 *
 * @param {{ userId: string, startDate: string, endDate: string, durationDays: number }} params
 * @returns {Promise<{ success: boolean, status: string, data: object|null, error: string|null }>}
 */
export async function createLeaveRequest({ userId, startDate, endDate, durationDays }) {
  const workflowId = `wf-${randomUUID()}`;
  const now = new Date().toISOString();

  const record = {
    workflowId,
    type:      'MATERNITY_LEAVE',
    userId,
    status:    'PENDING_APPROVAL',
    startDate,
    endDate,
    createdAt: now,
    updatedAt: now,
    metadata:  { durationDays },
  };

  try {
    await db.putItem(workflowsTable(), record);
    return { success: true, status: 'SUCCESS', data: record, error: null };
  } catch (err) {
    console.error('[workflowService] createLeaveRequest error:', err);
    return { success: false, status: 'FAILED', data: null, error: err.message };
  }
}

// ── HR Task ──────────────────────────────────────────────────────────────────

/**
 * Create an HR approval task in the tasks DynamoDB table.
 *
 * @param {{ userId: string, workflowId: string, title: string, dueDate?: string }} params
 * @returns {Promise<{ success: boolean, status: string, data: object|null, error: string|null }>}
 */
export async function createHRTask({ userId, workflowId, title, dueDate }) {
  const taskId = `task-${randomUUID()}`;
  const now = new Date().toISOString();

  const dueDateValue = dueDate ?? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const task = {
    userId,
    taskId,
    title,
    category:   'HR',
    dueDate:    dueDateValue,
    completed:  false,
    urgent:     false,
    workflowId,
    createdAt:  now,
  };

  try {
    await db.putItem(tasksTable(), task);
    return { success: true, status: 'SUCCESS', data: task, error: null };
  } catch (err) {
    console.error('[workflowService] createHRTask error:', err);
    return { success: false, status: 'FAILED', data: null, error: err.message };
  }
}

// ── IT Ticket ────────────────────────────────────────────────────────────────

/**
 * Create an IT asset-return task in the tasks table.
 *
 * @param {{ userId: string, workflowId: string, assets: Array }} params
 * @returns {Promise<{ success: boolean, status: string, data: object|null, error: string|null }>}
 */
export async function createITTicket({ userId, workflowId, assets }) {
  const taskId = `task-${randomUUID()}`;
  const now = new Date().toISOString();

  const assetList = assets.map((a) => `${a.type} (${a.assetId})`).join(', ');
  const title = `Return company assets before maternity leave: ${assetList}`;

  const task = {
    userId,
    taskId,
    title,
    category:   'IT',
    dueDate:    null,
    completed:  false,
    urgent:     false,
    workflowId,
    createdAt:  now,
  };

  try {
    await db.putItem(tasksTable(), task);
    return { success: true, status: 'SUCCESS', data: task, error: null };
  } catch (err) {
    console.error('[workflowService] createITTicket error:', err);
    return { success: false, status: 'FAILED', data: null, error: err.message };
  }
}

// ── General / Onboarding Task Record ─────────────────────────────────────────

/**
 * Create a task record in the tasks table.
 *
 * @param {{ userId: string, workflowId?: string, title: string, category?: string, dueDate?: string }} params
 * @returns {Promise<{ success: boolean, status: string, data: object|null, error: string|null }>}
 */
export async function createTaskRecord({ userId, workflowId = null, title, category = 'ONBOARDING', dueDate = null }) {
  const taskId = `task-${randomUUID()}`;
  const now = new Date().toISOString();

  const task = {
    userId,
    taskId,
    title,
    category,
    dueDate,
    completed: false,
    urgent:    false,
    workflowId: workflowId || null,
    createdAt: now,
  };

  try {
    await db.putItem(tasksTable(), task);
    return { success: true, status: 'SUCCESS', data: task, error: null };
  } catch (err) {
    console.error('[workflowService] createTaskRecord error:', err);
    return { success: false, status: 'FAILED', data: null, error: err.message };
  }
}

// ── Onboarding Workflow ──────────────────────────────────────────────────────

/**
 * Create an Intern Onboarding workflow record in DynamoDB.
 *
 * @param {{ userId: string, employeeName?: string, role?: string, startDate?: string, tasksCreated?: Array }} params
 * @returns {Promise<{ success: boolean, status: string, data: object|null, error: string|null }>}
 */
export async function createOnboardingWorkflow({ userId, employeeName, role, startDate, tasksCreated = [] }) {
  const workflowId = `wf-${randomUUID()}`;
  const now = new Date().toISOString();

  const record = {
    workflowId,
    type:         'INTERN_ONBOARDING',
    userId,
    employeeId:   userId,
    employeeName: employeeName || userId,
    role:         role || 'Software Engineering Intern',
    status:       'IN_PROGRESS',
    startDate:    startDate || now.split('T')[0],
    createdAt:    now,
    updatedAt:    now,
    tasksCreated: tasksCreated.map((t) => t.taskId || t),
  };

  try {
    await db.putItem(workflowsTable(), record);
    return { success: true, status: 'SUCCESS', data: record, error: null };
  } catch (err) {
    console.error('[workflowService] createOnboardingWorkflow error:', err);
    return { success: false, status: 'FAILED', data: null, error: err.message };
  }
}

/**
 * Retrieve onboarding workflow and task status for an employee.
 *
 * @param {{ userId: string, employeeId?: string }} params
 * @returns {Promise<{ success: boolean, status: string, data: object|null, error: string|null }>}
 */
export async function getOnboardingStatus({ userId, employeeId }) {
  const targetId = employeeId ?? userId;

  try {
    // Scan/query workflows for matching targetId and type = INTERN_ONBOARDING
    const allWorkflows = await db.scanItems(workflowsTable());
    const onboardingWf = allWorkflows.find(
      (w) => (w.userId === targetId || w.employeeId === targetId) && w.type === 'INTERN_ONBOARDING'
    );

    if (!onboardingWf) {
      return {
        success: true,
        status:  'NO_RESULTS',
        data:    null,
        error:   null,
        message: `No onboarding workflow is currently recorded for employee ${targetId}.`,
      };
    }

    // Retrieve tasks associated with this employee / workflow
    const allTasks = await db.scanItems(tasksTable());
    const empTasks = allTasks.filter(
      (t) => t.userId === targetId || (onboardingWf.workflowId && t.workflowId === onboardingWf.workflowId)
    );

    return {
      success: true,
      status:  'SUCCESS',
      data: {
        workflow: onboardingWf,
        tasks:    empTasks,
      },
      error: null,
    };
  } catch (err) {
    console.error('[workflowService] getOnboardingStatus error:', err);
    return { success: false, status: 'FAILED', data: null, error: err.message };
  }
}

// ── Employee Transfer ────────────────────────────────────────────────────────

/**
 * Persist employee department transfer workflow in DynamoDB.
 *
 * @param {{ userId: string, targetDepartment: string, targetManager?: string, reason?: string }} params
 * @returns {Promise<{ success: boolean, status: string, data: object|null, error: string|null }>}
 */
export async function transferEmployeeRecord({ userId, targetDepartment, targetManager = 'HR Manager', reason = '' }) {
  const workflowId = `trf-${randomUUID()}`;
  const now = new Date().toISOString();

  const record = {
    workflowId,
    type:             'EMPLOYEE_TRANSFER',
    userId,
    status:           'COMPLETED',
    targetDepartment,
    targetManager,
    reason:           reason || 'Internal Department Transfer & Mobility Request',
    createdAt:        now,
    updatedAt:        now,
  };

  try {
    await db.putItem(workflowsTable(), record);
    await createHRTask({
      userId,
      workflowId,
      title: `Process employee transfer to ${targetDepartment} (Manager: ${targetManager})`,
    });
    await createITTicket({
      userId,
      workflowId,
      assets: [{ type: 'IT Security & SSO Re-configuration', assetId: `PERM-${userId}` }],
    });

    return { success: true, status: 'SUCCESS', data: record, error: null };
  } catch (err) {
    console.error('[workflowService] transferEmployeeRecord error:', err);
    return { success: false, status: 'FAILED', data: null, error: err.message };
  }
}

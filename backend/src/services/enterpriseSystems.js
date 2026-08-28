/**
 * enterpriseSystems.js — Lightweight Enterprise Data Service
 *
 * READ-only service that provides employee, leave, asset, and resource data
 * for the WorkPilot AI agent workflows.
 *
 * NOTE: This reads from demo JSON datasets.
 * In production this would call real HRIS / ITSM / resource-management APIs.
 *
 * Architecture:
 *   agent.js → tools.js → enterpriseSystems.js → mock-data/*.json
 *
 * DynamoDB is NOT used here — it handles tasks, reminders, conversations,
 * and future workflow state. Enterprise operational data comes from this service.
 *
 * RAG policy content comes exclusively from Bedrock Knowledge Base.
 * Do NOT mix policy documents into this service.
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Load demo datasets once at module load (small JSON, safe to cache)
const employees    = require('../../mock-data/employees.json');
const leaveData    = require('../../mock-data/leave-balances.json');
const assetsData   = require('../../mock-data/assets.json');

/** Standard tool result shape */
function result(success, status, data = null, error = null) {
  return { success, status, data, error };
}

// ── getEmployee ─────────────────────────────────────────────────────────────

/**
 * Look up an employee by ID.
 * @param {string} employeeId
 */
export function getEmployee(employeeId) {
  if (!employeeId) {
    return result(false, 'INVALID_INPUT', null, 'employeeId is required.');
  }
  const emp = employees.find((e) => e.employeeId === employeeId);
  if (!emp) {
    return result(false, 'NOT_FOUND', null, `Employee ${employeeId} not found.`);
  }
  return result(true, 'SUCCESS', emp);
}

// ── checkLeaveBalance ───────────────────────────────────────────────────────

/**
 * Return leave balances for an employee.
 * Balances = enterprise data. Policy rules = Bedrock KB (not here).
 * @param {string} employeeId
 */
export function checkLeaveBalance(employeeId) {
  if (!employeeId) {
    return result(false, 'INVALID_INPUT', null, 'employeeId is required.');
  }
  const balance = leaveData.find((l) => l.employeeId === employeeId);
  if (!balance) {
    return result(false, 'NOT_FOUND', null, `Leave balance for ${employeeId} not found.`);
  }
  return result(true, 'SUCCESS', {
    employeeId:            balance.employeeId,
    annualLeave:           balance.annualLeave,
    annualLeaveUsed:       balance.annualLeaveUsed,
    annualLeaveRemaining:  balance.annualLeave - balance.annualLeaveUsed,
    sickLeave:             balance.sickLeave,
    sickLeaveUsed:         balance.sickLeaveUsed,
    maternityLeaveEligible: balance.maternityLeaveEligible,
    maternityLeaveDays:    balance.maternityLeaveDays,
  });
}

// ── getEmployeeAssets ───────────────────────────────────────────────────────

/**
 * Return IT assets assigned to an employee.
 * Returns an empty assets array (not an error) when the employee has no assets.
 * @param {string} employeeId
 */
export function getEmployeeAssets(employeeId) {
  if (!employeeId) {
    return result(false, 'INVALID_INPUT', null, 'employeeId is required.');
  }
  // Verify the employee exists first
  const emp = employees.find((e) => e.employeeId === employeeId);
  if (!emp) {
    return result(false, 'NOT_FOUND', null, `Employee ${employeeId} not found.`);
  }
  const record = assetsData.find((a) => a.employeeId === employeeId);
  const assets = record?.assets ?? [];
  return result(true, 'SUCCESS', { employeeId, assets });
}

// ── findAvailableResources ──────────────────────────────────────────────────

/**
 * Find available employees matching simple criteria.
 * Supports: department, location, status (defaults to ACTIVE or AVAILABLE).
 *
 * @param {{ department?: string, location?: string, status?: string }} criteria
 */
export function findAvailableResources(criteria = {}) {
  const { department, location, status } = criteria;

  let filtered = employees.filter((e) => {
    const matchDept   = department ? e.department?.toLowerCase() === department.toLowerCase() : true;
    const matchLoc    = location   ? e.location?.toLowerCase()   === location.toLowerCase()   : true;
    const matchStatus = status
      ? e.status?.toLowerCase() === status.toLowerCase()
      : ['active', 'available'].includes(e.status?.toLowerCase());
    return matchDept && matchLoc && matchStatus;
  });

  return result(true, 'SUCCESS', {
    criteria,
    count: filtered.length,
    resources: filtered.map(({ employeeId, name, role, department, location, status }) => ({
      employeeId, name, role, department, location, status,
    })),
  });
}

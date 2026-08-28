/**
 * enterpriseSystems.js — Enterprise Structured Data Service
 *
 * READ-only service providing employee, leave, asset, and resource data
 * via DynamoDB queries. This service is the single point of access for
 * enterprise operational data in the agent layer.
 *
 * Architecture:
 *   agent.js → tools.js → enterpriseSystems.js → DynamoDB
 *
 * In production: replace this service with calls to HRIS, ITSM, or LMS APIs
 * without changing the agent or tools layer.
 *
 * Policy documents are NOT stored here — they live in S3 + Bedrock Knowledge Base.
 * Do NOT mix policy text with structured enterprise data.
 */

import * as db from './dynamodb.js';
import { config } from '../config/environment.js';

const tables = {
  employees:    () => config.employeesTableName,
  leaveBalances: () => config.leaveBalancesTableName,
  assets:       () => config.assetsTableName,
  projects:     () => config.projectsTableName,
};

/** Standard tool result shape */
function result(success, status, data = null, error = null) {
  return { success, status, data, error };
}

// ── getEmployee ──────────────────────────────────────────────────────────────

/**
 * Look up an employee by ID from DynamoDB.
 * @param {string} employeeId
 * @returns {Promise<{ success, status, data, error }>}
 */
export async function getEmployee(employeeId) {
  if (!employeeId) {
    return result(false, 'INVALID_INPUT', null, 'employeeId is required.');
  }
  try {
    const emp = await db.getItem(tables.employees(), { employeeId });
    if (!emp) {
      return result(false, 'NOT_FOUND', null, `Employee ${employeeId} not found.`);
    }
    return result(true, 'SUCCESS', emp);
  } catch (err) {
    console.error('[enterpriseSystems] getEmployee error:', err.message);
    return result(false, 'FAILED', null, err.message);
  }
}

// ── checkLeaveBalance ────────────────────────────────────────────────────────

/**
 * Return leave balance for an employee from DynamoDB.
 * Balance = enterprise data. Policy rules = Bedrock KB (not here).
 * @param {string} employeeId
 * @returns {Promise<{ success, status, data, error }>}
 */
export async function checkLeaveBalance(employeeId) {
  if (!employeeId) {
    return result(false, 'INVALID_INPUT', null, 'employeeId is required.');
  }
  try {
    const balance = await db.getItem(tables.leaveBalances(), { employeeId });
    if (!balance) {
      return result(false, 'NOT_FOUND', null, `Leave balance for ${employeeId} not found.`);
    }
    return result(true, 'SUCCESS', {
      employeeId:             balance.employeeId,
      annualLeave:            balance.annualLeave            ?? 0,
      annualLeaveUsed:        balance.annualLeaveUsed        ?? 0,
      annualLeaveRemaining:   (balance.annualLeave ?? 0) - (balance.annualLeaveUsed ?? 0),
      sickLeave:              balance.sickLeave              ?? 0,
      sickLeaveUsed:          balance.sickLeaveUsed          ?? 0,
      maternityLeaveEligible: balance.maternityLeaveEligible ?? false,
      maternityLeaveDays:     balance.maternityLeaveDays     ?? 0,
    });
  } catch (err) {
    console.error('[enterpriseSystems] checkLeaveBalance error:', err.message);
    return result(false, 'FAILED', null, err.message);
  }
}

// ── getEmployeeAssets ────────────────────────────────────────────────────────

/**
 * Return IT assets assigned to an employee.
 * Returns an empty assets array (not an error) when no assets exist.
 * @param {string} employeeId
 * @returns {Promise<{ success, status, data, error }>}
 */
export async function getEmployeeAssets(employeeId) {
  if (!employeeId) {
    return result(false, 'INVALID_INPUT', null, 'employeeId is required.');
  }
  try {
    // First verify employee exists
    const emp = await db.getItem(tables.employees(), { employeeId });
    if (!emp) {
      return result(false, 'NOT_FOUND', null, `Employee ${employeeId} not found.`);
    }
    // Query all assets for this employee
    const assets = await db.queryItems(
      tables.assets(),
      'employeeId = :eid',
      { ':eid': employeeId },
    );
    return result(true, 'SUCCESS', { employeeId, assets: assets ?? [] });
  } catch (err) {
    console.error('[enterpriseSystems] getEmployeeAssets error:', err.message);
    return result(false, 'FAILED', null, err.message);
  }
}

// ── findAvailableResources ───────────────────────────────────────────────────

/**
 * Scan employees table for those matching simple criteria.
 * Uses a DynamoDB Scan with filter expressions (acceptable at demo scale).
 * In production this would be replaced with a proper HRIS query API.
 *
 * @param {{ department?: string, location?: string, status?: string }} criteria
 * @returns {Promise<{ success, status, data, error }>}
 */
export async function findAvailableResources(criteria = {}) {
  const { department, location, status } = criteria;
  try {
    // Scan all employees — acceptable for demo scale (< 100 records)
    const all = await db.scanItems(tables.employees());

    const filtered = (all ?? []).filter((e) => {
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
  } catch (err) {
    console.error('[enterpriseSystems] findAvailableResources error:', err.message);
    return result(false, 'FAILED', null, err.message);
  }
}

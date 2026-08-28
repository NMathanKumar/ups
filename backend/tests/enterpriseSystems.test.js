/**
 * enterpriseSystems.test.js — Unit Tests for Enterprise Data Service (Step 11)
 */

import {
  getEmployee,
  checkLeaveBalance,
  getEmployeeAssets,
  findAvailableResources,
} from '../src/services/enterpriseSystems.js';

describe('Enterprise Systems Service (Step 11)', () => {

  // ── getEmployee ────────────────────────────────────────────────────────────

  describe('getEmployee()', () => {
    test('returns employee data for a known ID', () => {
      const r = getEmployee('EMP001');
      expect(r.success).toBe(true);
      expect(r.status).toBe('SUCCESS');
      expect(r.data.employeeId).toBe('EMP001');
      expect(r.data.name).toBe('Priya Sharma');
      expect(r.data.department).toBe('Engineering');
    });

    test('returns NOT_FOUND for unknown employee ID', () => {
      const r = getEmployee('EMP999');
      expect(r.success).toBe(false);
      expect(r.status).toBe('NOT_FOUND');
      expect(r.data).toBeNull();
      expect(r.error).toMatch(/not found/i);
    });

    test('returns INVALID_INPUT when employeeId is missing', () => {
      const r = getEmployee('');
      expect(r.success).toBe(false);
      expect(r.status).toBe('INVALID_INPUT');
    });

    test('demo-user is a valid employee', () => {
      const r = getEmployee('demo-user');
      expect(r.success).toBe(true);
      expect(r.data.employeeId).toBe('demo-user');
    });
  });

  // ── checkLeaveBalance ──────────────────────────────────────────────────────

  describe('checkLeaveBalance()', () => {
    test('returns leave balances for a known employee', () => {
      const r = checkLeaveBalance('EMP001');
      expect(r.success).toBe(true);
      expect(r.status).toBe('SUCCESS');
      expect(r.data.employeeId).toBe('EMP001');
      expect(typeof r.data.annualLeave).toBe('number');
      expect(typeof r.data.annualLeaveRemaining).toBe('number');
      expect(r.data.annualLeaveRemaining).toBe(r.data.annualLeave - r.data.annualLeaveUsed);
    });

    test('maternityLeaveEligible is true for eligible employee', () => {
      const r = checkLeaveBalance('EMP001');
      expect(r.data.maternityLeaveEligible).toBe(true);
      expect(r.data.maternityLeaveDays).toBeGreaterThan(0);
    });

    test('maternityLeaveEligible is false for ineligible employee', () => {
      const r = checkLeaveBalance('EMP002');
      expect(r.data.maternityLeaveEligible).toBe(false);
      expect(r.data.maternityLeaveDays).toBe(0);
    });

    test('returns NOT_FOUND for unknown employee', () => {
      const r = checkLeaveBalance('EMP999');
      expect(r.success).toBe(false);
      expect(r.status).toBe('NOT_FOUND');
    });

    test('returns INVALID_INPUT when employeeId is missing', () => {
      const r = checkLeaveBalance('');
      expect(r.success).toBe(false);
      expect(r.status).toBe('INVALID_INPUT');
    });
  });

  // ── getEmployeeAssets ──────────────────────────────────────────────────────

  describe('getEmployeeAssets()', () => {
    test('returns assigned assets for an employee with assets', () => {
      const r = getEmployeeAssets('EMP001');
      expect(r.success).toBe(true);
      expect(r.status).toBe('SUCCESS');
      expect(r.data.employeeId).toBe('EMP001');
      expect(Array.isArray(r.data.assets)).toBe(true);
      expect(r.data.assets.length).toBeGreaterThan(0);
      expect(r.data.assets[0]).toHaveProperty('assetId');
      expect(r.data.assets[0]).toHaveProperty('type');
      expect(r.data.assets[0]).toHaveProperty('status');
    });

    test('returns empty assets array for employee with no assets', () => {
      const r = getEmployeeAssets('EMP008');
      expect(r.success).toBe(true);
      expect(r.status).toBe('SUCCESS');
      expect(r.data.assets).toHaveLength(0);
    });

    test('returns NOT_FOUND for unknown employee', () => {
      const r = getEmployeeAssets('EMP999');
      expect(r.success).toBe(false);
      expect(r.status).toBe('NOT_FOUND');
    });

    test('returns INVALID_INPUT when employeeId is missing', () => {
      const r = getEmployeeAssets('');
      expect(r.success).toBe(false);
      expect(r.status).toBe('INVALID_INPUT');
    });
  });

  // ── findAvailableResources ─────────────────────────────────────────────────

  describe('findAvailableResources()', () => {
    test('returns matching resources for department + location criteria', () => {
      const r = findAvailableResources({ department: 'Engineering', location: 'Bangalore' });
      expect(r.success).toBe(true);
      expect(r.status).toBe('SUCCESS');
      expect(r.data.count).toBeGreaterThan(0);
      r.data.resources.forEach((res) => {
        expect(res.department).toBe('Engineering');
        expect(res.location).toBe('Bangalore');
      });
    });

    test('returns empty results when no employees match criteria', () => {
      const r = findAvailableResources({ department: 'Nonexistent', location: 'Mars' });
      expect(r.success).toBe(true);
      expect(r.status).toBe('SUCCESS');
      expect(r.data.count).toBe(0);
      expect(r.data.resources).toHaveLength(0);
    });

    test('returns all active/available employees when no criteria given', () => {
      const r = findAvailableResources({});
      expect(r.success).toBe(true);
      expect(r.data.count).toBeGreaterThan(0);
    });

    test('filters by department only', () => {
      const r = findAvailableResources({ department: 'HR' });
      expect(r.success).toBe(true);
      r.data.resources.forEach((res) => expect(res.department).toBe('HR'));
    });

    test('result shape has count and resources array', () => {
      const r = findAvailableResources({ location: 'Bangalore' });
      expect(r.data).toHaveProperty('count');
      expect(r.data).toHaveProperty('resources');
      expect(Array.isArray(r.data.resources)).toBe(true);
    });
  });

});

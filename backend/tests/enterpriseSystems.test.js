/**
 * enterpriseSystems.test.js — Step 13: DynamoDB-backed enterprise data service
 *
 * All AWS DynamoDB calls are mocked — no real AWS required.
 */

import {
  getEmployee,
  checkLeaveBalance,
  getEmployeeAssets,
  findAvailableResources,
} from '../src/services/enterpriseSystems.js';
import { _setClientForTesting as setDbClient } from '../src/services/dynamodb.js';

// ── DynamoDB mock builder ──────────────────────────────────────────────────

const EMP001 = {
  employeeId: 'EMP001', name: 'Priya Sharma', department: 'Engineering',
  role: 'Software Engineer', managerId: 'EMP010', location: 'Bangalore', status: 'ACTIVE',
};

const BALANCE_EMP001 = {
  employeeId: 'EMP001', annualLeave: 18, annualLeaveUsed: 5,
  sickLeave: 10, sickLeaveUsed: 2, maternityLeaveEligible: true, maternityLeaveDays: 90,
};

const BALANCE_EMP002 = {
  employeeId: 'EMP002', annualLeave: 20, annualLeaveUsed: 8,
  sickLeave: 10, sickLeaveUsed: 0, maternityLeaveEligible: false, maternityLeaveDays: 0,
};

const ASSET_001 = { employeeId: 'EMP001', assetId: 'ASSET001', type: 'LAPTOP', status: 'ASSIGNED' };
const ASSET_002 = { employeeId: 'EMP001', assetId: 'ASSET002', type: 'MONITOR', status: 'ASSIGNED' };

const EMP_LIST = [
  EMP001,
  { employeeId: 'EMP006', name: 'Ankit Verma', department: 'Engineering', location: 'Bangalore', status: 'AVAILABLE' },
  { employeeId: 'EMP003', name: 'Aisha Patel', department: 'HR', location: 'Mumbai', status: 'ACTIVE' },
];

/**
 * Builds a mock DynamoDB Document Client.
 * GetCommand returns items via keyMap[JSON.stringify(key)].
 * QueryCommand / ScanCommand return from queryItems array.
 */
function mockDb({ getItems = {}, queryItems = [], fail = false } = {}) {
  return {
    send: async (cmd) => {
      if (fail) throw new Error('DynamoDB unavailable');

      const name = cmd.constructor.name;

      if (name === 'GetCommand') {
        const key = cmd.input.Key;
        const pk = Object.values(key).join('#');
        const item = getItems[pk] ?? null;
        return { Item: item };
      }
      if (name === 'QueryCommand') {
        return { Items: queryItems };
      }
      if (name === 'ScanCommand') {
        return { Items: queryItems };
      }
      return {};
    },
  };
}

// ── getEmployee ────────────────────────────────────────────────────────────

describe('getEmployee() — DynamoDB backed', () => {

  test('returns SUCCESS with employee data when found in DynamoDB', async () => {
    setDbClient(mockDb({ getItems: { 'EMP001': EMP001 } }));

    const r = await getEmployee('EMP001');
    expect(r.success).toBe(true);
    expect(r.status).toBe('SUCCESS');
    expect(r.data.employeeId).toBe('EMP001');
    expect(r.data.name).toBe('Priya Sharma');
  });

  test('returns NOT_FOUND when employee is not in DynamoDB', async () => {
    setDbClient(mockDb({ getItems: {} }));

    const r = await getEmployee('EMP999');
    expect(r.success).toBe(false);
    expect(r.status).toBe('NOT_FOUND');
    expect(r.data).toBeNull();
  });

  test('returns INVALID_INPUT when employeeId is empty', async () => {
    const r = await getEmployee('');
    expect(r.success).toBe(false);
    expect(r.status).toBe('INVALID_INPUT');
  });

  test('returns FAILED when DynamoDB throws', async () => {
    setDbClient(mockDb({ fail: true }));

    const r = await getEmployee('EMP001');
    expect(r.success).toBe(false);
    expect(r.status).toBe('FAILED');
    expect(r.error).toBeTruthy();
  });

});

// ── checkLeaveBalance ──────────────────────────────────────────────────────

describe('checkLeaveBalance() — DynamoDB backed', () => {

  test('returns SUCCESS with normalised balance fields', async () => {
    setDbClient(mockDb({ getItems: { 'EMP001': BALANCE_EMP001 } }));

    const r = await checkLeaveBalance('EMP001');
    expect(r.success).toBe(true);
    expect(r.status).toBe('SUCCESS');
    expect(r.data.annualLeave).toBe(18);
    expect(r.data.annualLeaveRemaining).toBe(13); // 18 - 5
    expect(r.data.maternityLeaveEligible).toBe(true);
    expect(r.data.maternityLeaveDays).toBe(90);
  });

  test('maternityLeaveEligible is false for ineligible employee', async () => {
    setDbClient(mockDb({ getItems: { 'EMP002': BALANCE_EMP002 } }));

    const r = await checkLeaveBalance('EMP002');
    expect(r.data.maternityLeaveEligible).toBe(false);
    expect(r.data.maternityLeaveDays).toBe(0);
  });

  test('returns NOT_FOUND when no balance record in DynamoDB', async () => {
    setDbClient(mockDb({ getItems: {} }));

    const r = await checkLeaveBalance('EMP999');
    expect(r.success).toBe(false);
    expect(r.status).toBe('NOT_FOUND');
  });

  test('returns INVALID_INPUT when employeeId is missing', async () => {
    const r = await checkLeaveBalance('');
    expect(r.success).toBe(false);
    expect(r.status).toBe('INVALID_INPUT');
  });

  test('returns FAILED when DynamoDB throws', async () => {
    setDbClient(mockDb({ fail: true }));

    const r = await checkLeaveBalance('EMP001');
    expect(r.success).toBe(false);
    expect(r.status).toBe('FAILED');
  });

});

// ── getEmployeeAssets ──────────────────────────────────────────────────────

describe('getEmployeeAssets() — DynamoDB backed', () => {

  test('returns SUCCESS with assets when employee has assigned items', async () => {
    setDbClient(mockDb({
      getItems: { 'EMP001': EMP001 },
      queryItems: [ASSET_001, ASSET_002],
    }));

    const r = await getEmployeeAssets('EMP001');
    expect(r.success).toBe(true);
    expect(r.status).toBe('SUCCESS');
    expect(r.data.assets).toHaveLength(2);
    expect(r.data.assets[0].assetId).toBe('ASSET001');
    expect(r.data.assets[0].type).toBe('LAPTOP');
  });

  test('returns empty assets array when employee has no assigned items', async () => {
    setDbClient(mockDb({
      getItems: { 'EMP001': EMP001 },
      queryItems: [],
    }));

    const r = await getEmployeeAssets('EMP001');
    expect(r.success).toBe(true);
    expect(r.status).toBe('SUCCESS');
    expect(r.data.assets).toHaveLength(0);
  });

  test('returns NOT_FOUND when employee does not exist', async () => {
    setDbClient(mockDb({ getItems: {} }));

    const r = await getEmployeeAssets('EMP999');
    expect(r.success).toBe(false);
    expect(r.status).toBe('NOT_FOUND');
  });

  test('returns INVALID_INPUT when employeeId is empty', async () => {
    const r = await getEmployeeAssets('');
    expect(r.success).toBe(false);
    expect(r.status).toBe('INVALID_INPUT');
  });

  test('returns FAILED when DynamoDB throws', async () => {
    setDbClient(mockDb({ fail: true }));

    const r = await getEmployeeAssets('EMP001');
    expect(r.success).toBe(false);
    expect(r.status).toBe('FAILED');
  });

});

// ── findAvailableResources ─────────────────────────────────────────────────

describe('findAvailableResources() — DynamoDB backed', () => {

  test('returns matching resources for department + location criteria', async () => {
    setDbClient(mockDb({ queryItems: EMP_LIST }));

    const r = await findAvailableResources({ department: 'Engineering', location: 'Bangalore' });
    expect(r.success).toBe(true);
    expect(r.status).toBe('SUCCESS');
    expect(r.data.count).toBeGreaterThan(0);
    r.data.resources.forEach((res) => {
      expect(res.department).toBe('Engineering');
      expect(res.location).toBe('Bangalore');
    });
  });

  test('returns empty results when no employees match criteria', async () => {
    setDbClient(mockDb({ queryItems: EMP_LIST }));

    const r = await findAvailableResources({ department: 'Nonexistent', location: 'Mars' });
    expect(r.success).toBe(true);
    expect(r.data.count).toBe(0);
    expect(r.data.resources).toHaveLength(0);
  });

  test('returns all active employees when no criteria given', async () => {
    setDbClient(mockDb({ queryItems: EMP_LIST }));

    const r = await findAvailableResources({});
    expect(r.success).toBe(true);
    expect(r.data.count).toBeGreaterThan(0);
  });

  test('result shape has count and resources array', async () => {
    setDbClient(mockDb({ queryItems: EMP_LIST }));

    const r = await findAvailableResources({ location: 'Bangalore' });
    expect(r.data).toHaveProperty('count');
    expect(r.data).toHaveProperty('resources');
    expect(Array.isArray(r.data.resources)).toBe(true);
  });

  test('returns FAILED when DynamoDB scan throws', async () => {
    setDbClient(mockDb({ fail: true }));

    const r = await findAvailableResources({ department: 'Engineering' });
    expect(r.success).toBe(false);
    expect(r.status).toBe('FAILED');
  });

});

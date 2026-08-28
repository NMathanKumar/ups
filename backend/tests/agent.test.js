/**
 * agent.test.js — Agent Foundation + RAG Integration + Enterprise Tools (Steps 9, 10, 11)
 */

import { detectIntent, createPlan, INTENTS } from '../src/agent/planner.js';
import { TOOL_METADATA, getToolMetadata, executeTool } from '../src/agent/tools.js';
import { runAgent } from '../src/agent/agent.js';
import { _setClientForTesting as setKbClient }      from '../src/services/knowledgeBase.js';
import { _setClientForTesting as setBedrockClient } from '../src/services/bedrock.js';
import { _setClientForTesting as setDbClient }      from '../src/services/dynamodb.js';

// ── Helpers ────────────────────────────────────────────────────────────────

function kbClient(results) {
  return { send: async () => ({ retrievalResults: results }) };
}

function bedrockClient(text) {
  return {
    send: async () => ({
      body: Buffer.from(JSON.stringify({ content: [{ type: 'text', text }] })),
    }),
  };
}

// Default DynamoDB mock — returns demo data for known employees; null for unknown.
// This prevents enterprise tools from trying to use a real AWS DynamoDB client in tests.
const DEMO_EMPLOYEES_DB = {
  EMP001: { employeeId: 'EMP001', name: 'Priya Sharma', department: 'Engineering', location: 'Bangalore', status: 'ACTIVE' },
  EMP008: { employeeId: 'EMP008', name: 'Sandra Kim', department: 'Finance', location: 'Seoul', status: 'ACTIVE' },
};
const DEMO_BALANCES_DB = {
  EMP001: { employeeId: 'EMP001', annualLeave: 18, annualLeaveUsed: 5, sickLeave: 10, sickLeaveUsed: 2, maternityLeaveEligible: true, maternityLeaveDays: 90 },
  EMP008: { employeeId: 'EMP008', annualLeave: 15, annualLeaveUsed: 3, sickLeave: 10, sickLeaveUsed: 1, maternityLeaveEligible: true, maternityLeaveDays: 90 },
};
const DEMO_ASSETS_DB = {
  EMP001: [
    { employeeId: 'EMP001', assetId: 'ASSET001', type: 'LAPTOP', status: 'ASSIGNED' },
    { employeeId: 'EMP001', assetId: 'ASSET002', type: 'MONITOR', status: 'ASSIGNED' },
  ],
  // EMP008 has no assets
};
const DEMO_EMP_LIST = [
  { employeeId: 'EMP001', name: 'Priya Sharma', department: 'Engineering', location: 'Bangalore', status: 'ACTIVE' },
  { employeeId: 'EMP006', name: 'Ankit Verma',  department: 'Engineering', location: 'Bangalore', status: 'AVAILABLE' },
];

function makeDbMock(opts = {}) {
  return {
    send: async (cmd) => {
      const name = cmd.constructor.name;
      if (name === 'GetCommand') {
        if (opts.failGet) throw new Error('DynamoDB unavailable');
        const key = cmd.input?.Key ?? {};
        const empId = key.employeeId;
        if (!empId) return { Item: null };
        const tableName = cmd.input?.TableName ?? '';
        if (tableName.includes('leave') || tableName.includes('balance')) {
          return { Item: DEMO_BALANCES_DB[empId] ?? null };
        }
        return { Item: DEMO_EMPLOYEES_DB[empId] ?? null };
      }
      if (name === 'QueryCommand') {
        const empId = cmd.input?.ExpressionAttributeValues?.[':eid'];
        return { Items: (empId && DEMO_ASSETS_DB[empId]) ? DEMO_ASSETS_DB[empId] : [] };
      }
      if (name === 'ScanCommand') return { Items: DEMO_EMP_LIST };
      if (name === 'PutCommand') {
        if (opts.failPut) throw new Error('DynamoDB write failed');
        return {};
      }
      return {};
    },
  };
}

beforeEach(() => {
  // Always install a safe DB mock so enterprise tools never hit a real AWS client
  setDbClient(makeDbMock());
});

const GOOD_DOC = {
  score: 0.85,
  content: { text: 'Maternity leave is 16 weeks paid.' },
  location: { s3Location: { uri: 's3://bucket/knowledge-base/hr/maternity-policy.txt' } },
  metadata: { category: 'HR' },
};

// ── Step 9 Tests (unchanged from Step 9 — regression guard) ──────────────

describe('Agent Foundation (Step 9 — regression guard)', () => {

  describe('1. Intent Classification', () => {
    test('classifies MATERNITY_LEAVE', () => {
      expect(detectIntent('I need maternity leave starting September 10')).toBe(INTENTS.MATERNITY_LEAVE);
      expect(detectIntent('What is the pregnancy policy?')).toBe(INTENTS.MATERNITY_LEAVE);
    });

    test('classifies RESOURCE_ALLOCATION', () => {
      expect(detectIntent('I need 100 employees for project Apollo')).toBe(INTENTS.RESOURCE_ALLOCATION);
      expect(detectIntent('Allocate staff for new project')).toBe(INTENTS.RESOURCE_ALLOCATION);
    });

    test('classifies EMPLOYEE_TRANSFER', () => {
      expect(detectIntent('Transfer John Doe to engineering')).toBe(INTENTS.EMPLOYEE_TRANSFER);
      expect(detectIntent('Relocate employee to London office')).toBe(INTENTS.EMPLOYEE_TRANSFER);
    });

    test('classifies INTERN_ONBOARDING', () => {
      expect(detectIntent('Onboard new summer intern')).toBe(INTENTS.INTERN_ONBOARDING);
      expect(detectIntent('Create onboarding plan for intern')).toBe(INTENTS.INTERN_ONBOARDING);
    });

    test('classifies IT_SUPPORT', () => {
      expect(detectIntent('My VPN is not connecting')).toBe(INTENTS.IT_SUPPORT);
      expect(detectIntent('How do I reset my laptop password?')).toBe(INTENTS.IT_SUPPORT);
    });

    test('classifies TASK_CREATION', () => {
      expect(detectIntent('Create task to review security policy')).toBe(INTENTS.TASK_CREATION);
      expect(detectIntent('Remind me to submit expense report')).toBe(INTENTS.TASK_CREATION);
    });

    test('classifies POLICY_QUESTION', () => {
      expect(detectIntent('What is the work from home policy?')).toBe(INTENTS.POLICY_QUESTION);
      expect(detectIntent('How many annual leave days do employees get?')).toBe(INTENTS.POLICY_QUESTION);
    });

    test('classifies GENERAL / Unknown', () => {
      expect(detectIntent('Hello good morning')).toBe(INTENTS.GENERAL);
      expect(detectIntent('')).toBe(INTENTS.GENERAL);
    });
  });

  describe('2. Planner & Action Plans', () => {
    test('MATERNITY_LEAVE plan', () => {
      const plan = createPlan(INTENTS.MATERNITY_LEAVE, 'I need maternity leave');
      expect(plan.intent).toBe(INTENTS.MATERNITY_LEAVE);
      expect(plan.requiresPolicy).toBe(true);
      expect(plan.requiresEmployeeData).toBe(true);
      expect(plan.requiresConfirmation).toBe(true);
      expect(plan.steps.map((s) => s.tool)).toEqual([
        'searchPolicy', 'getEmployee', 'checkLeaveBalance', 'createLeaveRequest', 'createHRTask', 'getEmployeeAssets', 'createITTicket',
      ]);
    });

    test('RESOURCE_ALLOCATION plan', () => {
      const plan = createPlan(INTENTS.RESOURCE_ALLOCATION, 'Need 100 employees');
      expect(plan.intent).toBe(INTENTS.RESOURCE_ALLOCATION);
      expect(plan.requiresConfirmation).toBe(true);
      expect(plan.steps.map((s) => s.tool)).toEqual(['findAvailableResources', 'allocateResources']);
    });

    test('POLICY_QUESTION plan', () => {
      const plan = createPlan(INTENTS.POLICY_QUESTION, 'What is the leave policy?');
      expect(plan.intent).toBe(INTENTS.POLICY_QUESTION);
      expect(plan.requiresConfirmation).toBe(false);
      expect(plan.steps.map((s) => s.tool)).toEqual(['searchPolicy']);
    });
  });

  describe('3. Tool Metadata & Safety', () => {
    test('searchPolicy is READ, no confirmation', () => {
      const meta = getToolMetadata('searchPolicy');
      expect(meta.type).toBe('READ');
      expect(meta.requiresConfirmation).toBe(false);
    });

    test('createLeaveRequest is WRITE, requires confirmation', () => {
      const meta = getToolMetadata('createLeaveRequest');
      expect(meta.type).toBe('WRITE');
      expect(meta.requiresConfirmation).toBe(true);
    });

    test('all 12 tools exist in TOOL_METADATA with READ/WRITE type', () => {
      const expected = [
        'searchPolicy', 'getEmployee', 'checkLeaveBalance', 'createLeaveRequest',
        'createHRTask', 'getEmployeeAssets', 'createITTicket', 'findAvailableResources',
        'allocateResources', 'transferEmployee', 'createOnboarding', 'createTask',
      ];
      expected.forEach((name) => {
        expect(TOOL_METADATA[name]).toBeDefined();
        expect(['READ', 'WRITE']).toContain(TOOL_METADATA[name].type);
      });
    });
  });

  describe('4. Tool Execution — NOT_IMPLEMENTED Safety', () => {
    test('unimplemented tools never return fake success', async () => {
      // Remaining unimplemented WRITE tools
      const stubs = ['allocateResources'];
      for (const name of stubs) {
        const r = await executeTool(name, { userId: 'u1' });
        expect(r.success).toBe(false);
        expect(r.status).toBe('NOT_IMPLEMENTED');
      }
      // transferEmployee is implemented
      const trfResult = await executeTool('transferEmployee', { userId: 'EMP001', targetDepartment: 'Engineering' });
      expect(trfResult.success).toBe(true);
      expect(trfResult.status).toBe('SUCCESS');
      // createHRTask with no userId returns FAILED (validation)
      const hrResult = await executeTool('createHRTask', { userId: '', title: '' });
      expect(hrResult.success).toBe(false);
      // createITTicket with no assets returns SKIPPED (not a failure)
      const itResult = await executeTool('createITTicket', { userId: 'u1', assets: [] });
      expect(itResult.success).toBe(true);
      expect(itResult.status).toBe('SKIPPED');
    });

    test('unknown tool returns FAILED', async () => {
      const r = await executeTool('doesNotExist');
      expect(r.success).toBe(false);
      expect(r.status).toBe('FAILED');
    });
  });
});

// ── Step 10 Tests ─────────────────────────────────────────────────────────

describe('Agent RAG Integration (Step 10)', () => {

  describe('searchPolicy Tool', () => {

    test('returns SUCCESS with documents when KB retrieves relevant results', async () => {
      setKbClient(kbClient([GOOD_DOC]));
      const r = await executeTool('searchPolicy', { query: 'maternity leave policy' });
      expect(r.success).toBe(true);
      expect(r.status).toBe('SUCCESS');
      expect(r.data.documents).toHaveLength(1);
      expect(r.data.documents[0].source).toBe('maternity-policy.txt');
      expect(r.data.documents[0].category).toBe('HR');
    });

    test('returns NO_RESULTS (not SUCCESS) when KB returns empty — prevents hallucination', async () => {
      setKbClient(kbClient([]));
      const r = await executeTool('searchPolicy', { query: 'unknown topic' });
      expect(r.success).toBe(true);
      expect(r.status).toBe('NO_RESULTS');
      expect(r.data.documents).toHaveLength(0);
    });

    test('returns FAILED when KB throws', async () => {
      setKbClient({ send: async () => { throw new Error('KB unavailable'); } });
      const r = await executeTool('searchPolicy', { query: 'leave policy' });
      expect(r.success).toBe(false);
      expect(r.status).toBe('FAILED');
      expect(r.error).toContain('KB unavailable');
    });
  });

  describe('runAgent — Full Pipeline', () => {

    test('POLICY_QUESTION with results → returns grounded answer + sources', async () => {
      setKbClient(kbClient([GOOD_DOC]));
      setBedrockClient(bedrockClient('Maternity leave is 16 weeks paid leave.'));

      // Use a pure POLICY_QUESTION phrasing that does not trigger MATERNITY_LEAVE intent
      const res = await runAgent({ message: 'How many leave days do we get?', userId: 'u1' });

      expect(res.intent).toBe(INTENTS.POLICY_QUESTION);
      expect(res.answer).toContain('16 weeks');
      expect(res.sources).toHaveLength(1);
      expect(res.sources[0].document).toBe('maternity-policy.txt');
      expect(res.sources[0].category).toBe('HR');
      expect(res.category).toBe('HR');
      expect(res.status).toBe('COMPLETED');
    });

    test('POLICY_QUESTION with no KB results → returns not-found answer, empty sources', async () => {
      setKbClient(kbClient([]));

      const res = await runAgent({ message: 'What is the leave policy?', userId: 'u1' });

      expect(res.answer).toMatch(/couldn't find/i);
      expect(res.sources).toHaveLength(0);
      expect(res.category).toBeNull();
    });

    test('MATERNITY_LEAVE without confirmed flag returns CONFIRMATION_REQUIRED', async () => {
      setKbClient(kbClient([GOOD_DOC]));

      const res = await runAgent({ message: 'I need maternity leave', userId: 'EMP001' });

      expect(res.intent).toBe(INTENTS.MATERNITY_LEAVE);
      expect(res.status).toBe('CONFIRMATION_REQUIRED');
      expect(res.requiresConfirmation).toBe(true);
      // Must NOT claim leave was created
      expect(res.answer).not.toMatch(/leave.*(created|submitted|approved)/i);
    });

    test('Retrieved context is forwarded to Bedrock generation — not an empty string', async () => {
      let capturedBody = null;
      setKbClient(kbClient([GOOD_DOC]));
      setBedrockClient({
        send: async (cmd) => {
          capturedBody = JSON.parse(cmd.input?.body ?? '{}');
          return { body: Buffer.from(JSON.stringify({ content: [{ type: 'text', text: 'OK.' }] })) };
        },
      });

      // Use a POLICY_QUESTION (not MATERNITY_LEAVE) so it goes through RAG path directly
      await runAgent({ message: 'What is the company work from home policy?', userId: 'u1' });

      const prompt = capturedBody?.messages?.[0]?.content ?? '';
      expect(prompt).toContain('Maternity leave is 16 weeks paid');
      expect(prompt).toContain('maternity-policy.txt');
    });

    test('runAgent throws on missing message', async () => {
      await expect(runAgent({ userId: 'u1' })).rejects.toThrow('requires a valid message string');
    });

    test('runAgent propagates Bedrock generation error', async () => {
      setKbClient(kbClient([GOOD_DOC]));
      setBedrockClient({ send: async () => { throw new Error('Bedrock timeout'); } });

      await expect(runAgent({ message: 'leave policy?', userId: 'u1' })).rejects.toThrow('generation failed');
    });
  });
});

// ── Step 11 Tests — Enterprise Tool Delegation ─────────────────────────────

describe('Enterprise Tool Delegation (Step 11)', () => {

  test('getEmployee tool delegates to enterpriseSystems and returns SUCCESS', async () => {
    const r = await executeTool('getEmployee', { employeeId: 'EMP001' });
    expect(r.tool).toBe('getEmployee');
    expect(r.success).toBe(true);
    expect(r.status).toBe('SUCCESS');
    expect(r.data.employeeId).toBe('EMP001');
    expect(r.data.name).toBeDefined();
  });

  test('getEmployee tool returns NOT_FOUND for unknown employee', async () => {
    const r = await executeTool('getEmployee', { employeeId: 'EMP_UNKNOWN' });
    expect(r.tool).toBe('getEmployee');
    expect(r.success).toBe(false);
    expect(r.status).toBe('NOT_FOUND');
  });

  test('checkLeaveBalance tool delegates to enterpriseSystems and returns SUCCESS', async () => {
    const r = await executeTool('checkLeaveBalance', { employeeId: 'EMP001' });
    expect(r.tool).toBe('checkLeaveBalance');
    expect(r.success).toBe(true);
    expect(r.status).toBe('SUCCESS');
    expect(typeof r.data.annualLeave).toBe('number');
    expect(typeof r.data.maternityLeaveEligible).toBe('boolean');
  });

  test('checkLeaveBalance tool returns NOT_FOUND for unknown employee', async () => {
    const r = await executeTool('checkLeaveBalance', { employeeId: 'EMP_UNKNOWN' });
    expect(r.tool).toBe('checkLeaveBalance');
    expect(r.success).toBe(false);
    expect(r.status).toBe('NOT_FOUND');
  });

  test('getEmployeeAssets tool delegates and returns assets array', async () => {
    const r = await executeTool('getEmployeeAssets', { employeeId: 'EMP001' });
    expect(r.tool).toBe('getEmployeeAssets');
    expect(r.success).toBe(true);
    expect(Array.isArray(r.data.assets)).toBe(true);
    expect(r.data.assets.length).toBeGreaterThan(0);
  });

  test('getEmployeeAssets tool returns empty array for employee with no assets', async () => {
    const r = await executeTool('getEmployeeAssets', { employeeId: 'EMP008' });
    expect(r.tool).toBe('getEmployeeAssets');
    expect(r.success).toBe(true);
    expect(r.data.assets).toHaveLength(0);
  });

  test('findAvailableResources tool delegates and returns matching resources', async () => {
    const r = await executeTool('findAvailableResources', {
      criteria: { department: 'Engineering', location: 'Bangalore' },
    });
    expect(r.tool).toBe('findAvailableResources');
    expect(r.success).toBe(true);
    expect(r.data.count).toBeGreaterThan(0);
    r.data.resources.forEach((res) => {
      expect(res.department).toBe('Engineering');
      expect(res.location).toBe('Bangalore');
    });
  });

  test('findAvailableResources tool returns empty results for no-match criteria', async () => {
    const r = await executeTool('findAvailableResources', {
      criteria: { department: 'Nonexistent', location: 'Mars' },
    });
    expect(r.tool).toBe('findAvailableResources');
    expect(r.success).toBe(true);
    expect(r.data.count).toBe(0);
  });

  test('Unimplemented WRITE tools return NOT_IMPLEMENTED', async () => {
    // createLeaveRequest/createHRTask/createITTicket/createOnboarding/createTask/transferEmployee are now implemented
    const writeTools = ['allocateResources'];
    for (const name of writeTools) {
      const r = await executeTool(name, { userId: 'u1' });
      expect(r.success).toBe(false);
      expect(r.status).toBe('NOT_IMPLEMENTED');
    }
  });

});

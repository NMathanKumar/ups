/**
 * onboarding.test.js — Step 17: Intern Onboarding (Informational, Status, Action workflows)
 */

import { runAgent } from '../src/agent/agent.js';
import { detectIntent, INTENTS } from '../src/agent/planner.js';
import { _setClientForTesting as setKbClient }      from '../src/services/knowledgeBase.js';
import { _setClientForTesting as setBedrockClient } from '../src/services/bedrock.js';
import { _setClientForTesting as setDbClient }      from '../src/services/dynamodb.js';

const DEMO_EMPLOYEE = {
  employeeId: 'EMP007',
  name: 'Meera Nair',
  department: 'Engineering',
  role: 'Backend Developer',
  location: 'Bangalore',
  status: 'AVAILABLE',
};

function createMockDbClient(opts = {}) {
  const puts = [];
  return {
    puts,
    send: async (cmd) => {
      const name = cmd.constructor.name;
      if (name === 'GetCommand') {
        const key = cmd.input?.Key ?? {};
        if (key.employeeId === 'EMP007') {
          return { Item: DEMO_EMPLOYEE };
        }
        return { Item: null };
      }
      if (name === 'PutCommand') {
        if (opts.failPut) throw new Error('DynamoDB write error');
        puts.push(cmd.input.Item);
        return {};
      }
      if (name === 'ScanCommand') {
        if (opts.workflows) {
          const tableName = cmd.input?.TableName ?? '';
          if (tableName.includes('workflows')) {
            return { Items: opts.workflows };
          }
          if (tableName.includes('tasks')) {
            return { Items: opts.tasks ?? [] };
          }
        }
        return { Items: [] };
      }
      return {};
    },
  };
}

describe('Intern Onboarding Suite', () => {
  beforeEach(() => {
    setKbClient({
      send: async () => ({
        retrievalResults: [
          {
            score: 0.85,
            content: { text: 'Intern onboarding checklist: Tax forms, Duo MFA laptop setup, and Security Training.' },
            location: { s3Location: { uri: 's3://bucket/knowledge-base/onboarding/onboarding-checklist.txt' } },
            metadata: { category: 'ONBOARDING' },
          },
        ],
      }),
    });
    setBedrockClient({
      send: async () => ({
        body: Buffer.from(JSON.stringify({
          output: { message: { content: [{ text: 'Intern onboarding requires HR tax forms, IT laptop setup, and Security Training.' }] } },
          content: [{ text: 'Intern onboarding requires HR tax forms, IT laptop setup, and Security Training.' }],
        })),
      }),
    });
  });

  describe('1. Intent Detection', () => {
    test('classifies informational onboarding questions as POLICY_QUESTION', () => {
      expect(detectIntent('What documents do I need for intern onboarding?')).toBe(INTENTS.POLICY_QUESTION);
      expect(detectIntent('What training is required for interns?')).toBe(INTENTS.POLICY_QUESTION);
      expect(detectIntent('How does intern onboarding work?')).toBe(INTENTS.POLICY_QUESTION);
    });

    test('classifies status queries as INTERN_ONBOARDING_STATUS', () => {
      expect(detectIntent('What onboarding tasks do I have?')).toBe(INTENTS.INTERN_ONBOARDING_STATUS);
      expect(detectIntent('What onboarding tasks are pending for EMP007?')).toBe(INTENTS.INTERN_ONBOARDING_STATUS);
      expect(detectIntent('What is my onboarding status?')).toBe(INTENTS.INTERN_ONBOARDING_STATUS);
    });

    test('classifies onboarding action requests as INTERN_ONBOARDING', () => {
      expect(detectIntent('Onboard EMP007 as a software engineering intern starting September 1.')).toBe(INTENTS.INTERN_ONBOARDING);
      expect(detectIntent('Start onboarding for EMP007')).toBe(INTENTS.INTERN_ONBOARDING);
    });
  });

  describe('2. Informational Onboarding Questions (No DB Writes)', () => {
    test('retrieves policy and generates answer without creating DB records', async () => {
      const dbClient = createMockDbClient();
      setDbClient(dbClient);

      const result = await runAgent({
        message: 'What documents do I need for intern onboarding?',
        userId: 'EMP007',
        confirmed: false,
      });

      expect(result.intent).toBe(INTENTS.POLICY_QUESTION);
      expect(result.status).toBe('COMPLETED');
      expect(result.sources.length).toBeGreaterThan(0);
      expect(dbClient.puts.length).toBe(0);
    });
  });

  describe('3. Onboarding Status Lookup (No DB Writes)', () => {
    test('returns clear message when no workflow exists', async () => {
      const dbClient = createMockDbClient({ workflows: [] });
      setDbClient(dbClient);

      const result = await runAgent({
        message: 'What onboarding tasks are pending for EMP007?',
        userId: 'EMP007',
      });

      expect(result.intent).toBe(INTENTS.INTERN_ONBOARDING_STATUS);
      expect(result.answer).toContain('No onboarding workflow is currently recorded');
      expect(dbClient.puts.length).toBe(0);
    });

    test('returns status and tasks when workflow exists in DynamoDB', async () => {
      const dbClient = createMockDbClient({
        workflows: [{
          workflowId: 'wf-1234',
          type: 'INTERN_ONBOARDING',
          userId: 'EMP007',
          employeeId: 'EMP007',
          employeeName: 'Meera Nair',
          status: 'IN_PROGRESS',
          startDate: '2026-09-01',
        }],
        tasks: [
          { taskId: 't-1', userId: 'EMP007', title: 'HR tax forms', completed: false, category: 'HR' },
          { taskId: 't-2', userId: 'EMP007', title: 'Laptop & SSO Setup', completed: true, category: 'IT' },
        ],
      });
      setDbClient(dbClient);

      const result = await runAgent({
        message: 'What onboarding tasks are pending for EMP007?',
        userId: 'EMP007',
      });

      expect(result.intent).toBe(INTENTS.INTERN_ONBOARDING_STATUS);
      expect(result.answer).toContain('Meera Nair');
      expect(result.answer).toContain('wf-1234');
      expect(result.answer).toContain('HR tax forms');
      expect(dbClient.puts.length).toBe(0);
    });
  });

  describe('4. Onboarding Action Workflow (Confirmation & Execution)', () => {
    test('confirmed=false returns preview only and creates NO DB writes', async () => {
      const dbClient = createMockDbClient();
      setDbClient(dbClient);

      const result = await runAgent({
        message: 'Onboard EMP007 as a software engineering intern starting September 1.',
        userId: 'EMP007',
        confirmed: false,
      });

      expect(result.intent).toBe(INTENTS.INTERN_ONBOARDING);
      expect(result.status).toBe('CONFIRMATION_REQUIRED');
      expect(result.requiresConfirmation).toBe(true);
      expect(result.answer).toContain('EMP007');
      expect(result.answer).toContain('Shall I proceed');
      expect(dbClient.puts.length).toBe(0);
    });

    test('confirmed=true executes onboarding, creates workflow & HR, IT, and training tasks in DynamoDB', async () => {
      const dbClient = createMockDbClient();
      setDbClient(dbClient);

      const result = await runAgent({
        message: 'Onboard EMP007 as a software engineering intern starting September 1.',
        userId: 'EMP007',
        confirmed: true,
      });

      expect(result.intent).toBe(INTENTS.INTERN_ONBOARDING);
      expect(result.status).toBe('COMPLETED');
      expect(result.answer).toContain('workflow successfully created');
      expect(result.answer).toContain('Meera Nair');
      expect(dbClient.puts.length).toBe(4); // 1 workflow + 3 tasks (HR, IT, Learning)
    });

    test('handles failure gracefully if DynamoDB putItem fails', async () => {
      const dbClient = createMockDbClient({ failPut: true });
      setDbClient(dbClient);

      const result = await runAgent({
        message: 'Onboard EMP007 as a software engineering intern starting September 1.',
        userId: 'EMP007',
        confirmed: true,
      });

      expect(result.status).toBe('FAILED');
      expect(result.answer).toContain('Failed to create onboarding workflow');
    });
  });
});

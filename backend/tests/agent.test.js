/**
 * agent.test.js — Agent Foundation Unit Tests (Step 9)
 *
 * Tests intent classification, plan generation, tool metadata, tool execution contracts,
 * safety (READ vs WRITE), and orchestrator normalization.
 */

import { detectIntent, createPlan, INTENTS } from '../src/agent/planner.js';
import { TOOL_METADATA, getToolMetadata, executeTool } from '../src/agent/tools.js';
import { runAgent } from '../src/agent/agent.js';
import { _setClientForTesting as setKbClient } from '../src/services/knowledgeBase.js';

describe('Agent Foundation (Step 9)', () => {

  describe('1. Intent Classification', () => {

    test('classifies MATERNITY_LEAVE intent', () => {
      expect(detectIntent('I need maternity leave starting September 10')).toBe(INTENTS.MATERNITY_LEAVE);
      expect(detectIntent('What is the pregnancy policy?')).toBe(INTENTS.MATERNITY_LEAVE);
    });

    test('classifies RESOURCE_ALLOCATION intent', () => {
      expect(detectIntent('I need 100 employees for project Apollo')).toBe(INTENTS.RESOURCE_ALLOCATION);
      expect(detectIntent('Allocate staff for new project')).toBe(INTENTS.RESOURCE_ALLOCATION);
    });

    test('classifies EMPLOYEE_TRANSFER intent', () => {
      expect(detectIntent('Transfer John Doe to engineering')).toBe(INTENTS.EMPLOYEE_TRANSFER);
      expect(detectIntent('Relocate employee to London office')).toBe(INTENTS.EMPLOYEE_TRANSFER);
    });

    test('classifies INTERN_ONBOARDING intent', () => {
      expect(detectIntent('Onboard new summer intern')).toBe(INTENTS.INTERN_ONBOARDING);
      expect(detectIntent('Create onboarding plan for intern')).toBe(INTENTS.INTERN_ONBOARDING);
    });

    test('classifies IT_SUPPORT intent', () => {
      expect(detectIntent('My VPN is not connecting')).toBe(INTENTS.IT_SUPPORT);
      expect(detectIntent('How do I reset my laptop password?')).toBe(INTENTS.IT_SUPPORT);
    });

    test('classifies TASK_CREATION intent', () => {
      expect(detectIntent('Create task to review security policy')).toBe(INTENTS.TASK_CREATION);
      expect(detectIntent('Remind me to submit expense report')).toBe(INTENTS.TASK_CREATION);
    });

    test('classifies POLICY_QUESTION intent', () => {
      expect(detectIntent('What is the work from home policy?')).toBe(INTENTS.POLICY_QUESTION);
      expect(detectIntent('How many annual leave days do I have?')).toBe(INTENTS.POLICY_QUESTION);
    });

    test('classifies GENERAL / Unknown intent', () => {
      expect(detectIntent('Hello good morning')).toBe(INTENTS.GENERAL);
      expect(detectIntent('')).toBe(INTENTS.GENERAL);
    });

  });

  describe('2. Planner & Action Plans', () => {

    test('generates correct plan for MATERNITY_LEAVE', () => {
      const plan = createPlan(INTENTS.MATERNITY_LEAVE, 'I need maternity leave');
      expect(plan.intent).toBe(INTENTS.MATERNITY_LEAVE);
      expect(plan.requiresPolicy).toBe(true);
      expect(plan.requiresEmployeeData).toBe(true);
      expect(plan.requiresConfirmation).toBe(true);
      expect(plan.steps.map((s) => s.tool)).toEqual([
        'searchPolicy',
        'getEmployee',
        'checkLeaveBalance',
        'createLeaveRequest',
        'createHRTask',
      ]);
    });

    test('generates correct plan for RESOURCE_ALLOCATION', () => {
      const plan = createPlan(INTENTS.RESOURCE_ALLOCATION, 'Need 100 employees');
      expect(plan.intent).toBe(INTENTS.RESOURCE_ALLOCATION);
      expect(plan.requiresConfirmation).toBe(true);
      expect(plan.steps.map((s) => s.tool)).toEqual(['findAvailableResources', 'allocateResources']);
    });

    test('generates correct plan for POLICY_QUESTION', () => {
      const plan = createPlan(INTENTS.POLICY_QUESTION, 'What is the leave policy?');
      expect(plan.intent).toBe(INTENTS.POLICY_QUESTION);
      expect(plan.requiresConfirmation).toBe(false);
      expect(plan.steps.map((s) => s.tool)).toEqual(['searchPolicy']);
    });

  });

  describe('3. Tool Metadata & Safety (READ vs WRITE)', () => {

    test('searchPolicy is READ operation and requires no confirmation', () => {
      const meta = getToolMetadata('searchPolicy');
      expect(meta.type).toBe('READ');
      expect(meta.requiresConfirmation).toBe(false);
    });

    test('createLeaveRequest is WRITE operation and requires confirmation', () => {
      const meta = getToolMetadata('createLeaveRequest');
      expect(meta.type).toBe('WRITE');
      expect(meta.requiresConfirmation).toBe(true);
    });

    test('all 12 planned tools exist in TOOL_METADATA', () => {
      const expectedTools = [
        'searchPolicy', 'getEmployee', 'checkLeaveBalance', 'createLeaveRequest',
        'createHRTask', 'getEmployeeAssets', 'createITTicket', 'findAvailableResources',
        'allocateResources', 'transferEmployee', 'createOnboarding', 'createTask',
      ];
      expectedTools.forEach((toolName) => {
        expect(TOOL_METADATA[toolName]).toBeDefined();
        expect(['READ', 'WRITE']).toContain(TOOL_METADATA[toolName].type);
      });
    });

  });

  describe('4. Tool Execution & NOT_IMPLEMENTED Safety Contract', () => {

    test('unimplemented tools return NOT_IMPLEMENTED status and NEVER fake success', async () => {
      const unimplTools = [
        'getEmployee', 'checkLeaveBalance', 'createLeaveRequest',
        'createHRTask', 'getEmployeeAssets', 'createITTicket',
        'findAvailableResources', 'allocateResources', 'transferEmployee', 'createOnboarding',
      ];

      for (const toolName of unimplTools) {
        const result = await executeTool(toolName, { userId: 'demo-user' });
        expect(result.success).toBe(false);
        expect(result.status).toBe('NOT_IMPLEMENTED');
        expect(result.tool).toBe(toolName);
        expect(result.error).toContain('not implemented');
      }
    });

    test('unknown tool returns FAILED status', async () => {
      const result = await executeTool('nonExistentTool');
      expect(result.success).toBe(false);
      expect(result.status).toBe('FAILED');
    });

    test('implemented searchPolicy calls KB service and returns SUCCESS', async () => {
      setKbClient({
        send: async () => ({
          retrievalResults: [
            {
              score: 0.85,
              content: { text: 'Maternity leave is 16 weeks paid.' },
              location: { s3Location: { uri: 's3://bucket/knowledge-base/hr/maternity-policy.txt' } },
              metadata: { category: 'HR' },
            },
          ],
        }),
      });

      const result = await executeTool('searchPolicy', { query: 'maternity leave' });
      expect(result.success).toBe(true);
      expect(result.status).toBe('SUCCESS');
      expect(result.data.documents).toHaveLength(1);
    });

  });

  describe('5. Agent Orchestration Normalization', () => {

    test('runAgent returns normalized result structure', async () => {
      setKbClient({ send: async () => ({ retrievalResults: [] }) });

      const res = await runAgent({ message: 'I need maternity leave', userId: 'user-1' });

      expect(res.intent).toBe(INTENTS.MATERNITY_LEAVE);
      expect(res.plan).toBeDefined();
      expect(res.toolResults.length).toBeGreaterThan(0);
      expect(res.requiresConfirmation).toBe(true);
      expect(res.status).toBe('PARTIAL_NOT_IMPLEMENTED');
      expect(typeof res.summary).toBe('string');
    });

    test('runAgent throws error on missing message', async () => {
      await expect(runAgent({ userId: 'user-1' })).rejects.toThrow('requires a valid message string');
    });

  });

});

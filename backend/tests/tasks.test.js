/**
 * tasks.test.js — Task handler tests with mocked DynamoDB client
 */

import { handleGetTasks, handleCreateTask, handleUpdateTask } from '../src/handlers/tasks.js';
import { _setClientForTesting } from '../src/services/dynamodb.js';

const MOCK_TASK = {
  userId: 'user1', taskId: 'task-abc', title: 'Complete security training',
  category: 'Learning', dueDate: '2026-09-01', completed: false, urgent: false,
  createdAt: '2026-08-28T00:00:00.000Z',
};

function makeEvent(body, qs = {}, params = {}) {
  return {
    body: JSON.stringify(body),
    isBase64Encoded: false,
    queryStringParameters: qs,
    pathParameters: params,
  };
}

function mockClient(overrides = {}) {
  return {
    send: async (cmd) => {
      const name = cmd.constructor.name;
      if (name === 'QueryCommand')  return { Items: overrides.query ?? [] };
      if (name === 'PutCommand')    return {};
      if (name === 'GetCommand')    return { Item: overrides.item ?? null };
      if (name === 'UpdateCommand') return { Attributes: { ...MOCK_TASK, completed: true, updatedAt: '2026-08-28T01:00:00Z' } };
      return {};
    },
  };
}

describe('Tasks Handler', () => {

  test('GET — 400 when userId missing', async () => {
    const res = await handleGetTasks({ queryStringParameters: {} });
    expect(res.statusCode).toBe(400);
  });

  test('GET — returns task list', async () => {
    _setClientForTesting(mockClient({ query: [MOCK_TASK] }));
    const res = await handleGetTasks({ queryStringParameters: { userId: 'user1' } });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.tasks).toHaveLength(1);
    expect(body.tasks[0].title).toBe('Complete security training');
  });

  test('POST — 400 when title missing', async () => {
    const res = await handleCreateTask(makeEvent({ userId: 'user1' }));
    expect(res.statusCode).toBe(400);
  });

  test('POST — creates task successfully', async () => {
    _setClientForTesting(mockClient());
    const res = await handleCreateTask(makeEvent({
      userId: 'user1', title: 'Read onboarding docs', category: 'Onboarding',
    }));
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.task.title).toBe('Read onboarding docs');
    expect(body.task.completed).toBe(false);
  });

  test('PATCH — 404 when task not found', async () => {
    _setClientForTesting(mockClient({ item: null }));
    const res = await handleUpdateTask(makeEvent({ userId: 'user1', completed: true }, {}, { taskId: 'task-xyz' }));
    expect(res.statusCode).toBe(404);
  });

  test('PATCH — updates task completed status', async () => {
    _setClientForTesting(mockClient({ item: MOCK_TASK }));
    const res = await handleUpdateTask(makeEvent({ userId: 'user1', completed: true }, {}, { taskId: 'task-abc' }));
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.task.completed).toBe(true);
  });

});

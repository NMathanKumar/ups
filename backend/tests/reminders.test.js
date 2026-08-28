/**
 * reminders.test.js — Reminder handler tests with mocked DynamoDB client
 */

import { handleGetReminders, handleCreateReminder } from '../src/handlers/reminders.js';
import { _setClientForTesting } from '../src/services/dynamodb.js';

function makeEvent(body, qs = {}) {
  return { body: JSON.stringify(body), isBase64Encoded: false, queryStringParameters: qs };
}

function mockClient(items = []) {
  return {
    send: async (cmd) => {
      if (cmd.constructor.name === 'QueryCommand') return { Items: items };
      return {};
    },
  };
}

describe('Reminders Handler', () => {

  test('GET — 400 when userId missing', async () => {
    const res = await handleGetReminders({ queryStringParameters: {} });
    expect(res.statusCode).toBe(400);
  });

  test('GET — returns empty reminder list', async () => {
    _setClientForTesting(mockClient([]));
    const res = await handleGetReminders({ queryStringParameters: { userId: 'user1' } });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.reminders).toHaveLength(0);
  });

  test('POST — 400 when text missing', async () => {
    const res = await handleCreateReminder(makeEvent({ userId: 'user1' }));
    expect(res.statusCode).toBe(400);
  });

  test('POST — creates reminder successfully', async () => {
    _setClientForTesting(mockClient());
    const res = await handleCreateReminder(makeEvent({
      userId: 'user1', text: 'Complete security training by Sept 30',
    }));
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.reminder.text).toBe('Complete security training by Sept 30');
    expect(body.reminder.completed).toBe(false);
  });

});

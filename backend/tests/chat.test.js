/**
 * chat.test.js — Chat handler + KB/Bedrock services with mocked AWS clients.
 *
 * NOTE: Tests use injected mock clients. The actual application uses real AWS services.
 * Passing tests confirm handler logic is correct — NOT that RAG works in AWS.
 * Real Bedrock/KB testing requires deployed AWS resources.
 */

import { handleChat } from '../src/handlers/chat.js';
import { _setClientForTesting as setKbClient } from '../src/services/knowledgeBase.js';
import { _setClientForTesting as setBedrockClient } from '../src/services/bedrock.js';
import { _setClientForTesting as setDbClient } from '../src/services/dynamodb.js';

function makeEvent(body) {
  return { body: JSON.stringify(body), isBase64Encoded: false };
}

function mockKbClient(results) {
  return { send: async () => ({ retrievalResults: results }) };
}

function mockBedrockClient(answerText) {
  return {
    send: async () => ({
      body: Buffer.from(
        JSON.stringify({ content: [{ type: 'text', text: answerText }] })
      ),
    }),
  };
}

function mockDynamoClient(queryItems = []) {
  return {
    send: async (cmd) => {
      if (cmd.constructor.name === 'QueryCommand') return { Items: queryItems };
      return {};
    },
  };
}

describe('Chat Handler', () => {

  test('400 on missing message', async () => {
    const res = await handleChat(makeEvent({ userId: 'user1' }));
    expect(res.statusCode).toBe(400);
  });

  test('400 on empty message', async () => {
    const res = await handleChat(makeEvent({ message: '   ', userId: 'user1' }));
    expect(res.statusCode).toBe(400);
  });

  test('400 on missing userId', async () => {
    const res = await handleChat(makeEvent({ message: 'How many leave days?' }));
    expect(res.statusCode).toBe(400);
  });

  test('400 on invalid JSON body', async () => {
    const res = await handleChat({ body: '{invalid json}', isBase64Encoded: false });
    expect(res.statusCode).toBe(400);
  });

  test('returns "not found" when KB returns no relevant results', async () => {
    setKbClient(mockKbClient([]));
    setDbClient(mockDynamoClient());
    const res = await handleChat(makeEvent({ message: 'xyz unknown topic', userId: 'user1' }));
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.sources).toHaveLength(0);
    expect(body.answer).toMatch(/couldn't find/i);
  });

  test('returns grounded answer when KB returns relevant results', async () => {
    setKbClient(mockKbClient([
      {
        score: 0.92,
        content: { text: 'Employees may work remotely up to 3 days per week.' },
        location: { s3Location: { uri: 's3://bucket/knowledge-base/hr/work-from-home-policy.txt' } },
        metadata: { category: 'HR' },
      },
    ]));
    setBedrockClient(mockBedrockClient('Employees can work from home up to 3 days per week with manager approval.'));
    setDbClient(mockDynamoClient());
    const res = await handleChat(makeEvent({ message: 'Can I work from home?', userId: 'user1' }));
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.answer).toContain('3 days');
    expect(body.sources).toHaveLength(1);
    expect(body.sources[0].document).toBe('work-from-home-policy.txt');
    expect(body.category).toBe('HR');
  });

  test('filters KB results below relevance threshold', async () => {
    setKbClient(mockKbClient([
      {
        score: 0.1, // below 0.4 threshold
        content: { text: 'Some text.' },
        location: { s3Location: { uri: 's3://bucket/knowledge-base/hr/leave-policy.txt' } },
        metadata: {},
      },
    ]));
    setDbClient(mockDynamoClient());
    const res = await handleChat(makeEvent({ message: 'Leave question', userId: 'user1' }));
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.sources).toHaveLength(0);
    expect(body.answer).toMatch(/couldn't find/i);
  });

});

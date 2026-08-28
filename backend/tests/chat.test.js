/**
 * chat.test.js — Step 10: chat handler delegates to Agent → KB → Bedrock
 *
 * These tests verify the full request path through the agent layer
 * without calling real AWS services.
 */

import { handleChat } from '../src/handlers/chat.js';
import { _setClientForTesting as setKbClient }      from '../src/services/knowledgeBase.js';
import { _setClientForTesting as setBedrockClient } from '../src/services/bedrock.js';
import { _setClientForTesting as setDbClient }      from '../src/services/dynamodb.js';

// ── Helpers ────────────────────────────────────────────────────────────────

function event(body) {
  return { body: JSON.stringify(body), isBase64Encoded: false };
}

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

function dynamoClient(queryItems = []) {
  return {
    send: async (cmd) => {
      if (cmd.constructor.name === 'QueryCommand') return { Items: queryItems };
      return {};
    },
  };
}

const GOOD_DOC = {
  score: 0.91,
  content: { text: 'Employees may work remotely up to 3 days per week, subject to manager approval.' },
  location: { s3Location: { uri: 's3://bucket/knowledge-base/hr/work-from-home-policy.txt' } },
  metadata: { category: 'HR' },
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Chat Handler → Agent Integration (Step 10)', () => {

  describe('Input Validation', () => {
    test('400 on missing message', async () => {
      const res = await handleChat(event({ userId: 'u1' }));
      expect(res.statusCode).toBe(400);
    });

    test('400 on empty message', async () => {
      const res = await handleChat(event({ message: '  ', userId: 'u1' }));
      expect(res.statusCode).toBe(400);
    });

    test('400 on missing userId', async () => {
      const res = await handleChat(event({ message: 'How many leave days?' }));
      expect(res.statusCode).toBe(400);
    });

    test('400 on invalid JSON body', async () => {
      const res = await handleChat({ body: '{bad json', isBase64Encoded: false });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POLICY_QUESTION — Full Agent → KB → Bedrock Path', () => {

    test('returns grounded answer + sources when KB has relevant docs', async () => {
      setKbClient(kbClient([GOOD_DOC]));
      setBedrockClient(bedrockClient('You can work from home up to 3 days per week.'));
      setDbClient(dynamoClient());

      const res = await handleChat(event({ message: 'What is the work from home policy?', userId: 'u1' }));
      expect(res.statusCode).toBe(200);

      const body = JSON.parse(res.body);
      expect(body.answer).toContain('3 days');
      expect(body.sources).toHaveLength(1);
      expect(body.sources[0].document).toBe('work-from-home-policy.txt');
      expect(body.sources[0].category).toBe('HR');
      expect(typeof body.sources[0].relevance).toBe('number');
      expect(body.category).toBe('HR');
    });

    test('searchPolicy is called with the user message', async () => {
      let capturedQuery = null;
      setKbClient({
        send: async (cmd) => {
          capturedQuery = cmd.input?.retrievalQuery?.text;
          return { retrievalResults: [GOOD_DOC] };
        },
      });
      setBedrockClient(bedrockClient('3 days per week.'));
      setDbClient(dynamoClient());

      await handleChat(event({ message: 'Can I work from home?', userId: 'u1' }));
      expect(capturedQuery).toBe('Can I work from home?');
    });

    test('returns "not found" response — no hallucination — when KB has no results', async () => {
      setKbClient(kbClient([]));
      setDbClient(dynamoClient());

      const res = await handleChat(event({ message: 'What is the obscure thing?', userId: 'u1' }));
      expect(res.statusCode).toBe(200);

      const body = JSON.parse(res.body);
      expect(body.sources).toHaveLength(0);
      expect(body.answer).toMatch(/couldn't find/i);
      expect(body.category).toBeNull();
    });

    test('filters KB docs below relevance threshold before generation', async () => {
      setKbClient(kbClient([{
        score: 0.15,  // below 0.4 threshold
        content: { text: 'Some irrelevant text.' },
        location: { s3Location: { uri: 's3://b/knowledge-base/hr/foo.txt' } },
        metadata: {},
      }]));
      setDbClient(dynamoClient());

      const res = await handleChat(event({ message: 'Leave question', userId: 'u1' }));
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.sources).toHaveLength(0);
      expect(body.answer).toMatch(/couldn't find/i);
    });

    test('retrieved context is passed to Bedrock — not empty', async () => {
      let capturedBody = null;
      setKbClient(kbClient([GOOD_DOC]));
      setDbClient(dynamoClient());
      setBedrockClient({
        send: async (cmd) => {
          capturedBody = JSON.parse(cmd.input?.body ?? '{}');
          return {
            body: Buffer.from(JSON.stringify({ content: [{ type: 'text', text: 'Answer here.' }] })),
          };
        },
      });

      await handleChat(event({ message: 'WFH policy?', userId: 'u1' }));

      // The prompt sent to Bedrock must contain the retrieved KB text
      const promptText = capturedBody?.messages?.[0]?.content ?? '';
      expect(promptText).toContain('work-from-home-policy.txt');
      expect(promptText).toContain('Employees may work remotely');
    });
  });

  describe('Error Handling', () => {

    test('returns 500 when KB throws', async () => {
      setKbClient({ send: async () => { throw new Error('KB network error'); } });
      setDbClient(dynamoClient());

      const res = await handleChat(event({ message: 'WFH policy?', userId: 'u1' }));
      expect(res.statusCode).toBe(500);
      const body = JSON.parse(res.body);
      expect(body.error).toMatch(/unable to (process|retrieve)/i);
    });

    test('returns 500 when Bedrock generation throws', async () => {
      setKbClient(kbClient([GOOD_DOC]));
      setDbClient(dynamoClient());
      setBedrockClient({ send: async () => { throw new Error('Bedrock timeout'); } });

      const res = await handleChat(event({ message: 'WFH policy?', userId: 'u1' }));
      expect(res.statusCode).toBe(500);
      const body = JSON.parse(res.body);
      expect(body.error).toMatch(/unable to process/i);
    });
  });

  describe('Non-policy Intents (Unimplemented Business Workflows)', () => {

    test('MATERNITY_LEAVE returns not-found (workflow not implemented)', async () => {
      // searchPolicy finds nothing; write tools are NOT_IMPLEMENTED → no fake success
      setKbClient(kbClient([]));
      setDbClient(dynamoClient());

      const res = await handleChat(event({ message: 'I need maternity leave', userId: 'u1' }));
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      // Must NOT claim leave was created
      expect(body.answer).not.toMatch(/leave.*(created|submitted|approved)/i);
    });
  });

});

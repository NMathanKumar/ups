/**
 * knowledgeBase.js
 * Retrieves relevant document chunks from Amazon Bedrock Knowledge Base.
 * Uses the Bedrock Agent Runtime RetrieveCommand (NOT RetrieveAndGenerate).
 * Retrieval and generation are intentionally separated so we can:
 *   - control the prompt precisely
 *   - inject conversation history
 *   - apply relevance filtering
 */

import { BedrockAgentRuntimeClient, RetrieveCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { config } from '../config/environment.js';

let _client = null;
function getClient() {
  if (!_client) {
    _client = new BedrockAgentRuntimeClient({ region: config.awsRegion });
  }
  return _client;
}

/** For testing — inject a mock client */
export function _setClientForTesting(mockClient) {
  _client = mockClient;
}

const MAX_RESULTS = 5;

/**
 * Retrieve relevant enterprise document chunks for a given query.
 *
 * @param {string} query - The employee's question.
 * @returns {Promise<Array<{ text: string, source: string, score: number, category: string }>>}
 *   Returns an empty array if no relevant results meet the threshold.
 *   Throws for actual AWS / network errors.
 */
export async function retrieveRelevantDocuments(query) {
  const command = new RetrieveCommand({
    knowledgeBaseId: config.bedrockKnowledgeBaseId,
    retrievalQuery: { text: query },
    retrievalConfiguration: {
      vectorSearchConfiguration: {
        numberOfResults: MAX_RESULTS,
      },
    },
  });

  const response = await getClient().send(command);
  const results = response.retrievalResults ?? [];

  const normalized = results
    .map((r) => {
      const score = r.score ?? 0;
      const text = r.content?.text ?? '';
      const location = r.location?.s3Location?.uri ?? '';
      const filename = location.split('/').pop() ?? 'unknown';
      const metadata = r.metadata ?? {};
      const category = detectCategory(filename, metadata);

      return { text, source: filename, score, category, location };
    })
    // Filter by relevance threshold
    .filter((r) => r.score >= config.bedrockRelevanceThreshold);

  return normalized;
}

/**
 * Detect document category from filename or metadata.
 * Bedrock metadata is preferred when available.
 */
function detectCategory(filename, metadata) {
  if (metadata?.category) return metadata.category.toUpperCase();

  const f = filename.toLowerCase();
  if (f.includes('hr') || f.includes('leave') || f.includes('benefit') ||
      f.includes('work-from-home') || f.includes('attendance')) return 'HR';
  if (f.includes('vpn') || f.includes('password') || f.includes('laptop') ||
      f.includes('software') || f.includes('it-support')) return 'IT';
  if (f.includes('security') || f.includes('privacy') || f.includes('learning')) return 'LEARNING';
  if (f.includes('onboard') || f.includes('first-week') || f.includes('resource')) return 'ONBOARDING';
  return 'GENERAL';
}

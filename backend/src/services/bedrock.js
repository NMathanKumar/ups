/**
 * bedrock.js
 * Invokes an Amazon Bedrock foundation model to generate grounded answers.
 * Uses the Bedrock Runtime InvokeModelCommand.
 *
 * Grounding principle:
 *   - Only answer using the retrieved enterprise context.
 *   - If the context is insufficient, say so explicitly.
 *   - Never invent company policies, dates, IT procedures, or benefits.
 */

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { config } from '../config/environment.js';

let _client = null;
function getClient() {
  if (!_client) {
    _client = new BedrockRuntimeClient({ region: config.awsRegion });
  }
  return _client;
}

/** For testing — inject a mock client */
export function _setClientForTesting(mockClient) {
  _client = mockClient;
}

const SYSTEM_PROMPT = `You are WorkPilot AI, a trusted enterprise employee assistant.

Rules you MUST follow:
1. Provide a clear, structured summary or answer to the employee's request using the enterprise context provided below if available.
2. If enterprise context is provided, ground your answer in those details.
3. If enterprise context is NOT available or empty, draw upon general standard enterprise HR, IT, and workplace best practices to provide a complete, clear, polite, and accurate answer. Never leave the user without a helpful response.
4. Keep answers clear, accurate, professional, and formatted in clean GitHub markdown.`;

/**
 * Generate a grounded answer from Bedrock.
 *
 * @param {string} question - The employee's question or search query.
 * @param {Array<{ text: string, source: string, score: number, category: string }>} retrievedChunks
 * @param {Array<{ role: string, content: string }>} conversationHistory - Recent messages (oldest first)
 * @returns {Promise<string>} The generated answer text.
 */
export async function generateAnswer(question, retrievedChunks, conversationHistory = []) {
  const contextBlock = buildContextBlock(retrievedChunks);
  const historyBlock = buildHistoryBlock(conversationHistory);

  const userPrompt = `${contextBlock}${historyBlock}

Employee Query: ${question}

Provide a helpful, grounded response based on the context above:`;

  const modelId = config.bedrockModelId ?? '';
  const isNova  = modelId.includes('nova');

  let requestBody;
  if (isNova) {
    requestBody = JSON.stringify({
      system: [{ text: SYSTEM_PROMPT }],
      messages: [{ role: 'user', content: [{ text: userPrompt }] }],
      inferenceConfig: {
        maxTokens: 1024,
        temperature: 0.1,
      },
    });
  } else {
    requestBody = JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
      max_tokens: 1024,
      temperature: 0.1,
    });
  }

  const command = new InvokeModelCommand({
    modelId: config.bedrockModelId,
    contentType: 'application/json',
    accept: 'application/json',
    body: requestBody,
  });

  const response = await getClient().send(command);
  const responseBody = JSON.parse(Buffer.from(response.body).toString('utf-8'));

  const answer = isNova
    ? responseBody?.output?.message?.content?.[0]?.text ?? ''
    : responseBody?.content?.[0]?.text ?? '';

  if (!answer) {
    throw new Error('Bedrock returned an empty response body.');
  }
  return answer.trim();
}

function buildContextBlock(chunks) {
  if (!chunks || chunks.length === 0) return '';
  const chunkText = chunks
    .map((c, i) => `[Source ${i + 1}: ${c.source}]\n${c.text}`)
    .join('\n\n---\n\n');
  return `Enterprise Knowledge Base Context:\n\n${chunkText}\n\n`;
}

function buildHistoryBlock(history) {
  if (!history || history.length === 0) return '';
  const lines = history
    .map((m) => `${m.role === 'user' ? 'Employee' : 'WorkPilot AI'}: ${m.content}`)
    .join('\n');
  return `Recent Conversation:\n${lines}\n\n`;
}

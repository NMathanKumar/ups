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
1. Answer the employee's question using ONLY the enterprise context provided below.
2. Do NOT use general knowledge to invent company policies, procedures, benefits, dates, IT instructions, or internal processes.
3. If the enterprise context does not contain enough information to answer the question, respond with: "I couldn't find this information in the available enterprise documents. Please contact HR or IT support for assistance."
4. Keep answers concise, accurate, and helpful.
5. When possible, indicate which document supports your answer.
6. Do not guess or speculate about information that is not in the context.`;

/**
 * Generate a grounded answer from Bedrock.
 *
 * @param {string} question - The employee's question.
 * @param {Array<{ text: string, source: string, score: number, category: string }>} retrievedChunks
 * @param {Array<{ role: string, content: string }>} conversationHistory - Recent messages (oldest first)
 * @returns {Promise<string>} The generated answer text.
 */
export async function generateAnswer(question, retrievedChunks, conversationHistory = []) {
  const contextBlock = buildContextBlock(retrievedChunks);
  const historyBlock = buildHistoryBlock(conversationHistory);

  const userPrompt = `${contextBlock}${historyBlock}

Employee Question: ${question}

Answer:`;

  // Build the messages array for the Claude Messages API
  const messages = [
    { role: 'user', content: userPrompt },
  ];

  const requestBody = JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    system: SYSTEM_PROMPT,
    messages,
    max_tokens: 1024,
    temperature: 0.1, // low temperature = more grounded, less creative
  });

  const command = new InvokeModelCommand({
    modelId: config.bedrockModelId,
    contentType: 'application/json',
    accept: 'application/json',
    body: requestBody,
  });

  const response = await getClient().send(command);
  const responseBody = JSON.parse(Buffer.from(response.body).toString('utf-8'));

  // Claude response format: content[0].text
  const answer = responseBody?.content?.[0]?.text ?? '';
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

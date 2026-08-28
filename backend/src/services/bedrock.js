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

const SYSTEM_PROMPT = `You are WorkPilot AI, a direct, helpful, and conversational enterprise AI assistant (similar to ChatGPT and Claude).

CRITICAL CONVERSATIONAL RULES:
1. **Direct Answer First**: Always answer the employee's specific question directly in the very first sentence. For example, if asked "so how long can I take it?", respond immediately with: "You can take up to **30 days of fully paid accident leave** per occurrence under Apex Enterprise policy."
2. **NO Robotic Meta-Phrases**: NEVER use meta-intros such as "Based on the provided enterprise context...", "Here is a summary of...", "According to the document...", or "As stated in the policy...". Talk naturally like a knowledgeable enterprise advisor.
3. **Conversational & Precise**: Be direct, warm, and helpful. If the user asks a follow-up question, use the conversation history to address their specific query in context.
4. **Clean Markdown Formatting**: Use bold highlights and clean bullet points to keep information clear and readable.
5. **Grounded & Reliable**: Ground your answers in the provided enterprise context. If no document context is provided, provide standard enterprise HR/IT best practices without leaving the user without an answer.`;

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
Employee Question: ${question}

Instructions: Answer the question directly in the first line. Do NOT output "Based on the context" or document summary headers. Provide a clear, natural conversational response:`;

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

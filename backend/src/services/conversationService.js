/**
 * conversationService.js
 * Manages per-user conversation history in DynamoDB.
 *
 * DynamoDB Schema:
 *   PK (partition key): userId (String)
 *   SK (sort key): timestamp#uuid (String) — enables chronological query
 *
 * Only a limited recent window is returned to keep Bedrock prompts concise.
 */

import { randomUUID } from 'crypto';
import * as db from './dynamodb.js';
import { config } from '../config/environment.js';

const TABLE = () => config.conversationsTableName;

/**
 * Save a single message to conversation history.
 * @param {string} userId
 * @param {'user'|'assistant'} role
 * @param {string} content
 */
export async function saveMessage(userId, role, content) {
  const timestamp = new Date().toISOString();
  const sk = `${timestamp}#${randomUUID()}`;
  await db.putItem(TABLE(), {
    userId,
    sk,
    role,
    content,
    timestamp,
    ttl: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 day TTL
  });
}

/**
 * Retrieve the most recent N messages for a user (oldest first for prompt building).
 * @param {string} userId
 * @param {number} limit
 * @returns {Promise<Array<{ role: string, content: string }>>}
 */
export async function getRecentMessages(userId, limit = null) {
  const n = limit ?? config.conversationWindowSize;
  const items = await db.queryItems(
    TABLE(),
    'userId = :uid',
    { ':uid': userId },
  );
  // Sort by sk (which starts with ISO timestamp) descending, take last n, then reverse to chronological
  const sorted = items.sort((a, b) => b.sk.localeCompare(a.sk)).slice(0, n).reverse();
  return sorted.map((i) => ({ role: i.role, content: i.content }));
}

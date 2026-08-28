/**
 * jest.setup.js
 * Sets all required environment variables before any test module is loaded.
 * This runs before module resolution in Jest's ESM mode.
 */

process.env.AWS_REGION = 'us-east-1';
process.env.BEDROCK_KNOWLEDGE_BASE_ID = 'test-kb-id';
process.env.BEDROCK_MODEL_ID = 'anthropic.claude-3-haiku-20240307-v1:0';
process.env.TASKS_TABLE_NAME = 'test-tasks';
process.env.REMINDERS_TABLE_NAME = 'test-reminders';
process.env.CONVERSATIONS_TABLE_NAME = 'test-conversations';
process.env.FRONTEND_ORIGIN = 'http://localhost:5173';
process.env.BEDROCK_RELEVANCE_THRESHOLD = '0.4';
process.env.CONVERSATION_WINDOW_SIZE = '10';

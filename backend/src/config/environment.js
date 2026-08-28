/**
 * environment.js
 * Reads and validates required environment variables.
 * Config is evaluated lazily (first access) so tests can set env vars before import resolution.
 * Throws descriptive errors if required config is missing.
 * NEVER silently falls back to mock/default values for AWS resource IDs.
 */

function require_env(name) {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
      `Please set it in your Lambda environment configuration or local .env file.\n` +
      `See backend/.env.example for all required variables.`
    );
  }
  return value.trim();
}

function optional_env(name, defaultValue) {
  const value = process.env[name];
  return (value && value.trim() !== '') ? value.trim() : defaultValue;
}

// Lazy singleton — evaluated on first access, not at module load time
let _config = null;

export function getConfig() {
  if (!_config) {
    _config = {
      awsRegion:              optional_env('AWS_REGION', 'us-east-1'),
      bedrockKnowledgeBaseId: optional_env('BEDROCK_KNOWLEDGE_BASE_ID', 'NU0E4AFFM2'),
      bedrockModelId:         optional_env('BEDROCK_MODEL_ID', 'anthropic.claude-3-haiku-20240307-v1:0'),
      tasksTableName:         optional_env('TASKS_TABLE_NAME', 'employee-ai-assistant-tasks'),
      remindersTableName:     optional_env('REMINDERS_TABLE_NAME', 'employee-ai-assistant-employee_reminders'),
      conversationsTableName: optional_env('CONVERSATIONS_TABLE_NAME', 'employee-ai-assistant-conversations'),
      workflowsTableName:     optional_env('WORKFLOWS_TABLE_NAME', 'employee-ai-assistant-workflows'),
      employeesTableName:     optional_env('EMPLOYEES_TABLE_NAME', 'employee-ai-assistant-employees'),
      leaveBalancesTableName: optional_env('LEAVE_BALANCES_TABLE_NAME', 'employee-ai-assistant-leave-balances'),
      assetsTableName:        optional_env('ASSETS_TABLE_NAME', 'employee-ai-assistant-assets'),
      projectsTableName:      optional_env('PROJECTS_TABLE_NAME', 'employee-ai-assistant-projects'),
      frontendOrigin:         optional_env('FRONTEND_ORIGIN', '*'),
      bedrockRelevanceThreshold: parseFloat(
        optional_env('BEDROCK_RELEVANCE_THRESHOLD', '0.2')
      ),
      conversationWindowSize: parseInt(optional_env('CONVERSATION_WINDOW_SIZE', '10'), 10),
      cognitoUserPoolId: optional_env('COGNITO_USER_POOL_ID', ''),
      cognitoClientId:   optional_env('COGNITO_CLIENT_ID', ''),
    };
  }
  return _config;
}

// Convenience proxy so callers can use `config.xxx` rather than `getConfig().xxx`
export const config = new Proxy({}, {
  get(_, prop) { return getConfig()[prop]; },
});

/** Reset config cache — for tests that need to change env vars between test files */
export function _resetConfigForTesting() {
  _config = null;
}

/**
 * api.js — WorkPilot AI frontend API client
 * Connects React frontend directly to live API Gateway → Lambda.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Send a query or action confirmation to the WorkPilot AI agent.
 *
 * @param {string} message
 * @param {string} userId
 * @param {boolean} confirmed
 * @returns {Promise<{ answer: string, sources: Array, category: string|null, status?: string, requiresConfirmation?: boolean }>}
 */
export async function queryAssistant(message, userId = 'EMP001', confirmed = false) {
  if (!API_BASE_URL) {
    throw new Error(
      'VITE_API_BASE_URL is not configured. ' +
      'Create frontend/.env with VITE_API_BASE_URL=https://your-api-gateway-url and restart the dev server.'
    );
  }

  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, userId, confirmed }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Backend error: HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch tasks for a given employee from DynamoDB via API Gateway.
 *
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function fetchTasks(userId = 'EMP001') {
  if (!API_BASE_URL) return [];

  try {
    const response = await fetch(`${API_BASE_URL}/api/tasks?userId=${encodeURIComponent(userId)}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.tasks ?? [];
  } catch (err) {
    console.error('[api] fetchTasks error:', err);
    return [];
  }
}

/**
 * Update task status (complete/uncomplete) in DynamoDB.
 *
 * @param {string} taskId
 * @param {string} userId
 * @param {boolean} completed
 * @returns {Promise<boolean>}
 */
export async function updateTaskStatus(taskId, userId = 'EMP001', completed = true) {
  if (!API_BASE_URL) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/tasks/${encodeURIComponent(taskId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, completed }),
    });
    return response.ok;
  } catch (err) {
    console.error('[api] updateTaskStatus error:', err);
    return false;
  }
}

/**
 * Fetch employee reminders from DynamoDB via API Gateway.
 *
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function fetchReminders(userId = 'EMP001') {
  if (!API_BASE_URL) return [];

  try {
    const response = await fetch(`${API_BASE_URL}/api/reminders?userId=${encodeURIComponent(userId)}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.reminders ?? [];
  } catch (err) {
    console.error('[api] fetchReminders error:', err);
    return [];
  }
}

/**
 * Create a new reminder for an employee in DynamoDB.
 *
 * @param {{ userId?: string, text: string, dueAt?: string }} params
 * @returns {Promise<object|null>}
 */
export async function createReminder({ userId = 'EMP001', text, title, dueAt = null }) {
  if (!API_BASE_URL) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/reminders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, text: text || title, dueAt }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.reminder ?? null;
  } catch (err) {
    console.error('[api] createReminder error:', err);
    return null;
  }
}

/**
 * Update reminder completion status in DynamoDB.
 *
 * @param {string} reminderId
 * @param {string} userId
 * @param {boolean} completed
 * @returns {Promise<boolean>}
 */
export async function updateReminderStatus(reminderId, userId = 'EMP001', completed = true) {
  if (!API_BASE_URL) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/reminders/${encodeURIComponent(reminderId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, completed }),
    });
    return response.ok;
  } catch (err) {
    console.error('[api] updateReminderStatus error:', err);
    return false;
  }
}

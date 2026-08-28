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
 * Update task status (complete/uncomplete) in DynamoDB & sync local persistent store.
 *
 * @param {string} taskId
 * @param {string} userId
 * @param {boolean} completed
 * @param {object} [extraData]
 * @returns {Promise<boolean>}
 */
export async function updateTaskStatus(taskId, userId = 'EMP001', completed = true, extraData = {}) {
  // Always persist local override immediately so state never reverts
  try {
    const saved = localStorage.getItem('workpilot_task_overrides');
    const overrides = saved ? JSON.parse(saved) : {};
    overrides[taskId] = completed;
    localStorage.setItem('workpilot_task_overrides', JSON.stringify(overrides));
  } catch (e) {
    console.warn('[api] Failed writing local task override:', e);
  }

  if (!API_BASE_URL) return true;

  try {
    const response = await fetch(`${API_BASE_URL}/api/tasks/${encodeURIComponent(taskId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, completed, ...extraData }),
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

/**
 * Fetch employee onboarding status from Onboarding Microservice API.
 *
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
export async function fetchOnboardingStatus(userId = 'EMP001') {
  if (!API_BASE_URL) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/onboarding/${encodeURIComponent(userId)}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.data ?? data;
  } catch (err) {
    console.error('[api] fetchOnboardingStatus error:', err);
    return null;
  }
}

/**
 * Update course learning progress and sync with API Gateway.
 *
 * @param {{ courseId: string, title: string, progress: number, status: string, userId?: string }} params
 * @returns {Promise<boolean>}
 */
export async function saveLearningProgress({ courseId, title, progress, status, userId = 'EMP001' }) {
  if (!API_BASE_URL) return true;

  try {
    const isCompleted = progress >= 100 || status === 'completed';
    // Sync task status if it's a task-backed course
    if (courseId && !courseId.startsWith('l')) {
      await updateTaskStatus(courseId, userId, isCompleted);
    }
    window.dispatchEvent(new CustomEvent('workpilot-data-updated'));
    return true;
  } catch (err) {
    console.error('[api] saveLearningProgress error:', err);
    return false;
  }
}

/**
 * Sign up a new user via AWS Cognito Auth API.
 *
 * @param {{ name: string, email: string, phoneNumber: string, gender: string, designation: string, password: string }} userData
 * @returns {Promise<{ message: string, user: object }>}
 */
export async function signUpUser(userData) {
  const baseUrl = API_BASE_URL || 'https://h135maoxfc.execute-api.us-east-1.amazonaws.com';
  const response = await fetch(`${baseUrl}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || data.message || `Signup failed (${response.status})`);
  }
  return data;
}

/**
 * Log in an existing user via AWS Cognito Auth API.
 *
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ token: string, user: object }>}
 */
export async function loginUser(credentials) {
  const baseUrl = API_BASE_URL || 'https://h135maoxfc.execute-api.us-east-1.amazonaws.com';
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || data.message || `Login failed (${response.status})`);
  }
  return data;
}

/**
 * api.js — WorkPilot AI frontend API client
 * Calls the real backend via API Gateway → Lambda → Bedrock.
 *
 * Set VITE_API_BASE_URL in frontend/.env (see .env.example) to connect.
 * Without VITE_API_BASE_URL the app shows an informative error rather than
 * silently using mock data.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

/**
 * Send a message to the WorkPilot AI backend.
 * @param {string} message
 * @param {string} userId
 * @returns {Promise<{ answer: string, sources: Array, category: string|null }>}
 */
export async function queryAssistant(message, userId = 'demo-user') {
  if (!API_BASE_URL) {
    throw new Error(
      'VITE_API_BASE_URL is not configured. ' +
      'Create frontend/.env with VITE_API_BASE_URL=https://your-api-gateway-url and restart the dev server.'
    )
  }

  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, userId }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || `Backend error: HTTP ${response.status}`)
  }

  return response.json()
}

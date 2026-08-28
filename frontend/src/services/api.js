// api.js — placeholder for future AWS/Bedrock integration
// Currently returns mock data only. No real API calls are made.

export const API_BASE_URL = import.meta.env.VITE_API_URL || ''

/**
 * Future: POST to API Gateway → Lambda → Bedrock
 * Currently: returns null to signal mock mode
 */
export async function queryAssistant(message) {
  // TODO: Replace with real API call when backend is ready
  // const response = await fetch(`${API_BASE_URL}/chat`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ message }),
  // })
  // return response.json()
  return null
}

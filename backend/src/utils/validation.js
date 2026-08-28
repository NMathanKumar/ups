/**
 * validation.js
 * Input validators shared across handlers.
 */

export function validateMessage(message) {
  if (message === undefined || message === null) {
    return 'The "message" field is required.';
  }
  if (typeof message !== 'string') {
    return 'The "message" field must be a string.';
  }
  if (message.trim().length === 0) {
    return 'The "message" field cannot be empty.';
  }
  if (message.trim().length > 2000) {
    return 'The "message" field must not exceed 2000 characters.';
  }
  return null;
}

export function validateUserId(userId) {
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    return 'The "userId" field is required and must be a non-empty string.';
  }
  return null;
}

export function validateTaskBody(body) {
  if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
    return 'The "title" field is required.';
  }
  return null;
}

export function validateReminderBody(body) {
  if (!body.text || typeof body.text !== 'string' || !body.text.trim()) {
    return 'The "text" field is required.';
  }
  return null;
}

export function parseBody(event) {
  if (!event.body) return {};
  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf-8')
      : event.body;
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null; // caller checks for null → 400
  }
}

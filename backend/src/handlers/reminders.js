/**
 * reminders.js — Reminder management API
 * GET   /api/reminders?userId=X
 * POST  /api/reminders
 * PATCH /api/reminders/:reminderId
 */

import { randomUUID } from 'crypto';
import { ok, created, badRequest, serverError } from '../utils/response.js';
import { validateUserId, validateReminderBody, parseBody } from '../utils/validation.js';
import * as db from '../services/dynamodb.js';
import { config } from '../config/environment.js';

const TABLE = () => config.remindersTableName;

export async function handleGetReminders(event) {
  const userId = event.queryStringParameters?.userId;
  const err = validateUserId(userId);
  if (err) return badRequest(err);

  try {
    const items = await db.queryItems(TABLE(), 'employee_id = :uid', { ':uid': userId });
    return ok({ reminders: items });
  } catch (e) {
    console.error('[reminders] GET error:', e);
    return serverError();
  }
}

export async function handleCreateReminder(event) {
  const body = parseBody(event);
  if (body === null) return badRequest('Invalid JSON in request body.');

  const userErr = validateUserId(body.userId);
  if (userErr) return badRequest(userErr);

  const reminderErr = validateReminderBody(body);
  if (reminderErr) return badRequest(reminderErr);

  const reminder = {
    employee_id: body.userId.trim(),
    reminder_id: `rem-${randomUUID()}`,
    text:        body.text.trim(),
    dueAt:       body.dueAt ?? null,
    completed:   false,
    createdAt:   new Date().toISOString(),
  };

  try {
    await db.putItem(TABLE(), reminder);
    return created({ reminder });
  } catch (e) {
    console.error('[reminders] POST error:', e);
    return serverError();
  }
}

export async function handleUpdateReminder(event) {
  const reminderId = event.pathParameters?.reminderId;
  if (!reminderId) return badRequest('Missing reminderId parameter.');

  const body = parseBody(event);
  if (body === null) return badRequest('Invalid JSON in request body.');

  const userId = body.userId ?? event.queryStringParameters?.userId;
  const err = validateUserId(userId);
  if (err) return badRequest(err);

  try {
    const items = await db.queryItems(TABLE(), 'employee_id = :uid', { ':uid': userId });
    const item = items.find(r => r.reminder_id === reminderId);

    if (!item) {
      return badRequest(`Reminder ${reminderId} not found for user ${userId}.`);
    }

    const updatedItem = {
      ...item,
      completed: body.completed ?? true,
      updatedAt: new Date().toISOString(),
    };

    await db.putItem(TABLE(), updatedItem);
    return ok({ reminder: updatedItem });
  } catch (e) {
    console.error('[reminders] PATCH error:', e);
    return serverError();
  }
}

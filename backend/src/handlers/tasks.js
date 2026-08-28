/**
 * tasks.js — Task management API
 * GET  /api/tasks?userId=X
 * POST /api/tasks
 * PATCH /api/tasks/:taskId
 */

import { randomUUID } from 'crypto';
import { ok, created, badRequest, notFound, serverError } from '../utils/response.js';
import { validateUserId, validateTaskBody, parseBody } from '../utils/validation.js';
import * as db from '../services/dynamodb.js';
import { config } from '../config/environment.js';

const TABLE = () => config.tasksTableName;

export async function handleGetTasks(event) {
  const userId = event.queryStringParameters?.userId;
  const err = validateUserId(userId);
  if (err) return badRequest(err);

  try {
    const items = await db.queryItems(TABLE(), 'userId = :uid', { ':uid': userId });
    return ok({ tasks: items });
  } catch (e) {
    console.error('[tasks] GET error:', e);
    return serverError();
  }
}

export async function handleCreateTask(event) {
  const body = parseBody(event);
  if (body === null) return badRequest('Invalid JSON in request body.');

  const userErr = validateUserId(body.userId);
  if (userErr) return badRequest(userErr);

  const taskErr = validateTaskBody(body);
  if (taskErr) return badRequest(taskErr);

  const task = {
    userId:    body.userId.trim(),
    taskId:    `task-${randomUUID()}`,
    title:     body.title.trim(),
    category:  body.category ?? 'General',
    dueDate:   body.dueDate ?? null,
    completed: false,
    urgent:    body.urgent ?? false,
    createdAt: new Date().toISOString(),
  };

  try {
    await db.putItem(TABLE(), task);
    return created({ task });
  } catch (e) {
    console.error('[tasks] POST error:', e);
    return serverError();
  }
}

export async function handleUpdateTask(event) {
  const body = parseBody(event);
  if (body === null) return badRequest('Invalid JSON in request body.');

  const taskId = event.pathParameters?.taskId ?? body.taskId;
  const userId = body.userId;

  if (!taskId) return badRequest('The "taskId" path parameter is required.');
  const userErr = validateUserId(userId);
  if (userErr) return badRequest(userErr);

  try {
    let existing = await db.getItem(TABLE(), { userId, taskId });

    if (!existing) {
      if (body.title || body.category) {
        existing = {
          userId,
          taskId,
          title: body.title,
          category: body.category || 'General',
          dueDate: body.dueDate || null,
          completed: Boolean(body.completed),
          createdAt: new Date().toISOString(),
        };
        await db.putItem(TABLE(), existing);
        return ok({ task: existing });
      }
      return notFound('Task not found.');
    }

    const updated = await db.updateItem(
      TABLE(),
      { userId, taskId },
      'SET completed = :c, updatedAt = :u',
      {
        ':c': body.completed !== undefined ? Boolean(body.completed) : existing.completed,
        ':u': new Date().toISOString(),
      },
    );
    return ok({ task: updated });
  } catch (e) {
    console.error('[tasks] PATCH error:', e);
    return serverError();
  }
}

/**
 * response.js
 * Builds consistent HTTP responses for Lambda / API Gateway HTTP API.
 * Includes CORS headers for frontend integration.
 */

import { config } from '../config/environment.js';

function buildCorsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': config.frontendOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export function ok(body) {
  return {
    statusCode: 200,
    headers: buildCorsHeaders(),
    body: JSON.stringify(body),
  };
}

export function created(body) {
  return {
    statusCode: 201,
    headers: buildCorsHeaders(),
    body: JSON.stringify(body),
  };
}

export function badRequest(message = 'Invalid request.') {
  return {
    statusCode: 400,
    headers: buildCorsHeaders(),
    body: JSON.stringify({ error: message }),
  };
}

export function notFound(message = 'Resource not found.') {
  return {
    statusCode: 404,
    headers: buildCorsHeaders(),
    body: JSON.stringify({ error: message }),
  };
}

export function unauthorized(message = 'Unauthorized.') {
  return {
    statusCode: 401,
    headers: buildCorsHeaders(),
    body: JSON.stringify({ error: message }),
  };
}

export function serverError(message = 'Unable to process the request.') {
  return {
    statusCode: 500,
    headers: buildCorsHeaders(),
    body: JSON.stringify({ error: message }),
  };
}

export function corsPreflightResponse() {
  return {
    statusCode: 204,
    headers: buildCorsHeaders(),
    body: '',
  };
}

/**
 * dynamodb.js
 * Low-level DynamoDB Document Client wrapper.
 * Uses @aws-sdk/lib-dynamodb for automatic JS type marshalling.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { config } from '../config/environment.js';

let _docClient = null;
function getDocClient() {
  if (!_docClient) {
    const base = new DynamoDBClient({ region: config.awsRegion });
    _docClient = DynamoDBDocumentClient.from(base, {
      marshallOptions: { removeUndefinedValues: true },
    });
  }
  return _docClient;
}

/** For testing — inject a mock client */
export function _setClientForTesting(mockClient) {
  _docClient = mockClient;
}

export async function putItem(tableName, item) {
  await getDocClient().send(new PutCommand({ TableName: tableName, Item: item }));
}

export async function getItem(tableName, key) {
  const result = await getDocClient().send(new GetCommand({ TableName: tableName, Key: key }));
  return result.Item ?? null;
}

export async function queryItems(tableName, keyConditionExpression, expressionAttributeValues, expressionAttributeNames = {}) {
  const params = {
    TableName: tableName,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeValues: expressionAttributeValues,
  };
  if (Object.keys(expressionAttributeNames).length > 0) {
    params.ExpressionAttributeNames = expressionAttributeNames;
  }
  const result = await getDocClient().send(new QueryCommand(params));
  return result.Items ?? [];
}

export async function updateItem(tableName, key, updateExpression, expressionAttributeValues, expressionAttributeNames = {}) {
  const params = {
    TableName: tableName,
    Key: key,
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  };
  if (Object.keys(expressionAttributeNames).length > 0) {
    params.ExpressionAttributeNames = expressionAttributeNames;
  }
  const result = await getDocClient().send(new UpdateCommand(params));
  return result.Attributes ?? {};
}

export async function deleteItem(tableName, key) {
  await getDocClient().send(new DeleteCommand({ TableName: tableName, Key: key }));
}

/**
 * Full table scan — use only for small demo tables.
 * For production, replace with Query or a proper index.
 */
export async function scanItems(tableName) {
  const result = await getDocClient().send(new ScanCommand({ TableName: tableName }));
  return result.Items ?? [];
}

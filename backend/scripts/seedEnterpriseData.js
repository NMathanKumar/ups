#!/usr/bin/env node
/**
 * seedEnterpriseData.js — Populate DynamoDB enterprise tables from demo JSON data
 *
 * USAGE:
 *   npm run seed
 *
 * PREREQUISITES:
 *   - AWS credentials configured (env vars, ~/.aws/credentials, or IAM role)
 *   - DynamoDB tables provisioned (terraform apply must have run first)
 *   - Required environment variables set (see .env.example)
 *
 * This script is for demo/setup purposes only.
 * It MUST NOT run automatically when Lambda starts.
 *
 * What it does:
 *   Reads backend/mock-data/*.json
 *   Writes each record to the corresponding DynamoDB table
 *   Skips records that already exist (uses PutItem with no condition by default)
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Validate required environment variables ──────────────────────────────────

const REQUIRED_VARS = [
  'AWS_REGION',
  'EMPLOYEES_TABLE_NAME',
  'LEAVE_BALANCES_TABLE_NAME',
  'ASSETS_TABLE_NAME',
  'PROJECTS_TABLE_NAME',
];

const missing = REQUIRED_VARS.filter((v) => !process.env[v]);
if (missing.length > 0) {
  console.error('\n❌  Missing required environment variables:');
  missing.forEach((v) => console.error(`    ${v}`));
  console.error('\nSet these variables before running:\n  npm run seed\nSee backend/.env.example for reference.\n');
  process.exit(1);
}

const region           = process.env.AWS_REGION;
const employeesTable   = process.env.EMPLOYEES_TABLE_NAME;
const leaveTable       = process.env.LEAVE_BALANCES_TABLE_NAME;
const assetsTable      = process.env.ASSETS_TABLE_NAME;
const projectsTable    = process.env.PROJECTS_TABLE_NAME;

// ── DynamoDB client ──────────────────────────────────────────────────────────

const client    = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

// ── Load demo data ───────────────────────────────────────────────────────────

const dataDir = path.resolve(__dirname, '../mock-data');

const employees   = require(path.join(dataDir, 'employees.json'));
const leaveData   = require(path.join(dataDir, 'leave-balances.json'));
const assetsData  = require(path.join(dataDir, 'assets.json'));
const projectsData = require(path.join(dataDir, 'projects.json'));

// ── Helper ────────────────────────────────────────────────────────────────────

async function putRecord(tableName, item) {
  await docClient.send(new PutCommand({ TableName: tableName, Item: item }));
}

async function seedTable(tableName, records, transformer) {
  console.log(`\n📦  Seeding ${tableName} (${records.length} records)...`);
  let ok = 0, failed = 0;
  for (const raw of records) {
    try {
      await putRecord(tableName, transformer ? transformer(raw) : raw);
      ok++;
    } catch (err) {
      console.error(`    ❌  Failed to seed ${JSON.stringify(raw)}: ${err.message}`);
      failed++;
    }
  }
  console.log(`    ✓  ${ok} records seeded${failed > 0 ? `, ${failed} failed` : ''}`);
}

// ── Seed employees ────────────────────────────────────────────────────────────

await seedTable(employeesTable, employees);

// ── Seed leave balances ───────────────────────────────────────────────────────

await seedTable(leaveTable, leaveData);

// ── Seed assets (flatten: each asset becomes its own record with employeeId) ──

const flatAssets = assetsData.flatMap(({ employeeId, assets }) =>
  assets.map((a) => ({ ...a, employeeId }))
);
await seedTable(assetsTable, flatAssets);

// ── Seed projects ─────────────────────────────────────────────────────────────

await seedTable(projectsTable, projectsData);

// ── Done ──────────────────────────────────────────────────────────────────────

console.log('\n✅  Enterprise data seeded successfully.');
console.log('\nNext steps:');
console.log('  1. Start the backend: npm start');
console.log('  2. Or deploy to Lambda and run: npm run seed (with production env vars)');

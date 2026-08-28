#!/usr/bin/env node
/**
 * package.js — Build deployment package for Lambda
 *
 * Produces: infrastructure/terraform/lambda_backend.zip
 *
 * Includes:
 *   src/               — application source
 *   package.json       — ESM "type":"module" declaration
 *   node_modules/      — production dependencies only
 *
 * Usage:
 *   npm run package
 */

import { execSync, spawnSync } from 'child_process';
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const BACKEND    = path.resolve(__dirname, '..');
const INFRA_TF   = path.resolve(BACKEND, '..', 'infrastructure', 'terraform');
const DIST       = path.resolve(BACKEND, '.dist');
const OUTPUT_ZIP = path.resolve(INFRA_TF, 'lambda_backend.zip');

console.log('\n📦  Building WorkPilot AI Lambda deployment package...\n');

// ── 1. Clean / create dist ───────────────────────────────────────────────────
if (fs.existsSync(DIST)) {
  try {
    fs.rmSync(DIST, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
  } catch (err) {
    console.warn('   Warning cleaning .dist, continuing...', err.message);
  }
}
if (!fs.existsSync(path.join(DIST, 'src'))) {
  fs.mkdirSync(path.join(DIST, 'src'), { recursive: true });
}

// ── 2. Copy src/ ─────────────────────────────────────────────────────────────
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}
console.log('   Copying src/...');
copyDir(path.join(BACKEND, 'src'), path.join(DIST, 'src'));

// ── 3. Copy package.json ──────────────────────────────────────────────────────
console.log('   Copying package.json...');
fs.copyFileSync(path.join(BACKEND, 'package.json'), path.join(DIST, 'package.json'));

// ── 4. npm install --omit=dev ─────────────────────────────────────────────────
console.log('   Installing production dependencies (npm install --omit=dev)...');
execSync('npm install --omit=dev --prefer-offline --no-audit --no-fund', {
  cwd: DIST,
  stdio: 'inherit',
});

const MICROSERVICES = [
  'lambda_backend.zip',
  'agent_service.zip',
  'task_service.zip',
  'hr_service.zip',
  'it_service.zip',
  'onboarding_service.zip'
];

for (const zipName of MICROSERVICES) {
  const zipPath = path.resolve(INFRA_TF, zipName);
  if (fs.existsSync(zipPath)) {
    try {
      fs.rmSync(zipPath, { force: true, maxRetries: 5, retryDelay: 200 });
    } catch (e) {
      // Continue if busy, tar overwrite handles it
    }
  }
  console.log(`   Zipping → ${zipPath}`);
  const tarResult = spawnSync(
    'tar',
    ['-a', '-c', '-f', zipPath, '.'],
    { cwd: DIST, stdio: 'inherit', shell: false }
  );

  if (tarResult.status !== 0) {
    console.error(`\n❌  tar failed for ${zipName}. Exit code:`, tarResult.status);
    if (tarResult.error) console.error(tarResult.error.message);
    process.exit(1);
  }
}

console.log(`\n✅  All microservices packages ready in infrastructure/terraform!`);
console.log('\nNext: cd infrastructure/terraform && terraform apply\n');

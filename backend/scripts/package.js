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
console.log('   Cleaning .dist/...');
if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(path.join(DIST, 'src'), { recursive: true });

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

// ── 5. Remove old zip ─────────────────────────────────────────────────────────
if (fs.existsSync(OUTPUT_ZIP)) fs.rmSync(OUTPUT_ZIP);

// ── 6. Create zip using bsdtar (fast, built into Windows 10+) ─────────────────
console.log(`\n   Zipping → ${OUTPUT_ZIP}`);
const tarResult = spawnSync(
  'tar',
  ['-a', '-c', '-f', OUTPUT_ZIP, '.'],
  { cwd: DIST, stdio: 'inherit', shell: false }
);

if (tarResult.status !== 0) {
  console.error('\n❌  tar failed. Exit code:', tarResult.status);
  if (tarResult.error) console.error(tarResult.error.message);
  process.exit(1);
}

const size = fs.statSync(OUTPUT_ZIP);
console.log(`\n✅  Package ready: lambda_backend.zip (${(size.size / 1024 / 1024).toFixed(1)} MB)`);
console.log('\nNext: cd infrastructure/terraform && terraform apply\n');

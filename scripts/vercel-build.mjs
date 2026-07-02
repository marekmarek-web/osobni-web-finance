#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const NEXT = join(ROOT, 'next-app');

execSync('node scripts/sync-public-assets.mjs', { cwd: ROOT, stdio: 'inherit' });
execSync('pnpm install', { cwd: NEXT, stdio: 'inherit' });
execSync('pnpm build', { cwd: NEXT, stdio: 'inherit' });
execSync('pnpm test:calc', { cwd: NEXT, stdio: 'inherit' });

console.log('vercel-build: OK');

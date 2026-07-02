#!/usr/bin/env node
/**
 * Zkopíruje statické assety z kořene repa do next-app/public/
 * (kalkulační složky vynechány — obsluhuje Next.js).
 */
import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const PUBLIC_DIR = join(REPO_ROOT, 'next-app', 'public');

const SKIP_DIRS = new Set([
  '.git',
  '.next',
  'next-app',
  'node_modules',
  'docs',
  'archiv',
  'pracovni-materialy',
  'FA - Lead - s.r.o',
  'FA - s.r.o',
  'hypotecnikalkulacka',
  'zivotnikalkulacka',
  'investicnikalkulacka',
  'penzijnikalkulacka',
]);

const COPY_DIRS = [
  'financni-plan',
  'podnikatele',
  'podnikatelelp',
  'gdpr',
  'cookies',
  'fp-poradce',
  'financni-analyza',
  'reality',
  'js',
  'images',
  'calculations',
  'partials',
  'api',
];

const COPY_ROOT_FILES = [
  'index.html',
  'config.js',
  'CNAME',
  'logo_M_white.png',
  'fp-poradce-vstup.html',
];

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function copyFile(src, dest) {
  ensureDir(dirname(dest));
  cpSync(src, dest);
}

function copyDir(src, dest) {
  cpSync(src, dest, { recursive: true });
}

ensureDir(PUBLIC_DIR);

for (const file of COPY_ROOT_FILES) {
  const src = join(REPO_ROOT, file);
  if (!existsSync(src)) continue;
  copyFile(src, join(PUBLIC_DIR, file));
}

if (existsSync(join(REPO_ROOT, 'logo_M_white.png'))) {
  copyFile(join(REPO_ROOT, 'logo_M_white.png'), join(PUBLIC_DIR, 'images', 'logo_M_white.png'));
}

for (const dir of COPY_DIRS) {
  const src = join(REPO_ROOT, dir);
  if (!existsSync(src)) continue;
  copyDir(src, join(PUBLIC_DIR, dir));
}

// Legacy API pro Next route handlery (kopie z kořene)
const legacyApiDir = join(REPO_ROOT, 'next-app', 'legacy-api');
ensureDir(legacyApiDir);
for (const file of readdirSync(join(REPO_ROOT, 'api'))) {
  if (!file.endsWith('.js')) continue;
  copyFile(join(REPO_ROOT, 'api', file), join(legacyApiDir, file));
}

console.log('sync-public-assets: OK →', relative(REPO_ROOT, PUBLIC_DIR));

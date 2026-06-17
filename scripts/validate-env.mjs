#!/usr/bin/env node
/**
 * Validates required env vars for production deploys.
 * Usage: node scripts/validate-env.mjs
 * Loads .env.local when present (Next.js convention).
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function loadDotEnv(filePath) {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadDotEnv(resolve(process.cwd(), '.env.local'));
loadDotEnv(resolve(process.cwd(), '.env'));

const REQUIRED = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const isProduction = process.env.NODE_ENV === 'production' || process.argv.includes('--production');

function isSet(name) {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0;
}

const missing = REQUIRED.filter((name) => !isSet(name));

if (isProduction) {
  if (!isSet('NEXT_PUBLIC_APP_URL') && !isSet('VERCEL_URL')) {
    missing.push('NEXT_PUBLIC_APP_URL');
  }
}

if (missing.length > 0) {
  console.error('Missing required environment variables:');
  for (const name of missing) {
    console.error(`  - ${name}`);
  }
  console.error('\nSee .env.example for the full list.');
  process.exit(1);
}

console.log('Environment validation passed.');

/**
 * Apply Team OS SQL via Supabase SQL API (requires service role).
 * Run: node scripts/apply-b2b-team-os-migration.mjs
 *
 * Prefers DATABASE_URL if set; otherwise prints instructions for the SQL editor.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const sqlPath = resolve(root, 'supabase/migrations/20260305120000_b2b_team_os.sql');

function loadEnvLocal() {
  const envPath = resolve(root, '.env.local');
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"'))
      || (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const sql = readFileSync(sqlPath, 'utf8');
const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

async function main() {
  if (!databaseUrl) {
    console.log(`
No DATABASE_URL / SUPABASE_DB_URL found.

To finish the B2B Team OS schema, run this SQL in the Supabase SQL Editor:

  ${sqlPath}

Or set DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
then re-run: node scripts/apply-b2b-team-os-migration.mjs
`);
    process.exit(0);
  }

  let pg;
  try {
    pg = await import('pg');
  } catch {
    console.error('Install pg first: npm i -D pg');
    process.exit(1);
  }

  const client = new pg.default.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await client.query(sql);
    console.log('Applied 20260305120000_b2b_team_os.sql successfully.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

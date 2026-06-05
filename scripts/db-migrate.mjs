/**
 * Apply lib/db/schema.sql to Postgres. Run: npm run db:migrate
 *
 * Uses DIRECT_URL (direct/session connection, port 5432) for DDL — the transaction
 * pooler isn't ideal for schema changes. Falls back to DATABASE_URL if DIRECT_URL is unset.
 */
import fs from "node:fs";
import postgres from "postgres";

// Load .env.local / .env the way Next does, so a plain `node` run sees the vars.
try {
  const mod = await import("@next/env");
  const loadEnvConfig = mod.loadEnvConfig ?? mod.default?.loadEnvConfig;
  if (loadEnvConfig) loadEnvConfig(process.cwd(), true);
} catch {
  /* @next/env unavailable — rely on process.env */
}

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("[db:migrate] Set DIRECT_URL (preferred) or DATABASE_URL first.");
  process.exit(1);
}

const ddl = fs.readFileSync(new URL("../lib/db/schema.sql", import.meta.url), "utf8");
const sql = postgres(url, { ssl: "require", prepare: false, connect_timeout: 20, max: 1 });

try {
  await sql.unsafe(ddl);
  const [{ count }] = await sql`
    select count(*)::int as count from information_schema.tables
    where table_schema = 'public' and table_name = 'wallet_signers'
  `;
  console.log(`[db:migrate] ✓ schema applied (wallet_signers present: ${count === 1})`);
} catch (e) {
  console.error("[db:migrate] ✗ failed:", e.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}

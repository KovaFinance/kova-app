/**
 * Indexer cron driver. Hits the secret-guarded poll route on an interval so vault
 * events are backfilled into Postgres. Run a Next server first, then: npm run indexer
 *
 * Env: INDEXER_SECRET (required), INDEXER_BASE_URL (default http://localhost:3000),
 *      INDEXER_INTERVAL_MS (default 30000). On a host, point a platform cron at
 *      POST /api/indexer/poll instead of running this.
 */
try {
  const mod = await import("@next/env");
  (mod.loadEnvConfig ?? mod.default?.loadEnvConfig)?.(process.cwd(), true);
} catch {
  /* rely on process.env */
}

const BASE = process.env.INDEXER_BASE_URL || "http://localhost:3000";
const SECRET = process.env.INDEXER_SECRET;
const INTERVAL = Number(process.env.INDEXER_INTERVAL_MS || 30_000);

if (!SECRET) {
  console.error("[indexer] Set INDEXER_SECRET first.");
  process.exit(1);
}

async function tick() {
  try {
    const r = await fetch(`${BASE}/api/indexer/poll`, {
      method: "POST",
      headers: { "x-indexer-secret": SECRET },
    });
    const body = await r.json().catch(() => ({}));
    console.log(new Date().toISOString(), r.status, JSON.stringify(body));
  } catch (e) {
    console.error("[indexer] poll failed:", e.message);
  }
}

console.log(`[indexer] polling ${BASE}/api/indexer/poll every ${INTERVAL}ms`);
await tick();
setInterval(tick, INTERVAL);

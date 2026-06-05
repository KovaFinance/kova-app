/**
 * Server-only Postgres client (postgres.js).
 *
 * Do NOT import this from client components — it reads DATABASE_URL (a secret) and
 * pulls in the pg driver. Only API routes / server code under lib/ should use it.
 *
 * DATABASE_URL is the Supabase **Transaction pooler** (PgBouncer transaction mode),
 * which does not support prepared statements — hence `prepare: false`.
 */
import postgres from "postgres";

type Sql = ReturnType<typeof postgres>;

// Reuse one client across HMR reloads / warm serverless invocations.
const globalForDb = globalThis as unknown as { __kovaSql?: Sql };

export function getSql(): Sql {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. The wallet store needs a Postgres connection (server-only)."
    );
  }
  if (!globalForDb.__kovaSql) {
    globalForDb.__kovaSql = postgres(url, {
      prepare: false, // transaction-pooler safe
      ssl: "require",
      max: 5,
      idle_timeout: 20,
      connect_timeout: 15,
    });
  }
  return globalForDb.__kovaSql;
}

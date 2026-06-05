/**
 * Fail-closed environment validation.
 *
 * Production posture: the app is production-only (no demo/mock mode). At server
 * boot in production (NODE_ENV=production), this MUST refuse to start if any
 * required var is missing — public (NEXT_PUBLIC_*, inlined at build) or
 * server-only (RELAYER_JWT, DATABASE_URL). During local development (`next dev`)
 * it only warns, so you can work with a partial .env.local and fill in the rest
 * before shipping.
 *
 * IMPORTANT: this module must stay free of heavy imports (no @stellar/stellar-sdk,
 * no ./stellar/config) so it is safe to load from `instrumentation.ts` in the
 * Node server runtime and is cheap to evaluate.
 */
import { z } from "zod";
import { REQUIRED_PUBLIC_ENV, REQUIRED_URL_ENV, REQUIRED_SERVER_ENV } from "./env.keys.mjs";

const nonEmpty = (label: string) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(1, `${label} must not be empty`);

const url = (label: string) => nonEmpty(label).url(`${label} must be a valid URL`);

/** Schema built from the shared key list so the two never drift. */
const shape: Record<string, z.ZodTypeAny> = {};
for (const key of REQUIRED_PUBLIC_ENV) {
  shape[key] = REQUIRED_URL_ENV.includes(key) ? url(key) : nonEmpty(key);
}
// Server-only; optional for the web build (keeper worker = Phase 6).
shape.KEEPER_SECRET = z.string().optional();

const envSchema = z.object(shape);

export type ValidatedEnv = z.infer<typeof envSchema>;

/** Required public (NEXT_PUBLIC_*) vars that are missing/empty/invalid. */
export function missingRequiredEnv(env: NodeJS.ProcessEnv = process.env): string[] {
  const result = envSchema.safeParse(env);
  if (result.success) return [];
  const required = new Set(REQUIRED_PUBLIC_ENV);
  return Array.from(
    new Set(result.error.issues.map((i) => String(i.path[0])).filter((k) => required.has(k)))
  );
}

/** Required server-only vars (RELAYER_JWT, DATABASE_URL) that are missing/empty. */
export function missingServerEnv(env: NodeJS.ProcessEnv = process.env): string[] {
  return REQUIRED_SERVER_ENV.filter((k) => !env[k]?.trim());
}

/**
 * Validate the environment. Throws in production (server boot) when required
 * public or server-only vars are missing; only warns in development.
 */
export function validateEnv(env: NodeJS.ProcessEnv = process.env): void {
  const missing = [...missingRequiredEnv(env), ...missingServerEnv(env)];
  if (missing.length === 0) return;

  const message =
    `KOVA env: missing/invalid required variables:\n  - ${missing.join("\n  - ")}\n` +
    `(NODE_ENV=${env.NODE_ENV ?? "unset"})`;

  if (env.NODE_ENV === "production") {
    throw new Error(
      `[fail-closed] ${message}\n` +
        `This is production — fill these in (.env.local or your host's env) before building/deploying.`
    );
  }

  // eslint-disable-next-line no-console
  console.warn(`[kova:env] ${message}\n(development — not fatal; fill these before production)`);
}

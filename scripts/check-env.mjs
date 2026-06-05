/**
 * Fail-closed build gate. Runs ONLY as part of `npm run build` (see package.json),
 * never during `next dev` or `next lint`. Building Kova is always a production
 * action (there is no demo build), so this enforces unconditionally: if any
 * required NEXT_PUBLIC_* var is missing/empty, abort before `next build` inlines
 * blank values.
 *
 * Single source of truth for the key list: lib/env.keys.mjs.
 */
import { REQUIRED_PUBLIC_ENV, REQUIRED_URL_ENV } from "../lib/env.keys.mjs";

// Load .env.local / .env / .env.production exactly the way `next build` does, so a
// fully-configured .env.local passes this gate even though plain Node wouldn't read it.
try {
  const mod = await import("@next/env");
  const loadEnvConfig = mod.loadEnvConfig ?? mod.default?.loadEnvConfig;
  if (loadEnvConfig) loadEnvConfig(process.cwd(), false);
} catch {
  // @next/env unavailable — fall back to process.env only (CI passes vars directly).
}

const missing = REQUIRED_PUBLIC_ENV.filter((key) => !process.env[key]?.trim());

const badUrls = REQUIRED_URL_ENV.filter((key) => {
  const v = process.env[key]?.trim();
  if (!v) return false; // already reported as missing
  try {
    new URL(v);
    return false;
  } catch {
    return true;
  }
});

if (missing.length > 0 || badUrls.length > 0) {
  const lines = [];
  if (missing.length) lines.push(`missing/empty:\n  - ${missing.join("\n  - ")}`);
  if (badUrls.length) lines.push(`not a valid URL:\n  - ${badUrls.join("\n  - ")}`);
  console.error(
    `\n[kova fail-closed] production build blocked — required env not satisfied:\n${lines.join("\n")}\n\n` +
      `Fill these in (.env.local or your host's env) before building/deploying.\n`
  );
  process.exit(1);
}

console.log("[kova] env check passed — all required NEXT_PUBLIC_* present.");

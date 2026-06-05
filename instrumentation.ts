/**
 * Next.js instrumentation hook — runs once when the server process boots.
 * We use it for a server-boot fail-closed env check so a misconfigured
 * production deploy refuses to start (in addition to the build-time check in
 * next.config.mjs). Requires `experimental.instrumentationHook: true` on Next 14.2.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("./lib/env");
    validateEnv();
  }
}

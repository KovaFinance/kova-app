/**
 * Single source of truth for the env vars a production build REQUIRES.
 *
 * Plain JS (.mjs) on purpose: this list is imported both by `next.config.mjs`
 * (an ESM/Node file that cannot import TypeScript) for the build-time check and
 * by `lib/env.ts` (which adds full zod validation). Keep it dependency-free.
 *
 * NEXT_PUBLIC_* values are inlined at BUILD time, so a missing one can only be
 * caught at build/boot — which is exactly what the fail-closed check does.
 *
 * NOTE: KEEPER_SECRET is deliberately NOT here — the keeper worker is Phase 6
 * and the web build must never block on it.
 */
export const REQUIRED_PUBLIC_ENV = [
  "NEXT_PUBLIC_VAULT_CONTRACT_ID",
  "NEXT_PUBLIC_VENUE_CONTRACT_ID",
  "NEXT_PUBLIC_USDC_SAC",
  "NEXT_PUBLIC_WALLET_WASM_HASH",
  // NEXT_PUBLIC_MERCURY_JWT is intentionally NOT required: Kova resolves the
  // passkey keyId -> smart-wallet contract mapping from its own backend (Phase 7),
  // not a third-party indexer. Mercury remains an optional/deferred alternative.
  // RELAYER_JWT / DATABASE_URL are SERVER-only (see REQUIRED_SERVER_ENV) — never
  // NEXT_PUBLIC, so they're validated at server runtime, not inlined at build.
  "NEXT_PUBLIC_RPC_URL",
  "NEXT_PUBLIC_HORIZON_URL",
  "NEXT_PUBLIC_NETWORK_PASSPHRASE",
];

/** The two vars we additionally validate as well-formed URLs. */
export const REQUIRED_URL_ENV = ["NEXT_PUBLIC_RPC_URL", "NEXT_PUBLIC_HORIZON_URL"];

/**
 * Server-only required vars (NOT inlined at build; validated at server boot by
 * lib/env.ts). RELAYER_URL + RELAYER_JWT = gasless relayer (Channels) endpoint +
 * spending credential, used by /api/relayer/submit; DATABASE_URL = Postgres for the
 * wallet-mapping store.
 */
export const REQUIRED_SERVER_ENV = ["RELAYER_URL", "RELAYER_JWT", "DATABASE_URL"];

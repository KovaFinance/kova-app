import { Networks } from "@stellar/stellar-sdk";

/**
 * Network configuration. Defaults to Stellar TESTNET.
 * Everything is read from NEXT_PUBLIC_* env vars so the same build can be
 * pointed at testnet or mainnet without code changes.
 */
export const NETWORK = (process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet") as
  | "testnet"
  | "mainnet";

export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "https://soroban-testnet.stellar.org";

export const HORIZON_URL =
  process.env.NEXT_PUBLIC_HORIZON_URL ?? "https://horizon-testnet.stellar.org";

export const NETWORK_PASSPHRASE = process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ?? Networks.TESTNET;

/** Deployed Kova vault contract id (set after `npm run deploy:testnet`). */
export const VAULT_CONTRACT_ID = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ID ?? "";

/** USDC Stellar Asset Contract address (testnet token from your anchor). */
export const USDC_SAC = process.env.NEXT_PUBLIC_USDC_SAC ?? "";

/** Yield venue the vault routes savings into (TEST-ONLY mock on testnet). Its live
 *  rate/NAV is read at runtime; see lib/stellar/rate.ts. */
export const VENUE_CONTRACT_ID = process.env.NEXT_PUBLIC_VENUE_CONTRACT_ID ?? "";

/** Static FALLBACK annual rate, shown only if the live venue rate read fails. */
export const YIELD_RATE = Number(process.env.NEXT_PUBLIC_YIELD_RATE ?? "0.045");

/** Staged-rollout / incident kill switch: when true, money-moving actions are disabled
 *  and a maintenance banner is shown. */
export const KILL_SWITCH = process.env.NEXT_PUBLIC_KILL_SWITCH === "true";

/** SEP-24 cash in/out anchor (Phase 5). Defaults to the SDF testnet reference anchor; its
 *  endpoints/signing key are discovered at runtime from its stellar.toml. Test asset only. */
export const ANCHOR_HOME_DOMAIN =
  process.env.NEXT_PUBLIC_ANCHOR_HOME_DOMAIN ?? "testanchor.stellar.org";
export const ANCHOR_ASSET_CODE = process.env.NEXT_PUBLIC_ANCHOR_ASSET_CODE ?? "SRT";

// NOTE: the gasless-submission relayer (OpenZeppelin "Channels") credentials are
// SERVER-ONLY — read from process.env in the submit API route, never exported here
// (this module is reachable from client code). See app/api/relayer/submit/route.ts.
export const MERCURY_URL = process.env.NEXT_PUBLIC_MERCURY_URL ?? "https://api.mercurydata.app";
export const MERCURY_JWT = process.env.NEXT_PUBLIC_MERCURY_JWT ?? "";
export const WALLET_WASM_HASH = process.env.NEXT_PUBLIC_WALLET_WASM_HASH ?? "";

/** USDC on Stellar uses 7 decimals. */
export const STROOPS = 10_000_000;
export const toStroops = (usd: number): bigint => BigInt(Math.round(usd * STROOPS));
export const fromStroops = (stroops: bigint | string | number): number =>
  Number(BigInt(stroops)) / STROOPS;

/** True only when a real deployed vault + token are configured. */
export const isChainConfigured = (): boolean => Boolean(VAULT_CONTRACT_ID && USDC_SAC);

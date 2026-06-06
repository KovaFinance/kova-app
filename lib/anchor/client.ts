"use client";

import { WebAuth } from "@stellar/stellar-sdk";
import { NETWORK_PASSPHRASE } from "../stellar/config";
import type { Signer } from "../types";

/**
 * SEP-24 cash in/out client (Phase 5). Orchestrates the real SEP-1 → SEP-10 → SEP-24 flow
 * against a testnet reference anchor (proxied through /api/anchor). The wallet signs the
 * SEP-10 challenge client-side; everything else is relayed by the proxy.
 *
 * NOTE: SEP-10 authenticates classic ed25519 (G…) accounts. A passkey smart wallet (C…)
 * needs SEP-45 (Draft) — not wired here — so the UI gates cash to classic/imported wallets.
 */

export interface AnchorInfo {
  homeDomain: string;
  assetCode: string;
  assetIssuer: string | null;
  webAuthEndpoint?: string;
  transferServer?: string;
  signingKey?: string;
  networkPassphrase?: string;
}

export interface InteractiveResponse {
  type: string;
  url: string;
  id: string;
}

export interface AnchorTransaction {
  id: string;
  kind: string;
  status: string;
  amount_in?: string;
  amount_out?: string;
  amount_fee?: string;
  more_info_url?: string;
  withdraw_anchor_account?: string;
  withdraw_memo?: string;
  withdraw_memo_type?: string;
}

async function call<T = any>(action: string, params: Record<string, unknown> = {}): Promise<T> {
  const r = await fetch("/api/anchor", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, ...params }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((data as any)?.error ?? `anchor ${action} failed (${r.status})`);
  return data as T;
}

export async function anchorInfo(): Promise<AnchorInfo> {
  return call<AnchorInfo>("info");
}

/**
 * SEP-10: fetch a challenge, FULLY validate it, sign it, exchange for a JWT.
 *
 * Validation is the security-critical part: a seq-0 check alone is NOT enough. We use the SDK's
 * `WebAuth.readChallengeTx`, which verifies the challenge is (a) a plain Transaction signed by the
 * anchor's SIGNING_KEY, (b) sequence 0, (c) the correct ManageData / `web_auth_domain` structure
 * for OUR account + home domain — so a malicious/MITM "challenge" can't trick the wallet into
 * signing an arbitrary (e.g. account-draining) transaction.
 */
export async function sep10Authenticate(signer: Signer): Promise<string> {
  const info = await anchorInfo();
  if (!info.signingKey || !info.webAuthEndpoint) throw new Error("anchor SEP-10 not configured");
  const passphrase = info.networkPassphrase ?? NETWORK_PASSPHRASE;
  const webAuthDomain = new URL(info.webAuthEndpoint).host;

  const { transaction } = await call<{ transaction: string }>("challenge", {
    account: signer.publicKey,
  });
  if (!transaction) throw new Error("anchor did not return a challenge");

  // Throws InvalidChallengeError on a bad server signature / sequence / structure / wrong account.
  const { clientAccountID } = WebAuth.readChallengeTx(
    transaction,
    info.signingKey,
    passphrase,
    [info.homeDomain],
    webAuthDomain
  );
  if (clientAccountID !== signer.publicKey) {
    throw new Error("SEP-10 challenge is for a different account");
  }

  const signedXdr = await signer.sign(transaction);
  const { token } = await call<{ token?: string }>("verify", { transaction: signedXdr });
  if (!token) throw new Error("anchor authentication failed");
  return token;
}

/** Only ever navigate to https/http anchor URLs (reject javascript:/data: from a bad anchor). */
export function isSafeAnchorUrl(u: string | undefined | null): u is string {
  if (!u) return false;
  try {
    const p = new URL(u).protocol;
    return p === "https:" || p === "http:";
  } catch {
    return false;
  }
}

/** Start a SEP-24 interactive deposit/withdraw; returns the popup URL + tx id. */
export async function sep24Interactive(
  jwt: string,
  kind: "deposit" | "withdraw",
  account: string,
  amount?: number
): Promise<InteractiveResponse> {
  const res = await call<InteractiveResponse>("interactive", { jwt, kind, account, amount });
  if (!isSafeAnchorUrl(res.url)) throw new Error("anchor returned an unsafe interactive URL");
  return res;
}

/** Poll one SEP-24 transaction's status. */
export async function sep24Transaction(jwt: string, id: string): Promise<AnchorTransaction> {
  const { transaction } = await call<{ transaction: AnchorTransaction }>("transaction", {
    jwt,
    id,
  });
  return transaction;
}

const TERMINAL = new Set([
  "completed",
  "refunded",
  "expired",
  "error",
  "too_small",
  "too_large",
  "no_market",
]);

export function isTerminalStatus(status: string): boolean {
  return TERMINAL.has(status);
}

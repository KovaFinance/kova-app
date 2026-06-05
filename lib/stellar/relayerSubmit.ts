"use client";

/**
 * Client helpers for the passkey smart-wallet flow. Submission is gasless and runs
 * SERVER-side (the relayer API key never reaches the browser) via /api/relayer/submit;
 * the keyId -> wallet-contract mapping is stored in our own backend via /api/wallet
 * (ADR-0001), so returning users can be resolved without a third-party indexer.
 */

/** Submit a passkey-signed transaction (XDR) gaslessly via the server relayer route. */
export async function submitViaRelayer(xdr: string): Promise<unknown> {
  const r = await fetch("/api/relayer/submit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ xdr }),
  });
  const data = await r.json().catch(() => ({}) as any);
  if (!r.ok) throw new Error((data as any)?.error ?? `relayer submit failed (${r.status})`);
  return (data as any)?.result;
}

/** Persist keyId -> smart-wallet contract id after creating a wallet. */
export async function saveWalletMapping(keyId: string, contractId: string): Promise<void> {
  await fetch("/api/wallet", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ keyId, contractId }),
  }).catch(() => {});
}

/** Resolve a returning passkey's wallet contract id (passkey-kit connect callback). */
export async function lookupContractId(keyId: string): Promise<string | undefined> {
  try {
    const r = await fetch(`/api/wallet?keyId=${encodeURIComponent(keyId)}`);
    if (!r.ok) return undefined;
    return ((await r.json()) as any)?.contractId as string | undefined;
  } catch {
    return undefined;
  }
}

"use client";

/** A detected incoming USDC payment awaiting the user's decision to route it. */
export interface PendingIncome {
  eventId: string;
  from: string;
  amount: number;
  txHash: string;
  ts: number;
}

/** Fetch still-pending incoming payments for a wallet (income watcher, Phase 4). */
export async function fetchPendingIncome(contractId: string): Promise<PendingIncome[]> {
  try {
    const r = await fetch(`/api/income/pending?contractId=${encodeURIComponent(contractId)}`);
    if (!r.ok) return [];
    return ((await r.json())?.pending as PendingIncome[]) ?? [];
  } catch {
    return [];
  }
}

/** Mark a pending income routed (with the deposit tx) or dismissed. */
export async function markPendingIncome(
  eventId: string,
  contractId: string,
  status: "routed" | "dismissed",
  routedTx?: string
): Promise<void> {
  await fetch("/api/income/pending", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ eventId, contractId, status, routedTx }),
  }).catch(() => {});
}

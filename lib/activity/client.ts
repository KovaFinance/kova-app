import type { IncomeEvent } from "@/lib/types";

/** Fetch on-chain income/vault history for a wallet from the indexer-backed API. */
export async function fetchActivity(contractId: string, limit = 50): Promise<IncomeEvent[]> {
  try {
    const r = await fetch(
      `/api/activity?contractId=${encodeURIComponent(contractId)}&limit=${limit}`
    );
    if (!r.ok) return [];
    const data = await r.json();
    return (data.events as IncomeEvent[]) ?? [];
  } catch {
    return [];
  }
}

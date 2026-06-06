"use client";

export interface Stats {
  savedThisWeek: number;
  savedThisMonth: number;
  weeks: number;
}

/** Fetch chain-derived stats (saved week/month + streak) for a wallet. */
export async function fetchStats(contractId: string): Promise<Stats | null> {
  try {
    const r = await fetch(`/api/stats?contractId=${encodeURIComponent(contractId)}`);
    if (!r.ok) return null;
    return (await r.json()) as Stats;
  } catch {
    return null;
  }
}

import { getSql } from "@/lib/db/client";

export interface Stats {
  savedThisWeek: number;
  savedThisMonth: number;
  weeks: number; // consecutive-week deposit streak
}

const WEEK_MS = 7 * 24 * 3600 * 1000;

/**
 * Honest, chain-derived stats for a wallet, computed from the indexed `split` events:
 *  - savedThisWeek / savedThisMonth = Σ saved in the trailing 7 / 30 days
 *  - weeks = the streak — consecutive ISO weeks (counting back from the most recent deposit
 *    week) that each contain at least one deposit.
 * Replaces the old localStorage counters, which reset on reload and never reflected real
 * activity.
 */
export async function getStats(contractId: string): Promise<Stats> {
  const sql = getSql();
  const sums = await sql<{ week: number; month: number }[]>`
    select
      coalesce(sum(saved) filter (where ts >= now() - interval '7 days'), 0)::float8  as week,
      coalesce(sum(saved) filter (where ts >= now() - interval '30 days'), 0)::float8 as month
    from vault_events
    where contract_id = ${contractId} and kind = 'split'
  `;
  const wkRows = await sql<{ wk: Date }[]>`
    select distinct date_trunc('week', ts) as wk
    from vault_events
    where contract_id = ${contractId} and kind = 'split'
    order by wk desc
  `;

  const wks = wkRows.map((r) => new Date(r.wk).getTime());
  let weeks = 0;
  if (wks.length) {
    weeks = 1;
    for (let i = 1; i < wks.length; i++) {
      if (Math.round((wks[i - 1] - wks[i]) / WEEK_MS) === 1) weeks++;
      else break;
    }
  }

  return {
    savedThisWeek: sums[0]?.week ?? 0,
    savedThisMonth: sums[0]?.month ?? 0,
    weeks,
  };
}

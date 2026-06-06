import { getSql } from "@/lib/db/client";

export interface Stats {
  savedThisWeek: number;
  savedThisMonth: number;
  weeks: number; // consecutive-week deposit streak
}

const WEEK_S = 7 * 24 * 3600; // one week in seconds (epoch deltas)
// Week boundaries are evaluated in this timezone (the target market), NOT UTC, so a deposit
// near midnight local time lands in the user's actual week.
const TZ = process.env.STATS_TIMEZONE ?? "America/Costa_Rica";

/**
 * Honest, chain-derived stats for a wallet, from the indexed `split` events:
 *  - savedThisWeek / savedThisMonth = Σ saved in the trailing 7 / 30 days
 *  - weeks = the streak — consecutive weeks with ≥1 deposit, anchored to NOW: the streak is
 *    only "alive" if the most recent deposit was this week or last week; a stale run counts 0.
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

  // distinct deposit-week buckets (epoch seconds), TZ-local, newest first
  const wkRows = await sql<{ wk: number }[]>`
    select distinct extract(epoch from date_trunc('week', ts at time zone ${TZ}))::float8 as wk
    from vault_events
    where contract_id = ${contractId} and kind = 'split'
    order by wk desc
  `;
  const cur = await sql<{ wk: number }[]>`
    select extract(epoch from date_trunc('week', now() at time zone ${TZ}))::float8 as wk
  `;

  const wks = wkRows.map((r) => Number(r.wk));
  const curWeek = Number(cur[0]?.wk ?? 0);
  let weeks = 0;
  if (wks.length && curWeek) {
    // streak is alive only if the latest deposit is the current week or the one before it
    if (Math.round((curWeek - wks[0]) / WEEK_S) <= 1) {
      weeks = 1;
      for (let i = 1; i < wks.length; i++) {
        if (Math.round((wks[i - 1] - wks[i]) / WEEK_S) === 1) weeks++;
        else break;
      }
    }
  }

  return {
    savedThisWeek: sums[0]?.week ?? 0,
    savedThisMonth: sums[0]?.month ?? 0,
    weeks,
  };
}

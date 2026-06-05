import { getSql } from "@/lib/db/client";
import type { VaultEventRow } from "./types";

/** Insert decoded events, deduped by event_id. Returns rows actually inserted. */
export async function upsertEvents(rows: VaultEventRow[]): Promise<number> {
  if (rows.length === 0) return 0;
  const sql = getSql();
  let inserted = 0;
  for (const r of rows) {
    const res = await sql`
      insert into vault_events
        (event_id, contract_id, kind, amount, saved, spendable, mode, tx_hash, ledger, ts)
      values
        (${r.event_id}, ${r.contract_id}, ${r.kind}, ${r.amount}, ${r.saved},
         ${r.spendable}, ${r.mode}, ${r.tx_hash}, ${r.ledger}, ${r.ts})
      on conflict (event_id) do nothing
    `;
    inserted += res.count;
  }
  return inserted;
}

/** Recent events for one wallet contract, newest first. */
export async function getEventsByContractId(
  contractId: string,
  limit = 50
): Promise<VaultEventRow[]> {
  const sql = getSql();
  const rows = await sql<VaultEventRow[]>`
    select event_id, contract_id, kind,
           amount::float8 as amount, saved::float8 as saved, spendable::float8 as spendable,
           mode, tx_hash, ledger, ts
    from vault_events
    where contract_id = ${contractId}
    order by ts desc
    limit ${limit}
  `;
  return rows;
}

export async function getCursor(): Promise<{ last_ledger: number } | null> {
  const sql = getSql();
  const rows = await sql<{ last_ledger: number }[]>`
    select last_ledger from indexer_cursor where id = 'vault'
  `;
  return rows[0] ?? null;
}

export async function setCursor(lastLedger: number): Promise<void> {
  const sql = getSql();
  await sql`
    insert into indexer_cursor (id, last_ledger, updated_at)
    values ('vault', ${lastLedger}, now())
    on conflict (id) do update set last_ledger = excluded.last_ledger, updated_at = now()
  `;
}

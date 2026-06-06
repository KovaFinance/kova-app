import { getSql } from "@/lib/db/client";

/** One detected incoming-USDC payment to a registered wallet. */
export interface PendingIncomeRow {
  event_id: string;
  contract_id: string; // recipient wallet
  from_addr: string;
  amount: number;
  tx_hash: string;
  ledger: number;
  ts: Date;
}

/** Distinct smart-wallet contract ids we know about (income-watch recipients). */
export async function getRegisteredWallets(): Promise<string[]> {
  const sql = getSql();
  const rows = await sql<{ contract_id: string }[]>`
    select distinct contract_id from wallet_signers
  `;
  return rows.map((r) => r.contract_id);
}

/** Insert detected incoming payments, deduped by event_id. Returns rows inserted. */
export async function upsertPendingIncome(rows: PendingIncomeRow[]): Promise<number> {
  if (rows.length === 0) return 0;
  const sql = getSql();
  let inserted = 0;
  for (const r of rows) {
    const res = await sql`
      insert into pending_income
        (event_id, contract_id, from_addr, amount, tx_hash, ledger, ts)
      values
        (${r.event_id}, ${r.contract_id}, ${r.from_addr}, ${r.amount}, ${r.tx_hash}, ${r.ledger}, ${r.ts})
      on conflict (event_id) do nothing
    `;
    inserted += res.count;
  }
  return inserted;
}

/** Still-pending incomes for one wallet, newest first. */
export async function getPendingIncome(contractId: string, limit = 20) {
  const sql = getSql();
  return sql<{ event_id: string; from_addr: string; amount: number; tx_hash: string; ts: Date }[]>`
    select event_id, from_addr, amount::float8 as amount, tx_hash, ts
    from pending_income
    where contract_id = ${contractId} and status = 'pending'
    order by ts desc
    limit ${limit}
  `;
}

/**
 * Mark a pending income routed (with the deposit tx) or dismissed. Scoped by BOTH event_id AND
 * the owning contract_id, and only transitions a row that is still `pending` — so a caller can't
 * blind-flip an arbitrary event_id or re-flip an already-decided row. Returns rows changed.
 * NOTE: this table is a non-authoritative UX cache (the chain is the source of truth); a forged
 * call can at most hide/duplicate a save PROMPT, never move funds. Full wallet-ownership auth on
 * the write is a Phase-7 hardening TODO.
 */
export async function markPendingIncome(
  eventId: string,
  contractId: string,
  status: "routed" | "dismissed",
  routedTx?: string
): Promise<number> {
  const sql = getSql();
  const res = await sql`
    update pending_income
       set status = ${status}, routed_tx = ${routedTx ?? null}
     where event_id = ${eventId} and contract_id = ${contractId} and status = 'pending'
  `;
  return res.count;
}

/** Cursor read/write for a named indexer stream (e.g. 'income'). */
export async function getCursorById(id: string): Promise<{ last_ledger: number } | null> {
  const sql = getSql();
  const rows = await sql<{ last_ledger: number }[]>`
    select last_ledger from indexer_cursor where id = ${id}
  `;
  return rows[0] ?? null;
}

export async function setCursorById(id: string, lastLedger: number): Promise<void> {
  const sql = getSql();
  await sql`
    insert into indexer_cursor (id, last_ledger, updated_at)
    values (${id}, ${lastLedger}, now())
    on conflict (id) do update set last_ledger = excluded.last_ledger, updated_at = now()
  `;
}

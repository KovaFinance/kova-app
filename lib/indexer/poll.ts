import { rpc } from "@stellar/stellar-sdk";
import { RPC_URL, VAULT_CONTRACT_ID } from "@/lib/stellar/config";
import { decodeEvent } from "./decode";
import type { VaultEventRow } from "./types";
import { getCursor, setCursor, upsertEvents } from "./repo";

// ~1 day of testnet ledgers (≈5s each) as a safe cold-start / retention lookback.
const LOOKBACK = 17_280;

const server = new rpc.Server(RPC_URL, { allowHttp: RPC_URL.startsWith("http://") });

/**
 * Backfill/poll the vault's Soroban contract events into Postgres. Idempotent
 * (deduped by event_id) and cursor-driven, so it's safe to run on any interval.
 * One page (up to 200 events) per call — enough for a low-volume vault.
 */
export async function pollOnce(): Promise<{
  inserted: number;
  scanned: number;
  lastLedger: number;
}> {
  const latest = await server.getLatestLedger();
  const cursor = await getCursor();
  const fromCursor = cursor?.last_ledger ? cursor.last_ledger + 1 : 0;
  const safeStart = Math.max(1, latest.sequence - LOOKBACK);
  let startLedger = fromCursor > 0 ? Math.max(fromCursor, safeStart) : safeStart;

  const req = () =>
    server.getEvents({
      startLedger,
      filters: [{ type: "contract", contractIds: [VAULT_CONTRACT_ID] }],
      limit: 200,
    });

  let resp;
  try {
    resp = await req();
  } catch {
    // RPC retention: clamp to the most recent safe window and retry once.
    startLedger = safeStart;
    resp = await req();
  }

  const events = resp.events ?? [];
  const rows = events.map(decodeEvent).filter((r): r is VaultEventRow => r !== null);
  const inserted = await upsertEvents(rows);
  const lastLedger = events.reduce((m, e: any) => Math.max(m, Number(e.ledger ?? 0)), startLedger);
  await setCursor(lastLedger);
  return { inserted, scanned: events.length, lastLedger };
}

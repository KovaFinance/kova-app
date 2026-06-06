import { rpc, scValToNative, xdr } from "@stellar/stellar-sdk";
import {
  RPC_URL,
  USDC_SAC,
  VAULT_CONTRACT_ID,
  VENUE_CONTRACT_ID,
  fromStroops,
} from "@/lib/stellar/config";
import {
  getRegisteredWallets,
  upsertPendingIncome,
  getCursorById,
  setCursorById,
  type PendingIncomeRow,
} from "./income-repo";

// ~1 day of testnet ledgers (≈5s each) as a safe cold-start / retention lookback.
const LOOKBACK = 17_280;
const CURSOR_ID = "income";

const server = new rpc.Server(RPC_URL, { allowHttp: RPC_URL.startsWith("http://") });

function toScVal(v: unknown): xdr.ScVal {
  return typeof v === "string" ? xdr.ScVal.fromXDR(v, "base64") : (v as xdr.ScVal);
}

/**
 * Decode a USDC SAC `transfer` event into an incoming-payment row, keeping only transfers
 * TO a registered wallet that did NOT originate from the vault/venue (those are internal
 * routing moves, not income). SAC transfer topics are ["transfer", from, to (, asset)];
 * data is the i128 amount. Handles 3- and 4-topic variants and is defensive about muxed
 * address types (which simply won't match our C… wallet set).
 */
function decodeTransfer(
  ev: any,
  wallets: Set<string>,
  exclude: Set<string>
): PendingIncomeRow | null {
  try {
    const topics: xdr.ScVal[] = (ev.topic ?? []).map(toScVal);
    if (topics.length < 3) return null;
    if (String(scValToNative(topics[0])) !== "transfer") return null;
    const from = String(scValToNative(topics[1]));
    const to = String(scValToNative(topics[2]));
    if (!wallets.has(to)) return null; // not one of our wallets
    if (from === to || exclude.has(from)) return null; // self / vault / venue internal move
    const amount = fromStroops(scValToNative(toScVal(ev.value)) as bigint);
    if (!(amount > 0)) return null;
    return {
      event_id: String(ev.id),
      contract_id: to,
      from_addr: from,
      amount,
      tx_hash: String(ev.txHash ?? ev.transactionHash ?? ""),
      ledger: Number(ev.ledger ?? 0),
      ts: ev.ledgerClosedAt ? new Date(ev.ledgerClosedAt) : new Date(0),
    };
  } catch {
    return null;
  }
}

/** Max pages drained per poll (200 events each) — a backstop against unbounded loops. */
const MAX_PAGES = 25;

/**
 * Poll the USDC SAC's `transfer` events into `pending_income` for any registered wallet.
 * Cursor-driven + deduped by event_id, so it's safe on any interval. NOTE: with no topic filter
 * this scans all USDC transfers in the window — fine for a low-volume testnet token; for a very
 * busy SAC, add a per-wallet topic filter.
 *
 * Pagination: a single getEvents page (`limit`) can cut off MID-LEDGER, so we must NOT advance
 * the ledger cursor by max(ledger) after one page — that would silently skip the rest of a busy
 * ledger. Instead we follow the RPC's returned paging `cursor` until a SHORT page proves the
 * window is fully drained, then advance the ledger cursor.
 */
export async function pollIncomeOnce(): Promise<{
  inserted: number;
  scanned: number;
  lastLedger: number;
  pages: number;
  skipped?: string;
}> {
  if (!USDC_SAC)
    return { inserted: 0, scanned: 0, lastLedger: 0, pages: 0, skipped: "no USDC_SAC" };
  const wallets = await getRegisteredWallets();
  if (wallets.length === 0)
    return { inserted: 0, scanned: 0, lastLedger: 0, pages: 0, skipped: "no wallets" };

  const walletSet = new Set(wallets);
  const exclude = new Set([VAULT_CONTRACT_ID, VENUE_CONTRACT_ID].filter(Boolean));
  const LIMIT = 200;

  const latest = await server.getLatestLedger();
  const cursor = await getCursorById(CURSOR_ID);
  const safeStart = Math.max(1, latest.sequence - LOOKBACK);
  let startLedger = cursor?.last_ledger ? Math.max(cursor.last_ledger + 1, safeStart) : safeStart;

  const firstPage = () =>
    server.getEvents({
      startLedger,
      filters: [{ type: "contract", contractIds: [USDC_SAC] }],
      limit: LIMIT,
    });

  const events: any[] = [];
  let resp;
  try {
    resp = await firstPage();
  } catch {
    startLedger = safeStart; // RPC retention: clamp + retry once
    resp = await firstPage();
  }

  let pages = 1;
  events.push(...(resp.events ?? []));
  // Follow the paging cursor until a short page (window fully drained) or the page cap.
  let pageCursor: string | undefined = (resp as any).cursor;
  while ((resp.events?.length ?? 0) === LIMIT && pageCursor && pages < MAX_PAGES) {
    resp = await server.getEvents({
      cursor: pageCursor,
      filters: [{ type: "contract", contractIds: [USDC_SAC] }],
      limit: LIMIT,
    } as any);
    events.push(...(resp.events ?? []));
    pageCursor = (resp as any).cursor;
    pages++;
  }

  const rows = events
    .map((ev: any) => decodeTransfer(ev, walletSet, exclude))
    .filter((r): r is PendingIncomeRow => r !== null);
  const inserted = await upsertPendingIncome(rows);

  const maxLedger = events.reduce(
    (m: number, e: any) => Math.max(m, Number(e.ledger ?? 0)),
    startLedger
  );
  // If we stopped because the page cap was hit while pages were still FULL, the highest ledger
  // may be only partially scanned — re-scan it next poll (dedup makes that a no-op) rather than
  // skip the rest of it. Otherwise (a short final page) the window is fully drained.
  const fullyDrained = (resp.events?.length ?? 0) < LIMIT || !pageCursor;
  const lastLedger = fullyDrained ? maxLedger : Math.max(startLedger - 1, maxLedger - 1);
  await setCursorById(CURSOR_ID, lastLedger);
  return { inserted, scanned: events.length, lastLedger, pages };
}

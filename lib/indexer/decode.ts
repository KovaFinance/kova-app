import { scValToNative, xdr } from "@stellar/stellar-sdk";
import { fromStroops } from "@/lib/stellar/config";
import type { VaultEventRow } from "./types";

/** RPC may hand topics/value as base64 strings or already-parsed ScVal — normalize. */
function toScVal(v: unknown): xdr.ScVal {
  return typeof v === "string" ? xdr.ScVal.fromXDR(v, "base64") : (v as xdr.ScVal);
}

/**
 * Decode one Soroban RPC event from the Kova vault into a DB row.
 * Vault events: split(amount,saved,spendable) · claim(pay) · withdraw(amount) · mode(u32),
 * each with the user Address in topic[1].
 */
export function decodeEvent(ev: any): VaultEventRow | null {
  try {
    const topics: xdr.ScVal[] = (ev.topic ?? []).map(toScVal);
    if (topics.length < 2) return null;
    const kind = String(scValToNative(topics[0])); // symbol
    const contractId = String(scValToNative(topics[1])); // Address -> "C..."
    const data = scValToNative(toScVal(ev.value));

    const row: VaultEventRow = {
      event_id: String(ev.id),
      contract_id: contractId,
      kind,
      amount: null,
      saved: null,
      spendable: null,
      mode: null,
      tx_hash: String(ev.txHash ?? ev.transactionHash ?? ""),
      ledger: Number(ev.ledger ?? 0),
      ts: ev.ledgerClosedAt ? new Date(ev.ledgerClosedAt) : new Date(0),
    };

    if (kind === "split" && Array.isArray(data)) {
      row.amount = fromStroops(data[0]);
      row.saved = fromStroops(data[1]);
      row.spendable = fromStroops(data[2]);
    } else if (kind === "claim" || kind === "withdraw") {
      row.amount = fromStroops(data as bigint);
    } else if (kind === "mode") {
      row.mode = Number(data);
    } else {
      return null; // unknown event kind
    }
    return row;
  } catch {
    return null;
  }
}

/** One decoded vault contract event, ready to upsert into `vault_events`. */
export interface VaultEventRow {
  event_id: string;
  contract_id: string; // the user Address from the event topic
  kind: string; // split | claim | withdraw | mode
  amount: number | null;
  saved: number | null;
  spendable: number | null;
  mode: number | null;
  tx_hash: string;
  ledger: number;
  ts: Date;
}

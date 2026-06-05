/**
 * Own-backend wallet registry (server-only): resolves passkey keyId <-> smart-wallet
 * contract id. This is the ADR-0001 alternative to a third-party indexer (Mercury).
 *
 * Used by the API routes in app/api/wallet. Never import from client code.
 */
import { getSql } from "@/lib/db/client";

/** Record (or update) the contract a passkey credential controls. Idempotent. */
export async function saveWalletSigner(keyId: string, contractId: string): Promise<void> {
  const sql = getSql();
  await sql`
    insert into wallet_signers (key_id, contract_id)
    values (${keyId}, ${contractId})
    on conflict (key_id) do update set contract_id = excluded.contract_id
  `;
}

/** Resolve the smart-wallet contract id for a passkey credential, or undefined. */
export async function getContractIdByKeyId(keyId: string): Promise<string | undefined> {
  const sql = getSql();
  const rows = await sql<{ contract_id: string }[]>`
    select contract_id from wallet_signers where key_id = ${keyId} limit 1
  `;
  return rows[0]?.contract_id;
}

/** All passkey credentials registered against a wallet (for recovery/device lists). */
export async function getKeyIdsByContractId(contractId: string): Promise<string[]> {
  const sql = getSql();
  const rows = await sql<{ key_id: string }[]>`
    select key_id from wallet_signers where contract_id = ${contractId} order by created_at
  `;
  return rows.map((r) => r.key_id);
}

import { getSql } from "@/lib/db/client";

/** True if `contractId` received a faucet drip within the last `withinMs` (cooldown). */
export async function recentGrant(contractId: string, withinMs: number): Promise<boolean> {
  const sql = getSql();
  const secs = Math.round(withinMs / 1000);
  const rows = await sql<{ n: number }[]>`
    select count(*)::int as n from faucet_grants
    where contract_id = ${contractId}
      and granted_at >= now() - (${secs} || ' seconds')::interval
  `;
  return (rows[0]?.n ?? 0) > 0;
}

/** Record a faucet drip (for the cooldown). */
export async function recordGrant(
  contractId: string,
  amount: number,
  txHash: string
): Promise<void> {
  const sql = getSql();
  await sql`
    insert into faucet_grants (contract_id, amount, tx_hash)
    values (${contractId}, ${amount}, ${txHash})
  `;
}

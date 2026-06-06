// SERVER-ONLY: reads KEEPER_SIGNER_SECRET. Imported only by app/api/keeper/run (runtime=nodejs).
import { Keypair, TransactionBuilder } from "@stellar/stellar-sdk";
import { invoke, simulate, addr } from "./client";
import { VAULT_CONTRACT_ID, NETWORK_PASSPHRASE, fromStroops, isChainConfigured } from "./config";
import type { Signer } from "../types";

/**
 * Income-mode keeper (Phase 6 — "live off your yield"). Triggers the on-chain
 * `claim_yield_for(user)` payout for users in INCOME mode so their earned yield is realized
 * to their wallet on a schedule, without their device.
 *
 * Non-custodial by construction: `claim_yield_for` is gated by the vault's KEEPER account
 * (this server's KEEPER_SIGNER_SECRET), and the contract ALWAYS pays the user and never
 * reduces principal — so the keeper can only move a user's own earned yield to that user.
 * The keeper is a plain funded testnet account (its own fee payer), so no relayer is needed.
 */

/** Minimum claimable USD before the keeper spends a tx (skips dust / nothing-to-claim). */
const MIN_CLAIM_USD = Number(process.env.KEEPER_MIN_CLAIM_USD ?? "0.01");

/** On-chain vault mode value for INCOME (matches the contract's MODE_INCOME). */
const MODE_INCOME = 1;

export interface KeeperRunResult {
  scanned: number;
  claimed: number;
  skipped: number;
  totalPaidUsd: number;
  results: { user: string; paidUsd: number; hash: string }[];
  errors: { user: string; error: string }[];
}

/** Build the keeper's keypair Signer from KEEPER_SIGNER_SECRET. Throws if unset/invalid. */
export function keeperSigner(): Signer {
  const secret = process.env.KEEPER_SIGNER_SECRET?.trim();
  if (!secret) throw new Error("KEEPER_SIGNER_SECRET not set");
  const kp = Keypair.fromSecret(secret);
  return {
    publicKey: kp.publicKey(),
    method: "imported",
    label: "keeper",
    sign: async (xdrBase64: string) => {
      const tx = TransactionBuilder.fromXDR(xdrBase64, NETWORK_PASSPHRASE);
      tx.sign(kp);
      return tx.toXDR();
    },
  };
}

/** The keeper's public account id (G…), so it can be designated via `set_keeper`. */
export function keeperPublicKey(): string | null {
  const secret = process.env.KEEPER_SIGNER_SECRET?.trim();
  if (!secret) return null;
  try {
    return Keypair.fromSecret(secret).publicKey();
  } catch {
    return null;
  }
}

/**
 * Run the keeper over the given user wallet contract ids (income-mode targets). For each:
 * read claimable yield (free simulation), and if it clears the dust threshold, execute
 * `claim_yield_for`. Per-user failures are collected, never abort the whole run. Naturally
 * idempotent — once a user's yield is claimed, claimable falls to ~0 and they're skipped.
 */
export async function runKeeper(users: string[]): Promise<KeeperRunResult> {
  if (!isChainConfigured()) throw new Error("Stellar vault not configured");
  const signer = keeperSigner();
  const out: KeeperRunResult = {
    scanned: users.length,
    claimed: 0,
    skipped: 0,
    totalPaidUsd: 0,
    results: [],
    errors: [],
  };

  for (const user of users) {
    try {
      // On-chain opt-in is the source of truth: only pay users who actually set INCOME mode.
      // This defends against a stale/poisoned off-chain target list (the unauthenticated
      // /api/profile write) — the vault enforces this too, but skipping here avoids doomed txs.
      let mode = 0;
      try {
        const pos = await simulate<{ mode?: number | bigint }>(VAULT_CONTRACT_ID, "position", [
          addr(user),
        ]);
        mode = Number(pos?.mode ?? 0);
      } catch {
        out.skipped++; // no position / unreadable
        continue;
      }
      if (mode !== MODE_INCOME) {
        out.skipped++; // not opted into income-mode auto-payouts on-chain
        continue;
      }

      const raw = await simulate<bigint>(VAULT_CONTRACT_ID, "claimable_yield", [addr(user)]).catch(
        () => 0n as bigint
      );
      const claimable = fromStroops(raw ?? 0n);
      if (claimable < MIN_CLAIM_USD) {
        out.skipped++;
        continue;
      }
      const hash = await invoke({
        contractId: VAULT_CONTRACT_ID,
        method: "claim_yield_for",
        args: [addr(user)],
        signer,
      });
      out.claimed++;
      out.totalPaidUsd += claimable;
      out.results.push({ user, paidUsd: Math.round(claimable * 100) / 100, hash });
    } catch (e) {
      out.errors.push({ user, error: e instanceof Error ? e.message : String(e) });
    }
  }

  out.totalPaidUsd = Math.round(out.totalPaidUsd * 100) / 100;
  return out;
}

import { scValToNative } from "@stellar/stellar-sdk";
import { simulate, invoke, sym, addr, i128, u32, server } from "./client";
import { VAULT_CONTRACT_ID, USDC_SAC, toStroops, fromStroops, isChainConfigured } from "./config";
import type { Signer, VaultMode, VaultPosition } from "../types";

/**
 * Client for the on-chain Kova vault (contracts/vault). All amounts in/out of
 * this module are in human USD; conversion to 7-decimal stroops happens here.
 *
 * Every method throws ChainNotConfigured if no contract id / token is set, so
 * the UI layer can cleanly fall back to local demo state until you deploy.
 */
export class ChainNotConfigured extends Error {
  constructor() {
    super(
      "Stellar vault not configured (set NEXT_PUBLIC_VAULT_CONTRACT_ID + NEXT_PUBLIC_USDC_SAC)."
    );
    this.name = "ChainNotConfigured";
  }
}

/** Thrown when a user has no on-chain position yet (contract Error #3). The store
 *  treats this as zeros rather than a transient failure. */
export class NoPositionError extends Error {
  constructor() {
    super("No vault position yet.");
    this.name = "NoPositionError";
  }
}

function requireChain() {
  if (!isChainConfigured()) throw new ChainNotConfigured();
}

const isNoPosition = (e: unknown) => /#3\b|NoPosition/.test(String((e as any)?.message ?? e));

const MODE_FROM_U32: Record<number, VaultMode> = { 0: "grow", 1: "income" };
const MODE_TO_U32: Record<VaultMode, number> = { grow: 0, income: 1 };

/**
 * Read a user's vault position from chain (no signing). `accruedYield` is the REAL
 * venue-earned yield (current share value − principal), read via `claimable_yield`.
 * Throws NoPositionError if the user hasn't deposited yet.
 */
export async function getPosition(user: string): Promise<VaultPosition> {
  requireChain();
  let raw: any;
  try {
    raw = await simulate<any>(VAULT_CONTRACT_ID, "position", [addr(user)]);
  } catch (e) {
    if (isNoPosition(e)) throw new NoPositionError();
    throw e;
  }
  // claimable_yield is a separate view; tolerate a stale/failed read as 0.
  let claimable: any = 0n;
  try {
    claimable = await simulate<any>(VAULT_CONTRACT_ID, "claimable_yield", [addr(user)]);
  } catch {
    claimable = 0n;
  }
  return {
    principal: fromStroops(raw.principal ?? 0n),
    savingsBps: Number(raw.savings_bps ?? 0),
    mode: MODE_FROM_U32[Number(raw.mode ?? 0)] ?? "grow",
    accruedYield: fromStroops(claimable ?? 0n),
    lockedUntil: raw.locked_until ? Number(raw.locked_until) : null,
  };
}

/** Create a position / set the savings percentage (bps, e.g. 1500 = 15%). */
export async function setRate(signer: Signer, savingsBps: number): Promise<string> {
  requireChain();
  return invoke({
    contractId: VAULT_CONTRACT_ID,
    method: "set_rate",
    args: [addr(signer.publicKey), u32(savingsBps)],
    source: signer.publicKey,
    sign: signer.sign,
  });
}

/**
 * Route an income payment through the vault. The contract pulls `amount` USDC
 * from the user, keeps the savings slice in the vault, and returns the rest as
 * spendable. (Requires a prior USDC transfer/allowance per the contract.)
 */
export async function depositAndSplit(signer: Signer, amountUsd: number): Promise<string> {
  requireChain();
  return invoke({
    contractId: VAULT_CONTRACT_ID,
    method: "deposit_and_split",
    args: [addr(signer.publicKey), i128(toStroops(amountUsd))],
    source: signer.publicKey,
    sign: signer.sign,
  });
}

/** Toggle GROW <-> INCOME. */
export async function setMode(signer: Signer, mode: VaultMode): Promise<string> {
  requireChain();
  return invoke({
    contractId: VAULT_CONTRACT_ID,
    method: "set_mode",
    args: [addr(signer.publicKey), u32(MODE_TO_U32[mode])],
    source: signer.publicKey,
    sign: signer.sign,
  });
}

/** Claim accrued yield (income mode). Principal stays intact. */
export async function claimYield(signer: Signer): Promise<string> {
  requireChain();
  return invoke({
    contractId: VAULT_CONTRACT_ID,
    method: "claim_yield",
    args: [addr(signer.publicKey)],
    source: signer.publicKey,
    sign: signer.sign,
  });
}

/** Withdraw principal (subject to any lock enforced by the contract). */
export async function withdraw(signer: Signer, amountUsd: number): Promise<string> {
  requireChain();
  return invoke({
    contractId: VAULT_CONTRACT_ID,
    method: "withdraw",
    args: [addr(signer.publicKey), i128(toStroops(amountUsd))],
    source: signer.publicKey,
    sign: signer.sign,
  });
}

export const vaultClient = {
  getPosition,
  setRate,
  depositAndSplit,
  setMode,
  claimYield,
  withdraw,
  isConfigured: isChainConfigured,
};

import { simulate, addr } from "./client";
import { USDC_SAC, fromStroops, isChainConfigured } from "./config";

/**
 * Read a wallet's REAL spendable USDC balance from the USDC Stellar Asset Contract
 * (`balance(id)`), in human USD. Works for both classic (G…) and smart-wallet (C…) accounts.
 * Returns `null` when the read FAILS (RPC blip, timeout) so the caller can keep the last-known
 * value instead of clobbering a correct balance with 0; returns 0 only when unconfigured.
 */
export async function walletUsdcBalance(account: string): Promise<number | null> {
  if (!isChainConfigured() || !USDC_SAC) return 0;
  try {
    const raw = await simulate<bigint>(USDC_SAC, "balance", [addr(account)]);
    return fromStroops(raw ?? 0n);
  } catch {
    return null; // read failed — unknown, don't overwrite a good value
  }
}

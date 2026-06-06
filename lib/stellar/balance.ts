import { simulate, addr } from "./client";
import { USDC_SAC, fromStroops, isChainConfigured } from "./config";

/**
 * Read a wallet's REAL spendable USDC balance from the USDC Stellar Asset Contract
 * (`balance(id)`), in human USD. Works for both classic (G…) and smart-wallet (C…) accounts.
 * Never throws — resolves to 0 if there's no trustline/balance or the read fails.
 */
export async function walletUsdcBalance(account: string): Promise<number> {
  if (!isChainConfigured() || !USDC_SAC) return 0;
  try {
    const raw = await simulate<bigint>(USDC_SAC, "balance", [addr(account)]);
    return fromStroops(raw ?? 0n);
  } catch {
    return 0;
  }
}

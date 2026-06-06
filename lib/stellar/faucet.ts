// SERVER-ONLY: holds the faucet account secret. Imported only by app/api/faucet (nodejs).
import { Keypair, TransactionBuilder } from "@stellar/stellar-sdk";
import { invoke, addr, i128 } from "./client";
import { USDC_SAC, NETWORK, NETWORK_PASSPHRASE, toStroops, isChainConfigured } from "./config";
import { isValidStellarAddress } from "./send";
import type { Signer } from "../types";

/** Test USDC dripped per request (cap). */
export const FAUCET_AMOUNT_USD = Number(process.env.FAUCET_AMOUNT_USD ?? "25");

/** The faucet is a TESTNET-ONLY convenience; disabled unless configured + on testnet. */
export function faucetEnabled(): boolean {
  return NETWORK === "testnet" && !!process.env.FAUCET_SECRET?.trim() && isChainConfigured();
}

function faucetSigner(): Signer {
  const kp = Keypair.fromSecret(process.env.FAUCET_SECRET!.trim());
  return {
    publicKey: kp.publicKey(),
    method: "imported",
    label: "faucet",
    sign: async (xdrBase64: string) => {
      const tx = TransactionBuilder.fromXDR(xdrBase64, NETWORK_PASSPHRASE);
      tx.sign(kp);
      return tx.toXDR();
    },
  };
}

/**
 * Send `FAUCET_AMOUNT_USD` of test USDC from the funded faucet account to `to`, via the USDC SAC
 * `transfer`. TESTNET ONLY. The faucet account is its own fee payer. Throws on misconfig/bad
 * input. (The faucet's own balance bounds total abuse; the route adds a per-wallet cooldown.)
 */
export async function dripUsdc(to: string): Promise<{ amount: number; hash: string }> {
  if (NETWORK !== "testnet") throw new Error("faucet is testnet-only");
  if (!process.env.FAUCET_SECRET?.trim()) throw new Error("faucet not configured");
  if (!isChainConfigured()) throw new Error("USDC not configured");
  if (!isValidStellarAddress(to)) throw new Error("invalid destination address");

  const signer = faucetSigner();
  const hash = await invoke({
    contractId: USDC_SAC,
    method: "transfer",
    args: [addr(signer.publicKey), addr(to.trim()), i128(toStroops(FAUCET_AMOUNT_USD))],
    signer,
  });
  return { amount: FAUCET_AMOUNT_USD, hash };
}

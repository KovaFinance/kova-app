import { StrKey } from "@stellar/stellar-sdk";
import { invoke, addr, i128 } from "./client";
import { USDC_SAC, toStroops, isChainConfigured } from "./config";
import type { Signer } from "../types";

/** True for a valid Stellar account (G…) or contract (C…) address. */
export function isValidStellarAddress(a: string): boolean {
  const s = a.trim();
  return StrKey.isValidEd25519PublicKey(s) || StrKey.isValidContract(s);
}

/**
 * Send USDC from the signed-in account to any Stellar address via the USDC Stellar
 * Asset Contract `transfer(from, to, amount)`. Same real on-chain path as the vault
 * actions (build → simulate → sign → submit); throws on bad input / unconfigured chain.
 */
export async function sendUsdc(signer: Signer, to: string, amountUsd: number): Promise<string> {
  if (!isChainConfigured())
    throw new Error("Envíos no disponibles: la red Stellar no está configurada.");
  if (!isValidStellarAddress(to)) throw new Error("Dirección Stellar inválida.");
  if (!(amountUsd > 0)) throw new Error("Monto inválido.");
  return invoke({
    contractId: USDC_SAC,
    method: "transfer",
    args: [addr(signer.publicKey), addr(to.trim()), i128(toStroops(amountUsd))],
    source: signer.publicKey,
    sign: signer.sign,
  });
}

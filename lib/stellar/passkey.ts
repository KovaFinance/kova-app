"use client";

import { Keypair, TransactionBuilder } from "@stellar/stellar-sdk";
import { WALLET_WASM_HASH, RPC_URL, NETWORK_PASSPHRASE, VAULT_CONTRACT_ID } from "./config";
import { submitViaRelayer, saveWalletMapping, lookupContractId } from "./relayerSubmit";
import type { AuthMethod, Signer } from "../types";

/**
 * Auth produces a unified `Signer`. Kova is passkey-first:
 *   1) passkey  — Face ID smart wallet via passkey-kit. `createPasskeyWallet`
 *      registers a new passkey + smart wallet; `connectPasskeyWallet` signs a
 *      returning user back in (the passkey itself is the persistent credential).
 *   2) imported — a raw secret key the user controls (advanced/recovery only).
 *
 * This is a production-only build: there is NO demo/fake-keypair fallback. If
 * passkey-kit isn't configured or a ceremony fails, we surface the real error
 * so the user is never silently signed in with a throwaway key.
 *
 * passkey-kit is dynamically imported (client entry only — no server/relayer code).
 */

// The client only needs the (public) wallet wasm hash to run the WebAuthn ceremony and
// build the deploy tx; gasless submission + the relayer secret are handled server-side
// (app/api/relayer/submit). So configuration is gated on the public wasm hash here.
const passkeyConfigured = Boolean(WALLET_WASM_HASH);

const PASSKEY_NOT_CONFIGURED = "Passkey wallet not configured (set NEXT_PUBLIC_WALLET_WASM_HASH).";

// ----------------------------------------------------------------- passkey
async function newPasskeyKit() {
  // @ts-ignore optional dependency; import the client entry only (no server/relayer code)
  const { PasskeyKit } = await import("passkey-kit/src/kit");
  return new PasskeyKit({
    rpcUrl: RPC_URL,
    networkPassphrase: NETWORK_PASSPHRASE,
    walletWasmHash: WALLET_WASM_HASH,
    timeoutInSeconds: 30,
  } as any);
}

/**
 * A passkey smart-wallet Signer. `sign` runs the WebAuthn ceremony over the tx's
 * Soroban auth; `submit` sends the result gaslessly via the server relayer route
 * (the relayer is the tx source / fee payer — that's why passkey wallet ops do NOT
 * use the keypair RPC path). The on-chain transaction layer for these is validated
 * on the deployed HTTPS domain (WebAuthn needs a stable origin).
 */
function makePasskeySigner(pk: any, keyId: string, contractId: string): Signer {
  return {
    publicKey: contractId,
    method: "passkey",
    label: "Face ID",
    sign: async (xdrBase64: string) => {
      const at = await pk.sign(xdrBase64, { keyId } as any);
      if (typeof at === "string") return at;
      return (at as any).toXDR?.() ?? (at as any).built?.toXDR?.() ?? String(at);
    },
    submit: submitViaRelayer,
  };
}

export async function createPasskeyWallet(displayName = "Kova"): Promise<Signer> {
  if (!passkeyConfigured) throw new Error(PASSKEY_NOT_CONFIGURED);
  const pk = await newPasskeyKit();
  // WebAuthn create -> a signed deploy tx that the relayer submits gaslessly.
  const { keyIdBase64, contractId, signedTx } = await pk.createWallet("kova", displayName);
  await submitViaRelayer(typeof signedTx === "string" ? signedTx : (signedTx as any).toXDR());
  await saveWalletMapping(keyIdBase64, contractId); // own-backend mapping (ADR-0001)
  return makePasskeySigner(pk, keyIdBase64, contractId);
}

export async function connectPasskeyWallet(): Promise<Signer> {
  if (!passkeyConfigured) throw new Error(PASSKEY_NOT_CONFIGURED);
  const pk = await newPasskeyKit();
  // resolve the returning passkey -> wallet contract via our backend, not Mercury
  const { keyIdBase64, contractId } = await pk.connectWallet({ getContractId: lookupContractId });
  return makePasskeySigner(pk, keyIdBase64, contractId);
}

// Extract the signed XDR from a passkey-kit AssembledTransaction after signing.
function signedXdr(at: any): string {
  return at?.signed?.toXDR?.() ?? at?.built?.toXDR?.() ?? at?.toXDR?.() ?? String(at);
}

/**
 * Recovery / multi-device (Phase 3+): add a SECOND passkey to the smart wallet, so a lost
 * device isn't a lost wallet. Re-auths the current passkey, registers a new credential, adds
 * it as a full-access signer (signed by the current passkey), submits gaslessly, and saves the
 * new keyId→contract mapping. The WebAuthn ceremonies validate on the deployed HTTPS origin.
 */
export async function addRecoveryPasskey(): Promise<{ keyId: string; contractId: string }> {
  if (!passkeyConfigured) throw new Error(PASSKEY_NOT_CONFIGURED);
  const { SignerStore } = (await import("passkey-kit/src/types")) as any;
  const pk = await newPasskeyKit();
  // re-connect the current passkey so pk.wallet is set + we have a keyId to authorize with
  const { keyIdBase64: currentKeyId, contractId } = await pk.connectWallet({
    getContractId: lookupContractId,
  });
  // register a NEW passkey credential (the recovery device)
  const { keyIdBase64: newKeyId, publicKey: newPk } = await pk.createKey("kova", "Kova recovery");
  // add it as a full-access signer (limits undefined = full), authorized by the current passkey
  const at = await pk.addSecp256r1(newKeyId, newPk, undefined, SignerStore.Persistent);
  await pk.sign(at, { keyId: currentKeyId });
  await submitViaRelayer(signedXdr(at));
  await saveWalletMapping(newKeyId, contractId); // both passkeys resolve to the same wallet
  return { keyId: newKeyId, contractId };
}

/**
 * Autonomous auto-save opt-in (Phase 4/6): delegate a KEEPER signer (the server's ed25519 key)
 * onto the smart wallet, SCOPED to the vault contract, so the income keeper can route detected
 * income with no per-payment tap. Scoping to the vault means the keeper can only authorize vault
 * calls — and the vault only ever moves the user's own funds — so it cannot take custody. The
 * user authorizes this once with their passkey; the ceremony validates on the HTTPS deploy.
 */
export async function enableAutoSplit(
  keeperEd25519PublicKey: string
): Promise<{ contractId: string }> {
  if (!passkeyConfigured) throw new Error(PASSKEY_NOT_CONFIGURED);
  if (!VAULT_CONTRACT_ID) throw new Error("vault not configured");
  const { SignerStore } = (await import("passkey-kit/src/types")) as any;
  const pk = await newPasskeyKit();
  const { keyIdBase64: currentKeyId, contractId } = await pk.connectWallet({
    getContractId: lookupContractId,
  });
  // limits = { vault: undefined } → the keeper signer may only authorize calls to the vault.
  const limits = new Map<string, undefined>([[VAULT_CONTRACT_ID, undefined]]);
  const at = await pk.addEd25519(keeperEd25519PublicKey, limits, SignerStore.Persistent);
  await pk.sign(at, { keyId: currentKeyId });
  await submitViaRelayer(signedXdr(at));
  return { contractId };
}

// ----------------------------------------------------------------- imported key (advanced)
export function importSecretKey(secret: string): Signer {
  const kp = Keypair.fromSecret(secret.trim());
  return makeKeypairSigner(kp, "imported", "Imported key");
}

function makeKeypairSigner(kp: Keypair, method: AuthMethod, label: string): Signer {
  return {
    publicKey: kp.publicKey(),
    method,
    label,
    sign: async (xdrBase64: string) => {
      const tx = TransactionBuilder.fromXDR(xdrBase64, NETWORK_PASSPHRASE);
      tx.sign(kp);
      return tx.toXDR();
    },
  };
}

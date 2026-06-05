"use client";

import { Keypair, TransactionBuilder } from "@stellar/stellar-sdk";
import { WALLET_WASM_HASH, RPC_URL, NETWORK_PASSPHRASE } from "./config";
import { submitViaRelayer, saveWalletMapping, lookupContractId } from "./relayerSubmit";
import type { AuthMethod, Signer } from "../types";

/**
 * Auth produces a unified `Signer` regardless of method:
 *   1) passkey  — Face ID smart wallet via passkey-kit (requires env config)
 *   2) wallet   — connect an existing Stellar wallet via stellar-wallets-kit
 *   3) imported — a raw secret key the user controls (advanced)
 *
 * This is a production-only build: there is NO demo/fake-keypair fallback. If
 * passkey-kit isn't configured or a ceremony fails, we surface the real error
 * so the user is never silently signed in with a throwaway key.
 *
 * passkey-kit and stellar-wallets-kit are OPTIONAL deps, dynamically imported.
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

// ----------------------------------------------------------------- connect wallet
export async function connectExistingWallet(): Promise<Signer> {
  try {
    // @ts-ignore optional dependency, may not be installed
    const mod: any = await import("@creit.tech/stellar-wallets-kit");
    const { StellarWalletsKit, WalletNetwork, allowAllModules } = mod;
    const kit = new StellarWalletsKit({
      network: NETWORK_PASSPHRASE.includes("Public") ? WalletNetwork.PUBLIC : WalletNetwork.TESTNET,
      modules: allowAllModules(),
    });
    await kit.openModal({
      onWalletSelected: async (option: any) => kit.setWallet(option.id),
    });
    const { address } = await kit.getAddress();
    return {
      publicKey: address,
      method: "wallet",
      label: "Wallet",
      sign: async (xdrBase64: string) => {
        const { signedTxXdr } = await kit.signTransaction(xdrBase64, {
          networkPassphrase: NETWORK_PASSPHRASE,
        });
        return signedTxXdr;
      },
    };
  } catch (e) {
    console.warn("wallet-kit unavailable:", e);
    throw new Error(
      "No wallet connector available. Install @creit.tech/stellar-wallets-kit or use Face ID."
    );
  }
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

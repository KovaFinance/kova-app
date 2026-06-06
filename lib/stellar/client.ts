import {
  rpc,
  Horizon,
  TransactionBuilder,
  Contract,
  Account,
  Address,
  nativeToScVal,
  scValToNative,
  xdr,
  BASE_FEE,
} from "@stellar/stellar-sdk";
import { RPC_URL, HORIZON_URL, NETWORK_PASSPHRASE } from "./config";
import type { Signer } from "../types";

/**
 * Placeholder transaction source. Soroban `simulateTransaction` does not require the
 * source account to exist or be funded, so this stands in for read simulations and for
 * building the gasless smart-wallet path (where a relayer channel account becomes the
 * real source on submit). It must only be a well-formed ed25519 (G…) address.
 */
const PLACEHOLDER_SOURCE = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

export const server = new rpc.Server(RPC_URL, {
  allowHttp: RPC_URL.startsWith("http://"),
});

export const horizon = new Horizon.Server(HORIZON_URL, {
  allowHttp: HORIZON_URL.startsWith("http://"),
});

/** ScVal helpers. */
export const sym = (s: string) => nativeToScVal(s, { type: "symbol" });
export const addr = (a: string) => new Address(a).toScVal();
export const i128 = (n: bigint) => nativeToScVal(n, { type: "i128" });
export const u64 = (n: bigint) => nativeToScVal(n, { type: "u64" });
export const u32 = (n: number) => nativeToScVal(n, { type: "u32" });
export const bool = (b: boolean) => nativeToScVal(b, { type: "bool" });
export const bytes32 = (b: Uint8Array) => xdr.ScVal.scvBytes(Buffer.from(b));

/**
 * Read-only contract call: build → simulate → decode. No signing, no fees.
 * Used for balances, projections, vault state.
 */
export async function simulate<T = unknown>(
  contractId: string,
  method: string,
  args: xdr.ScVal[] = [],
  source = PLACEHOLDER_SOURCE
): Promise<T> {
  // Pure simulation needs no real/funded source — build the account locally (seq 0) so a
  // read never depends on the placeholder existing on-chain.
  const account = new Account(source, "0");
  const contract = new Contract(contractId);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(`simulate ${method} failed: ${sim.error}`);
  }
  if (!sim.result?.retval) throw new Error(`simulate ${method}: no retval`);
  return scValToNative(sim.result.retval) as T;
}

/** Best-effort extraction of a tx hash/id from the relayer's submit result. */
function resultHash(r: unknown): string {
  if (typeof r === "string") return r;
  const o = (r ?? {}) as Record<string, unknown>;
  return String(o.hash ?? o.txHash ?? o.id ?? "");
}

/**
 * State-changing contract call, dispatched on the signer:
 *
 *  - **Gasless smart wallet (passkey)** — `signer.submit` is present. The smart-wallet
 *    contract authorizes the call (its address is the `from`/auth subject inside `args`),
 *    so the transaction source only needs to exist long enough to simulate + assemble the
 *    wallet's Soroban auth entry. We build with a placeholder source, `prepareTransaction`
 *    to populate that auth entry + footprint, run WebAuthn via `signer.sign`, then hand the
 *    signed XDR to the relayer (`signer.submit`), which re-sources to a channel account and
 *    pays the fee. The contract can't pay fees itself, which is why the keypair RPC path
 *    below does not work for it.
 *  - **Keypair (imported S-key)** — the account is its own source + fee payer: build →
 *    prepare → sign → submit → poll.
 *
 * Returns the transaction hash (best-effort for the relayer path).
 */
export async function invoke(opts: {
  contractId: string;
  method: string;
  args?: xdr.ScVal[];
  signer: Signer;
}): Promise<string> {
  const { contractId, method, args = [], signer } = opts;
  const contract = new Contract(contractId);

  if (signer.submit) {
    // Gasless smart-wallet path. The placeholder source is discarded by the relayer.
    const tx = new TransactionBuilder(new Account(PLACEHOLDER_SOURCE, "0"), {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(60)
      .build();
    const prepared = await server.prepareTransaction(tx);
    const signedXdr = await signer.sign(prepared.toXDR()); // WebAuthn over the wallet's auth entry
    return resultHash(await signer.submit(signedXdr)); // relayer re-sources + pays + submits
  }

  // Keypair path — the signer's account is the source and fee payer.
  const account = await server.getAccount(signer.publicKey);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(60)
    .build();

  // assemble Soroban auth + resource footprint
  const prepared = await server.prepareTransaction(tx);
  const signedXdr = await signer.sign(prepared.toXDR());
  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const sent = await server.sendTransaction(signedTx as any);

  if (sent.status === "ERROR") {
    throw new Error(`send ${method} failed: ${JSON.stringify(sent.errorResult)}`);
  }
  // poll for completion
  let status = sent.status as string;
  const hash = sent.hash;
  for (let i = 0; i < 15 && status !== "SUCCESS"; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const res = await server.getTransaction(hash);
    status = res.status;
    if (status === "FAILED") throw new Error(`tx ${hash} failed`);
  }
  return hash;
}

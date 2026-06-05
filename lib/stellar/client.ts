import {
  rpc,
  Horizon,
  TransactionBuilder,
  Contract,
  Address,
  nativeToScVal,
  scValToNative,
  xdr,
  BASE_FEE,
} from "@stellar/stellar-sdk";
import { RPC_URL, HORIZON_URL, NETWORK_PASSPHRASE } from "./config";

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
  source = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF" // placeholder read source
): Promise<T> {
  const account = await server.getAccount(source).catch(async () => {
    // fall back to any funded account isn't needed for pure simulation reads
    return server.getAccount(source);
  });
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

/**
 * State-changing contract call. `sign` is injected per caller:
 *   - passkey smart wallet (Face ID) via passkey-kit
 *   - a connected wallet (Freighter/Albedo)
 *   - a server keeper (income payouts)
 * Returns the transaction hash.
 */
export async function invoke(opts: {
  contractId: string;
  method: string;
  args?: xdr.ScVal[];
  source: string; // public key of the caller
  sign: (xdrBase64: string) => Promise<string>; // returns signed xdr
}): Promise<string> {
  const { contractId, method, args = [], source, sign } = opts;
  const account = await server.getAccount(source);
  const contract = new Contract(contractId);

  let tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(60)
    .build();

  // assemble Soroban auth + resource footprint
  const prepared = await server.prepareTransaction(tx);
  const signedXdr = await sign(prepared.toXDR());
  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const sent = await server.sendTransaction(signedTx as any);

  if (sent.status === "ERROR") {
    throw new Error(`send ${method} failed: ${JSON.stringify(sent.errorResult)}`);
  }
  // poll for completion
  let status = sent.status as string;
  let hash = sent.hash;
  for (let i = 0; i < 15 && status !== "SUCCESS"; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const res = await server.getTransaction(hash);
    status = res.status;
    if (status === "FAILED") throw new Error(`tx ${hash} failed`);
  }
  return hash;
}

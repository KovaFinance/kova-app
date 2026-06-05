import { NextRequest, NextResponse } from "next/server";

// stellar-sdk + the OZ Channels relayer client need the Node.js runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Deterministic deploy source passkey-kit uses to create smart wallets. The seed is public/
// derivable; it only authorizes contract *creation* (the wallet's real owner is the secp256r1
// passkey signer set in the constructor), so signing the deploy auth server-side is safe.
const DEPLOY_SEED = "kalepail";

/**
 * POST /api/relayer/submit { xdr } -> submits a passkey/deploy Soroban tx gaslessly via the
 * OpenZeppelin "Channels" relayer. The relayer API key is SERVER-ONLY (RELAYER_JWT).
 *
 * Why not just forward the signed XDR (passkey-kit's PasskeyServer.send / submit-only path)?
 * The relayer assigns one of its *channel accounts* as the transaction source and re-simulates to
 * price the tx. Submit-only re-validates the client's baked-in resource fee against its own and
 * rejects the mismatch ("Transaction fee must be equal to the resource fee"). So we use the
 * func/auth path (`submitSorobanTransaction`) and let the relayer simulate + set the fee.
 *
 * Because the channel account becomes the source, the deploy's createContract auth — which
 * passkey-kit emits as a SOURCE-ACCOUNT credential (deployer == source) — would be invalid. We
 * rebuild it as an ADDRESS credential signed by the deterministic deploy key. Normal wallet ops
 * already carry secp256r1 ADDRESS-credential auth (signed client-side via WebAuthn) and pass
 * through untouched.
 */
export async function POST(req: NextRequest) {
  const relayerUrl = process.env.RELAYER_URL;
  const relayerApiKey = process.env.RELAYER_JWT;
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
  const networkPassphrase = process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE;

  if (!relayerUrl || !relayerApiKey || !rpcUrl || !networkPassphrase) {
    return NextResponse.json(
      { error: "relayer not configured (set RELAYER_URL + RELAYER_JWT + RPC/network env)" },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const xdr = (body as { xdr?: unknown })?.xdr;
  if (typeof xdr !== "string" || !xdr) {
    return NextResponse.json({ error: "signed `xdr` string required" }, { status: 400 });
  }

  try {
    const sdk: any = await import("@stellar/stellar-sdk");
    const { TransactionBuilder, authorizeInvocation, Keypair, hash, rpc } = sdk;

    const tx = TransactionBuilder.fromXDR(xdr, networkPassphrase);
    const op = (tx.operations ?? [])[0] as any;
    if (!op || op.type !== "invokeHostFunction") {
      return NextResponse.json(
        { error: "expected a single Soroban invokeHostFunction operation" },
        { status: 400 }
      );
    }
    const func = op.func.toXDR("base64");

    const entries: any[] = op.auth ?? [];
    const needsRebuild = entries.some(
      (e) => e.credentials().switch().name === "sorobanCredentialsSourceAccount"
    );

    // Only hit the RPC / derive the deploy key when there's source-account auth to rebuild.
    let validUntil = 0;
    let deployKey: any = null;
    if (needsRebuild) {
      const server = new rpc.Server(rpcUrl, { allowHttp: rpcUrl.startsWith("http://") });
      validUntil = (await server.getLatestLedger()).sequence + 120;
      deployKey = Keypair.fromRawEd25519Seed(hash(Buffer.from(DEPLOY_SEED)));
    }

    const auth: string[] = [];
    for (const e of entries) {
      if (e.credentials().switch().name === "sorobanCredentialsSourceAccount") {
        const addrEntry = await authorizeInvocation(
          deployKey,
          validUntil,
          e.rootInvocation(),
          deployKey.publicKey(),
          networkPassphrase
        );
        auth.push(addrEntry.toXDR("base64"));
      } else {
        auth.push(e.toXDR("base64"));
      }
    }

    const { ChannelsClient } = await import("@openzeppelin/relayer-plugin-channels");
    const cc = new ChannelsClient({ baseUrl: relayerUrl, apiKey: relayerApiKey });
    const result = await cc.submitSorobanTransaction({ func, auth });
    return NextResponse.json({ ok: true, result });
  } catch (e: any) {
    // Surface the relayer's structured details for debugging.
    return NextResponse.json(
      {
        error: e?.message ?? "relayer submit failed",
        details: e?.details ?? e?.context ?? e?.cause ?? null,
      },
      { status: 502 }
    );
  }
}

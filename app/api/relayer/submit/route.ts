import { NextRequest, NextResponse } from "next/server";

// PasskeyServer + the OZ Channels relayer client need the Node.js runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/relayer/submit { xdr } -> submits a passkey-signed tx gaslessly via the
 * OpenZeppelin "Channels" relayer. The relayer API key is SERVER-ONLY (RELAYER_JWT)
 * and never leaves this route. Returns the relayer's transaction response.
 */
export async function POST(req: NextRequest) {
  const relayerUrl = process.env.RELAYER_URL;
  const relayerApiKey = process.env.RELAYER_JWT;
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;

  if (!relayerUrl || !relayerApiKey) {
    return NextResponse.json(
      { error: "relayer not configured (set RELAYER_URL + RELAYER_JWT)" },
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
    // Import only the server entry so client-side passkey code isn't pulled in.
    // @ts-ignore — deep import into the (transpiled) package; types resolve from src.
    const { PasskeyServer } = await import("passkey-kit/src/server");
    const server = new PasskeyServer({ rpcUrl, relayerUrl, relayerApiKey });
    const result = await server.send(xdr);
    return NextResponse.json({ ok: true, result });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "relayer submit failed" }, { status: 502 });
  }
}

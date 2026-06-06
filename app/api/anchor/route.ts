import { NextRequest, NextResponse } from "next/server";
import { StellarToml } from "@stellar/stellar-sdk";
import { ANCHOR_HOME_DOMAIN, ANCHOR_ASSET_CODE } from "@/lib/stellar/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * SEP-24 anchor proxy (Phase 5 cash in/out). The browser only ever talks to this same-origin
 * route — it discovers the anchor's endpoints from its stellar.toml (SEP-1), relays the SEP-10
 * auth challenge/verify, and relays the SEP-24 interactive + transaction calls. Proxying keeps
 * us anchor-agnostic (no CORS surprises) and avoids putting anchor URLs in the CSP. The wallet
 * still SIGNS the SEP-10 challenge client-side; only the HTTP hops are proxied.
 *
 * POST { action: "info" | "challenge" | "verify" | "interactive" | "transaction", ... }
 */
async function resolveAnchor() {
  const toml: any = await StellarToml.Resolver.resolve(ANCHOR_HOME_DOMAIN);
  const currencies: any[] = toml.CURRENCIES ?? [];
  const currency = currencies.find((c) => c.code === ANCHOR_ASSET_CODE) ?? currencies[0];
  return {
    homeDomain: ANCHOR_HOME_DOMAIN,
    assetCode: ANCHOR_ASSET_CODE,
    assetIssuer: currency?.issuer ?? null,
    webAuthEndpoint: toml.WEB_AUTH_ENDPOINT as string | undefined,
    transferServer: toml.TRANSFER_SERVER_SEP0024 as string | undefined,
    signingKey: toml.SIGNING_KEY as string | undefined,
    networkPassphrase: toml.NETWORK_PASSPHRASE as string | undefined,
  };
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const action = body?.action;

  try {
    const a = await resolveAnchor();
    if (action === "info") return NextResponse.json(a);

    if (!a.webAuthEndpoint || !a.transferServer) {
      return NextResponse.json(
        { error: "anchor missing SEP-10/SEP-24 endpoints" },
        { status: 502 }
      );
    }

    if (action === "challenge") {
      const url = `${a.webAuthEndpoint}?account=${encodeURIComponent(String(body.account))}&home_domain=${encodeURIComponent(a.homeDomain)}`;
      const r = await fetch(url);
      return NextResponse.json(await r.json(), { status: r.status });
    }

    if (action === "verify") {
      const r = await fetch(a.webAuthEndpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transaction: body.transaction }),
      });
      return NextResponse.json(await r.json(), { status: r.status });
    }

    if (action === "interactive") {
      const kind = body.kind === "withdraw" ? "withdraw" : "deposit";
      const payload: Record<string, unknown> = { asset_code: a.assetCode, account: body.account };
      if (a.assetIssuer) payload.asset_issuer = a.assetIssuer;
      if (body.amount) payload.amount = String(body.amount);
      const r = await fetch(`${a.transferServer}/transactions/${kind}/interactive`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${body.jwt}` },
        body: JSON.stringify(payload),
      });
      return NextResponse.json(await r.json(), { status: r.status });
    }

    if (action === "transaction") {
      const r = await fetch(
        `${a.transferServer}/transaction?id=${encodeURIComponent(String(body.id))}`,
        {
          headers: { authorization: `Bearer ${body.jwt}` },
        }
      );
      return NextResponse.json(await r.json(), { status: r.status });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "anchor request failed" }, { status: 502 });
  }
}

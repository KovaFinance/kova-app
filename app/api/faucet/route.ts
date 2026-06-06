import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADDR_RE = /^[GC][A-Z2-7]{55}$/;
const COOLDOWN_MS = Number(process.env.FAUCET_COOLDOWN_MS ?? 6 * 60 * 60 * 1000); // 6h

/**
 * POST /api/faucet { address } — drip test USDC to a wallet (TESTNET ONLY, Phase: onboarding).
 * Per-wallet cooldown + per-request amount cap; the faucet's own balance bounds total spend.
 * GET /api/faucet -> { enabled, amount } so the UI can show/hide the button.
 */
export async function GET() {
  const { faucetEnabled, FAUCET_AMOUNT_USD } = await import("@/lib/stellar/faucet");
  return NextResponse.json({ enabled: faucetEnabled(), amount: FAUCET_AMOUNT_USD });
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const address = typeof body?.address === "string" ? body.address.trim() : "";
  if (!ADDR_RE.test(address)) {
    return NextResponse.json({ error: "valid Stellar address required" }, { status: 400 });
  }

  const { faucetEnabled, dripUsdc } = await import("@/lib/stellar/faucet");
  if (!faucetEnabled()) {
    return NextResponse.json({ error: "faucet not available" }, { status: 503 });
  }

  const { recentGrant, recordGrant } = await import("@/lib/faucet/repo");
  try {
    if (await recentGrant(address, COOLDOWN_MS)) {
      return NextResponse.json(
        { error: "Ya recibiste fondos hace poco. Intenta más tarde." },
        { status: 429 }
      );
    }
    const { amount, hash } = await dripUsdc(address);
    await recordGrant(address, amount, hash);
    return NextResponse.json({ ok: true, amount, hash });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "faucet failed" }, { status: 502 });
  }
}

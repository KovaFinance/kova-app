import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getIncomeModeContracts } from "@/lib/profile/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Constant-time secret comparison (avoids byte-by-byte timing leaks). */
function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * POST /api/keeper/run — income-mode keeper (Phase 6). Secret-guarded (x-keeper-secret ==
 * KEEPER_SECRET); driven by a monthly cron (.github/workflows/keeper-cron.yml).
 *
 * For each INCOME-mode user (from the profiles DB) it triggers the on-chain
 * `claim_yield_for(user)` payout via the vault's designated KEEPER account
 * (KEEPER_SIGNER_SECRET). This is non-custodial: the contract ALWAYS pays the user and never
 * touches principal, so the keeper can only realize a user's own earned yield to that user.
 * Naturally idempotent — a user with nothing new to claim is skipped.
 *
 * Setup (one-time): designate the keeper on-chain with `set_keeper`, fund its testnet
 * account, and set KEEPER_SECRET + KEEPER_SIGNER_SECRET. Without KEEPER_SIGNER_SECRET this
 * route reports targets but executes no payouts.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.KEEPER_SECRET;
  if (!secret || !secretMatches(req.headers.get("x-keeper-secret") ?? "", secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Server-side incident kill switch (runtime, NOT the client-exposed NEXT_PUBLIC one) — lets
  // ops halt autonomous payouts without a redeploy.
  if (process.env.KOVA_KILL_SWITCH === "true") {
    return NextResponse.json({
      ok: true,
      halted: true,
      claimed: 0,
      note: "KOVA_KILL_SWITCH active",
    });
  }

  try {
    const targets = await getIncomeModeContracts();

    if (!process.env.KEEPER_SIGNER_SECRET?.trim()) {
      return NextResponse.json({
        ok: true,
        incomeModeUsers: targets.length,
        claimed: 0,
        note: "KEEPER_SIGNER_SECRET not configured — no payouts executed (set it + run set_keeper)",
      });
    }

    const { runKeeper, runAutoSplit } = await import("@/lib/stellar/keeper");
    const result = await runKeeper(targets);
    const autoSplit = await runAutoSplit().catch((e) => ({
      error: e?.message ?? "auto-split failed",
    }));
    return NextResponse.json({ ok: true, ...result, autoSplit });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "keeper run failed" }, { status: 500 });
  }
}

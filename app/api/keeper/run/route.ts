import { NextRequest, NextResponse } from "next/server";
import { getIncomeModeContracts } from "@/lib/profile/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/keeper/run — income-mode keeper (Phase 6). Secret-guarded; driven by a cron
 * (.github/workflows/keeper-cron.yml). For each income-mode user it would trigger their
 * monthly `claim_yield` payout.
 *
 * NON-CUSTODIAL CONSTRAINT (why this is a scaffold): the contract requires `user.require_auth()`,
 * so a keeper can only act if the user's passkey **smart wallet pre-authorizes the keeper via a
 * policy signer** (passkey-kit `addPolicy` / a payout policy). That wiring is part of Phase 3
 * (passkey smart wallets), which needs the deployed HTTPS domain to validate. Until then this
 * lists targets and returns a plan — it does NOT move funds.
 *
 * When the policy signer exists: per user, simulate `claim_yield`, and if the claimable amount
 * exceeds a threshold, build + sign with the keeper policy signer + submit via the relayer.
 * Must be idempotent (don't double-pay) and reconcile against the venue's actual earned yield.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.KEEPER_SECRET;
  if (!secret || req.headers.get("x-keeper-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const targets = await getIncomeModeContracts();
    // TODO(Phase 3/6): for each target, claim_yield via the keeper policy signer + relayer.
    return NextResponse.json({
      ok: true,
      incomeModeUsers: targets.length,
      paid: 0,
      note: "scaffold — payouts require the smart-wallet policy signer (Phase 3, needs HTTPS deploy)",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "keeper run failed" }, { status: 500 });
  }
}

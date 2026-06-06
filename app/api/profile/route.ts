import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getProfile, upsertProfile } from "@/lib/profile/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTRACT_ID_RE = /^C[A-Z2-7]{55}$/;

/** GET /api/profile?contractId=C... -> profile (or sensible defaults if none yet). */
export async function GET(req: NextRequest) {
  const contractId = req.nextUrl.searchParams.get("contractId");
  if (!contractId || !CONTRACT_ID_RE.test(contractId)) {
    return NextResponse.json({ error: "valid contractId required" }, { status: 400 });
  }
  try {
    const p = await getProfile(contractId);
    return NextResponse.json(
      p ?? {
        contract_id: contractId,
        lang: "es",
        savings_bps: 1500,
        mode: "grow",
        kyc_status: "none",
      }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "lookup failed" }, { status: 500 });
  }
}

const PatchSchema = z.object({
  contractId: z.string().regex(CONTRACT_ID_RE),
  lang: z.enum(["es", "en"]).optional(),
  displayName: z.string().max(120).optional(),
  savingsBps: z.number().int().min(0).max(10000).optional(),
  mode: z.enum(["grow", "income"]).optional(),
});

/**
 * POST /api/profile { contractId, lang?, displayName?, savingsBps?, mode? } -> { ok }
 *
 * This is a non-authoritative PREFERENCES CACHE, not a source of truth. The chain is
 * authoritative: `savings_bps` and `mode` are enforced by the vault (`set_rate`/`set_mode`),
 * and the income keeper independently verifies on-chain INCOME mode before any payout (see
 * lib/stellar/keeper.ts + vault `claim_yield_for`). So a forged write here cannot cause an
 * unwanted payout or move funds — at worst it corrupts a cached display name/language until
 * the owner's client re-syncs.
 * HARDENING TODO (Phase 7): gate writes with wallet-ownership proof (a signed challenge) so
 * the cache can't be griefed at all.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  try {
    await upsertProfile(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "save failed" }, { status: 500 });
  }
}

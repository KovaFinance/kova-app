import { NextRequest, NextResponse } from "next/server";
import { pollOnce } from "@/lib/indexer/poll";
import { pollIncomeOnce } from "@/lib/indexer/income";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/indexer/poll — backfill (a) vault contract events and (b) incoming-USDC
 * payments (Phase 4 income watcher) into Postgres. Secret-guarded so it can't be triggered
 * publicly. Drive it from a cron (Vercel Cron / scripts/indexer.mjs). Both passes are
 * idempotent + cursor-driven; an income-watch failure never blocks the vault indexer.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.INDEXER_SECRET;
  if (!secret || req.headers.get("x-indexer-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const vault = await pollOnce();
    let income: Awaited<ReturnType<typeof pollIncomeOnce>> | { error: string };
    try {
      income = await pollIncomeOnce();
    } catch (e: any) {
      income = { error: e?.message ?? "income poll failed" };
    }
    return NextResponse.json({ ok: true, vault, income });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "poll failed" }, { status: 500 });
  }
}

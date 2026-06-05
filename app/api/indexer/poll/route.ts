import { NextRequest, NextResponse } from "next/server";
import { pollOnce } from "@/lib/indexer/poll";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/indexer/poll — backfill vault events into Postgres. Secret-guarded so it
 * can't be triggered publicly. Drive it from a cron (Vercel Cron / scripts/indexer.mjs).
 */
export async function POST(req: NextRequest) {
  const secret = process.env.INDEXER_SECRET;
  if (!secret || req.headers.get("x-indexer-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await pollOnce();
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "poll failed" }, { status: 500 });
  }
}

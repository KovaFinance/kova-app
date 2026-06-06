import { NextRequest, NextResponse } from "next/server";
import { getStats } from "@/lib/stats/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTRACT_ID_RE = /^C[A-Z2-7]{55}$/;

/** GET /api/stats?contractId=C... -> { savedThisWeek, savedThisMonth, weeks } (chain-derived). */
export async function GET(req: NextRequest) {
  const contractId = req.nextUrl.searchParams.get("contractId");
  if (!contractId || !CONTRACT_ID_RE.test(contractId)) {
    return NextResponse.json({ error: "valid contractId required" }, { status: 400 });
  }
  try {
    return NextResponse.json(await getStats(contractId));
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "stats failed" }, { status: 500 });
  }
}

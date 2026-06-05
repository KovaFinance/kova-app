import { NextRequest, NextResponse } from "next/server";
import { getEventsByContractId } from "@/lib/indexer/repo";
import type { IncomeEvent } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTRACT_ID_RE = /^C[A-Z2-7]{55}$/;

const SOURCE: Record<string, string> = {
  split: "On-chain income",
  claim: "Yield claim",
  withdraw: "Withdrawal",
};

/** GET /api/activity?contractId=C...&limit=50 -> { contractId, events: IncomeEvent[] } */
export async function GET(req: NextRequest) {
  const contractId = req.nextUrl.searchParams.get("contractId");
  if (!contractId || !CONTRACT_ID_RE.test(contractId)) {
    return NextResponse.json({ error: "valid contractId required" }, { status: 400 });
  }
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 50) || 50, 200);
  try {
    const rows = await getEventsByContractId(contractId, limit);
    const events: IncomeEvent[] = rows
      .filter((r) => r.kind !== "mode")
      .map((r) => ({
        id: r.event_id,
        source: SOURCE[r.kind] ?? r.kind,
        kind: r.kind,
        ts: new Date(r.ts).getTime(),
        amount: r.amount ?? 0,
        saved: r.saved ?? 0,
      }));
    return NextResponse.json({ contractId, events });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "lookup failed" }, { status: 500 });
  }
}

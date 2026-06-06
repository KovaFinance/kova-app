import { NextRequest, NextResponse } from "next/server";
import { getPendingIncome, markPendingIncome } from "@/lib/indexer/income-repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTRACT_ID_RE = /^C[A-Z2-7]{55}$/;

/** GET /api/income/pending?contractId=C... -> { pending: [...] } */
export async function GET(req: NextRequest) {
  const contractId = req.nextUrl.searchParams.get("contractId");
  if (!contractId || !CONTRACT_ID_RE.test(contractId)) {
    return NextResponse.json({ error: "valid contractId required" }, { status: 400 });
  }
  try {
    const rows = await getPendingIncome(contractId);
    const pending = rows.map((r) => ({
      eventId: r.event_id,
      from: r.from_addr,
      amount: r.amount,
      txHash: r.tx_hash,
      ts: new Date(r.ts).getTime(),
    }));
    return NextResponse.json({ pending });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "lookup failed" }, { status: 500 });
  }
}

/** POST /api/income/pending { eventId, status: "routed"|"dismissed", routedTx? } -> { ok } */
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const eventId = typeof body?.eventId === "string" ? body.eventId : "";
  const contractId = typeof body?.contractId === "string" ? body.contractId : "";
  const status = body?.status === "routed" || body?.status === "dismissed" ? body.status : "";
  if (!eventId || !CONTRACT_ID_RE.test(contractId) || !status) {
    return NextResponse.json(
      { error: "eventId + valid contractId + status (routed|dismissed) required" },
      { status: 400 }
    );
  }
  try {
    const changed = await markPendingIncome(
      eventId,
      contractId,
      status,
      typeof body?.routedTx === "string" ? body.routedTx : undefined
    );
    return NextResponse.json({ ok: changed > 0 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "update failed" }, { status: 500 });
  }
}

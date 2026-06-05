import { NextRequest, NextResponse } from "next/server";
import { getContractIdByKeyId, saveWalletSigner } from "@/lib/wallet/registry";

// postgres.js needs the Node.js runtime (not edge).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTRACT_ID_RE = /^C[A-Z2-7]{55}$/;

/** GET /api/wallet?keyId=... -> { keyId, contractId }  (used by connectWallet's getContractId) */
export async function GET(req: NextRequest) {
  const keyId = req.nextUrl.searchParams.get("keyId");
  if (!keyId) {
    return NextResponse.json({ error: "keyId query param required" }, { status: 400 });
  }
  try {
    const contractId = await getContractIdByKeyId(keyId);
    if (!contractId) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ keyId, contractId });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "lookup failed" }, { status: 500 });
  }
}

/** POST /api/wallet { keyId, contractId } -> { ok }  (called after createWallet) */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const { keyId, contractId } = (body ?? {}) as { keyId?: unknown; contractId?: unknown };
  if (typeof keyId !== "string" || !keyId || typeof contractId !== "string") {
    return NextResponse.json({ error: "keyId and contractId required" }, { status: 400 });
  }
  if (!CONTRACT_ID_RE.test(contractId)) {
    return NextResponse.json({ error: "contractId is not a valid C... address" }, { status: 400 });
  }
  try {
    await saveWalletSigner(keyId, contractId);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "save failed" }, { status: 500 });
  }
}

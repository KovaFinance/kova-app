import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/keeper/pubkey -> { publicKey } — the income keeper's ed25519 public key (G…), so a
 * client can delegate it onto their smart wallet (auto-save opt-in). Only the PUBLIC key is
 * exposed; the secret stays server-side. Returns null if the keeper isn't configured.
 */
export async function GET() {
  const { keeperPublicKey } = await import("@/lib/stellar/keeper");
  return NextResponse.json({ publicKey: keeperPublicKey() });
}

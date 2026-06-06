"use client";

/** Whether the testnet faucet is configured (so the UI can show the button). */
export async function faucetInfo(): Promise<{ enabled: boolean; amount: number }> {
  try {
    const r = await fetch("/api/faucet");
    if (!r.ok) return { enabled: false, amount: 0 };
    return (await r.json()) as { enabled: boolean; amount: number };
  } catch {
    return { enabled: false, amount: 0 };
  }
}

/** Request a test-USDC drip to `address`. Throws with a user-facing message on failure. */
export async function requestFaucet(address: string): Promise<{ amount: number; hash: string }> {
  const r = await fetch("/api/faucet", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ address }),
  });
  const data = await r.json().catch(() => ({}) as any);
  if (!r.ok) throw new Error((data as any)?.error ?? `faucet failed (${r.status})`);
  return data as { amount: number; hash: string };
}

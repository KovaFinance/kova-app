"use client";

import { useState } from "react";
import { Money, Chip, Sheet, FaceIdBadge } from "@/components/ui";
import { useStore } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { usd, pct } from "@/lib/format";
import { isChainConfigured } from "@/lib/stellar/config";

export default function VaultPage() {
  const lang = useStore((s) => s.lang);
  const principal = useStore((s) => s.principal);
  const liveRate = useStore((s) => s.liveRate);
  const withdraw = useStore((s) => s.withdraw);

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function doWithdraw() {
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    setErr(null);
    setConfirming(true);
    try {
      await withdraw(amt); // real on-chain withdraw when configured; throws on failure
      setOpen(false);
      setAmount("");
    } catch (e: any) {
      setErr(e?.message ?? tr(lang, "vault.withdrawFailed"));
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h1 className="display" style={{ fontSize: 30 }}>
        {tr(lang, "vault.title")}
      </h1>

      <section
        className="card"
        style={{
          padding: 22,
          background: "var(--green)",
          color: "#fff",
          boxShadow: "6px 6px 0 0 #111",
        }}
      >
        <div className="label" style={{ color: "#bfe3d4" }}>
          {tr(lang, "vault.yours")}
        </div>
        <div style={{ marginTop: 6 }}>
          <Money value={principal} size={50} color="#fff" />
        </div>
        <div className="mono" style={{ marginTop: 10, fontSize: 12, color: "#bfe3d4" }}>
          {tr(lang, "vault.yield", { rate: pct(liveRate * 10000) })}
        </div>
      </section>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Chip variant="green">{tr(lang, "common.testnet")}</Chip>
        <Chip>{isChainConfigured() ? "on-chain vault" : "demo state"}</Chip>
        <Chip variant="sun">USDC</Chip>
      </div>

      <div
        className="card"
        style={{
          padding: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div className="label">{tr(lang, "vault.lock")}</div>
          <div className="mono" style={{ fontSize: 12, color: "#777", marginTop: 4 }}>
            opcional · 0–24 meses
          </div>
        </div>
        <Chip>off</Chip>
      </div>

      <button className="btn btn-coral" onClick={() => setOpen(true)}>
        {tr(lang, "vault.withdraw")}
      </button>

      <Sheet open={open} onClose={() => !confirming && setOpen(false)}>
        {confirming ? (
          <FaceIdBadge label={tr(lang, "common.faceid")} />
        ) : (
          <>
            <h2 className="display" style={{ fontSize: 24, marginBottom: 4 }}>
              {tr(lang, "wd.title")}
            </h2>
            <p className="mono" style={{ fontSize: 12, color: "#777", marginBottom: 14 }}>
              {tr(lang, "wd.note")}
            </p>
            <div className="label" style={{ marginBottom: 6 }}>
              {tr(lang, "wd.amount")}
            </div>
            <input
              className="field"
              inputMode="decimal"
              placeholder="$0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {err && (
              <p className="mono" style={{ fontSize: 11, color: "var(--coral)", marginTop: 10 }}>
                {err}
              </p>
            )}
            <button className="btn btn-coral" style={{ marginTop: 16 }} onClick={doWithdraw}>
              {tr(lang, "wd.confirm")}
            </button>
            <button
              className="btn btn-ghost"
              style={{ marginTop: 8 }}
              onClick={() => setOpen(false)}
            >
              {tr(lang, "common.cancel")}
            </button>
          </>
        )}
      </Sheet>
    </div>
  );
}

"use client";

import { useState } from "react";
import { IncomeSimulator } from "@/components/IncomeSimulator";
import { useStore } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { usd, pct } from "@/lib/format";
import { monthlyIncome } from "@/lib/yield";
import { isChainConfigured } from "@/lib/stellar/config";

export default function IncomePage() {
  const lang = useStore((s) => s.lang);
  const mode = useStore((s) => s.mode);
  const principal = useStore((s) => s.principal);
  const liveRate = useStore((s) => s.liveRate);
  const claimable = useStore((s) => s.accruedYield); // REAL venue-earned, claimable now
  const setMode = useStore((s) => s.setMode);
  const claimYield = useStore((s) => s.claimYield);

  const monthlyEstimate = monthlyIncome(principal, liveRate); // forward-looking estimate
  const chainReady = isChainConfigured();

  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState<string | null>(null);

  async function onClaim() {
    setClaiming(true);
    setClaimMsg(lang === "es" ? "Cobrando en cadena…" : "Claiming on-chain…");
    try {
      const amt = await claimYield();
      setClaimMsg(`${tr(lang, "income.claim")}: ${usd(amt)}`);
    } catch (e: any) {
      setClaimMsg(e?.message ?? "error");
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 className="display" style={{ fontSize: 30 }}>
          {tr(lang, "income.title")}
        </h1>
        <p style={{ fontSize: 13, color: "#444", marginTop: 6 }}>{tr(lang, "income.intro")}</p>
      </div>

      <IncomeSimulator initial={Math.max(20000, Math.round(principal))} />

      <div className="card" style={{ padding: 18, background: "var(--sun)" }}>
        <div className="mono" style={{ fontSize: 12, color: "#7a5a00" }}>
          {tr(lang, "income.everyDollar")}
        </div>
      </div>

      {mode === "grow" ? (
        <button className="btn btn-green" onClick={() => setMode("income")}>
          {tr(lang, "income.switch")}
        </button>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* forward-looking monthly estimate at the live, variable rate */}
          <div className="card" style={{ padding: 18 }}>
            <div className="label">
              {tr(lang, "income.atBalance")} ({tr(lang, "common.testnet")})
            </div>
            <div className="num" style={{ fontSize: 36, color: "var(--green)", marginTop: 4 }}>
              {usd(monthlyEstimate)}{" "}
              <span className="display" style={{ fontSize: 14 }}>
                / {tr(lang, "income.perMonth")}
              </span>
            </div>
            <div className="mono" style={{ fontSize: 11, color: "#999", marginTop: 4 }}>
              {tr(lang, "income.variable", { rate: pct(liveRate * 10000) })}
            </div>
          </div>

          {/* REAL claimable yield earned so far (from the venue) */}
          <div className="card" style={{ padding: 16 }}>
            <div className="label">{tr(lang, "income.claimable")}</div>
            <div className="num" style={{ fontSize: 24, marginTop: 4 }}>
              {usd(claimable)}
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={onClaim}
            disabled={!chainReady || claiming || claimable <= 0}
          >
            {tr(lang, "income.claim")} · {usd(claimable)}
          </button>
          {!chainReady && (
            <p className="mono" style={{ fontSize: 11, color: "#999", textAlign: "center" }}>
              {tr(lang, "income.claimDisabled")}
            </p>
          )}
          {claimMsg && (
            <p
              className="mono"
              style={{ fontSize: 12, color: "var(--green)", textAlign: "center" }}
            >
              {claimMsg}
            </p>
          )}

          <button className="btn btn-ghost" onClick={() => setMode("grow")}>
            {tr(lang, "income.switchBack")}
          </button>
        </div>
      )}

      {/* variable / not guaranteed disclosure */}
      <p
        className="mono"
        style={{ fontSize: 10, color: "#999", textAlign: "center", lineHeight: 1.5 }}
      >
        {tr(lang, "yield.disclosure")}
      </p>
    </div>
  );
}

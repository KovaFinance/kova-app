"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Icon, ScreenHeader } from "@/components/kova";
import { tr } from "@/lib/i18n";

const FX = 512; // illustrative CRC per USD until the SEP-24 anchor is live

export default function CashPage() {
  const lang = useStore((s) => s.lang);
  const [dir, setDir] = useState<"in" | "out">("in");
  const [amt, setAmt] = useState("50000");
  const crc = parseFloat(amt) || 0;
  const usd = dir === "in" ? crc / FX : crc;

  return (
    <div className="screen pad" style={{ display: "flex", flexDirection: "column" }}>
      <ScreenHeader title="Cash in / out" back="/vault" />

      <div className="card s2" style={{ padding: 4, display: "flex" }}>
        {(
          [
            ["in", "Ingresar", "Colones → USD"],
            ["out", "Sacar", "USD → Colones"],
          ] as const
        ).map(([k, t, s]) => (
          <button
            key={k}
            onClick={() => setDir(k)}
            style={{
              flex: 1,
              padding: "12px 8px",
              borderRadius: "var(--radius-sm)",
              background: dir === k ? "var(--surface)" : "transparent",
              border: dir === k ? "1px solid var(--border)" : "1px solid transparent",
              color: "var(--text)",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 14 }}>{t}</div>
            <div className="faint" style={{ fontSize: 11 }}>
              {s}
            </div>
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 18, marginTop: 14, textAlign: "center" }}>
        <div className="label">{dir === "in" ? "Depositas (CRC)" : "Retiras (USD)"}</div>
        <div
          className="row"
          style={{ justifyContent: "center", alignItems: "baseline", gap: 4, marginTop: 4 }}
        >
          <input
            className="num"
            value={amt}
            onChange={(e) => setAmt(e.target.value.replace(/[^0-9.]/g, ""))}
            inputMode="decimal"
            style={{
              width: 200,
              fontSize: 40,
              background: "transparent",
              border: "none",
              color: "var(--text)",
              textAlign: "center",
              outline: "none",
            }}
          />
        </div>
        <div className="hr" style={{ margin: "14px 0" }} />
        <div className="between">
          <span className="dim" style={{ fontSize: 13 }}>
            Recibes
          </span>
          <span className="num" style={{ fontSize: 22, color: "var(--positive)" }}>
            {dir === "in" ? `$${usd.toFixed(2)}` : `₡${(crc * FX).toLocaleString("es-CR")}`}
          </span>
        </div>
        <div className="faint" style={{ fontSize: 11, marginTop: 6 }}>
          Tasa ~₡{FX}/USD · vía anchor SEP-24
        </div>
      </div>

      {/* honest coming-soon notice */}
      <div className="card s2" style={{ padding: 16, marginTop: 14 }}>
        <div className="row" style={{ gap: 10, alignItems: "flex-start" }}>
          <Icon name="info" size={18} style={{ color: "var(--accent)", flex: "none" }} />
          <p className="dim" style={{ fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            {tr(lang, "cash.comingSoon")}
          </p>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <button className="btn btn-primary" style={{ marginTop: 16 }} disabled>
        {tr(lang, "cash.comingSoonCta")}
      </button>
      <p className="faint" style={{ fontSize: 11, marginTop: 10, textAlign: "center" }}>
        Conversión colones ↔ USDC vía agente regulado (MoneyGram / Airtm)
      </p>
    </div>
  );
}

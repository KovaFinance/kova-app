"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { usd } from "@/lib/format";
import { monthsToTarget } from "@/lib/yield";

export default function GoalsPage() {
  const lang = useStore((s) => s.lang);
  const principal = useStore((s) => s.principal);
  const liveRate = useStore((s) => s.liveRate);
  const month = useStore((s) => s.savedThisMonth) || 150;
  const [target, setTarget] = useState(10000);

  const months = monthsToTarget(target, month, liveRate, principal);
  const yrs = Math.floor(months / 12);
  const mos = months % 12;
  const progress = Math.min(100, (principal / target) * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h1 className="display" style={{ fontSize: 30 }}>
        {lang === "es" ? "Tus metas" : "Your goals"}
      </h1>

      <div className="card" style={{ padding: 18 }}>
        <div className="label">{lang === "es" ? "Meta de ahorro" : "Savings goal"}</div>
        <div className="num" style={{ fontSize: 40, marginTop: 4 }}>
          {usd(target)}
        </div>
        <input
          className="neo"
          style={{ marginTop: 14 }}
          type="range"
          min={1000}
          max={100000}
          step={1000}
          value={target}
          onChange={(e) => setTarget(Number(e.target.value))}
        />

        {/* progress bar */}
        <div
          style={{
            marginTop: 18,
            height: 22,
            border: "3px solid #111",
            borderRadius: 999,
            overflow: "hidden",
            background: "#fff",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: "var(--sun)",
              borderRight: progress < 100 ? "3px solid #111" : "none",
            }}
          />
        </div>
        <div className="mono" style={{ fontSize: 11, color: "#777", marginTop: 8 }}>
          {usd(principal)} / {usd(target)} · {progress.toFixed(0)}%
        </div>
      </div>

      <div className="card" style={{ padding: 18, background: "var(--sun)" }}>
        <div className="label" style={{ color: "#7a5a00" }}>
          {lang === "es" ? "Al ritmo actual" : "At your current pace"}
        </div>
        <div className="num" style={{ fontSize: 30, marginTop: 4 }}>
          {months >= 1200 ? "—" : `${yrs}a ${mos}m`}
        </div>
        <div className="mono" style={{ fontSize: 11, color: "#7a5a00", marginTop: 4 }}>
          {lang === "es" ? `ahorrando ${usd(month)}/mes` : `saving ${usd(month)}/mo`}
        </div>
      </div>
    </div>
  );
}

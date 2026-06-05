"use client";

import { useState } from "react";
import { ProjectionChart } from "@/components/ProjectionChart";
import { useStore } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { usd, pct } from "@/lib/format";
import { projectFutureValue } from "@/lib/yield";

export default function ProjectionPage() {
  const lang = useStore((s) => s.lang);
  const principal = useStore((s) => s.principal);
  const liveRate = useStore((s) => s.liveRate);
  const month = useStore((s) => s.savedThisMonth) || 150;
  const [years, setYears] = useState(20);
  const [monthly, setMonthly] = useState(Math.round(month));

  const fv = projectFutureValue(monthly, liveRate, years, principal);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h1 className="display" style={{ fontSize: 30 }}>
        {tr(lang, "proj.title")}
      </h1>

      <div className="card" style={{ padding: 18 }}>
        <div className="mono" style={{ fontSize: 12, color: "#555" }}>
          {tr(lang, "proj.ifYouKeep", { y: String(years) })}
        </div>
        <div className="num" style={{ fontSize: 44, marginTop: 4 }}>
          {usd(fv)}
        </div>
        <div className="mono" style={{ fontSize: 11, color: "#999" }}>
          {tr(lang, "proj.estimate", { rate: pct(liveRate * 10000) })}
        </div>
        <div style={{ marginTop: 14 }}>
          <ProjectionChart
            monthly={monthly}
            rate={liveRate}
            years={years}
            startingBalance={principal}
          />
        </div>
      </div>

      {/* year toggle */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {[10, 20, 30].map((y) => (
          <button
            key={y}
            onClick={() => setYears(y)}
            className="btn"
            style={{
              background: years === y ? "var(--coral)" : "#fff",
              color: years === y ? "#fff" : "#111",
              padding: "12px 0",
            }}
          >
            {y} {tr(lang, "proj.years")}
          </button>
        ))}
      </div>

      {/* adjust monthly */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span className="label">{tr(lang, "proj.adjust")}</span>
          <span className="num" style={{ fontSize: 18 }}>
            {usd(monthly)}/mes
          </span>
        </div>
        <input
          className="neo"
          type="range"
          min={10}
          max={1000}
          step={10}
          value={monthly}
          onChange={(e) => setMonthly(Number(e.target.value))}
        />
      </div>
    </div>
  );
}

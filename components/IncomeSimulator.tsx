"use client";

import { useState } from "react";
import { NumberRoll } from "./ui";
import { monthlyIncome } from "@/lib/yield";
import { usd, pct } from "@/lib/format";
import { tr } from "@/lib/i18n";
import { useStore } from "@/lib/store";

export function IncomeSimulator({ initial = 100000 }: { initial?: number }) {
  const [bal, setBal] = useState(initial);
  const lang = useStore((s) => s.lang);
  const liveRate = useStore((s) => s.liveRate);
  const perMonth = monthlyIncome(bal, liveRate);

  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="label">{tr(lang, "income.atBalance")}</div>
      <div style={{ margin: "6px 0 2px" }}>
        <NumberRoll value={perMonth} size={52} color="var(--green)" decimals={0} />
        <span className="display" style={{ fontSize: 16, marginLeft: 8 }}>
          / {tr(lang, "income.perMonth")}
        </span>
      </div>
      <div className="mono" style={{ fontSize: 11, color: "#7a5a00" }}>
        {tr(lang, "income.variable", { rate: pct(liveRate * 10000) })}
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span className="label">balance</span>
          <span className="num" style={{ fontSize: 18 }}>
            {usd(bal)}
          </span>
        </div>
        <input
          className="neo"
          type="range"
          min={1000}
          max={250000}
          step={1000}
          value={bal}
          onChange={(e) => setBal(Number(e.target.value))}
        />
      </div>

      <div className="chip chip-green" style={{ marginTop: 16 }}>
        {tr(lang, "income.principalSafe")}
      </div>
    </div>
  );
}

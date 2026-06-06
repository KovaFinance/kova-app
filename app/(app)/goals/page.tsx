"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Icon, ScreenHeader } from "@/components/kova";
import { monthsToTarget } from "@/lib/yield";

const RETIREMENT_GOAL = 100000;

export default function GoalsPage() {
  const principal = useStore((s) => s.principal);
  const liveRate = useStore((s) => s.liveRate);
  const savedThisMonth = useStore((s) => s.savedThisMonth);

  const [target, setTarget] = useState(5000);
  const retPct = Math.min(100, (principal / RETIREMENT_GOAL) * 100);
  const tgtPct = Math.min(100, target > 0 ? (principal / target) * 100 : 0);
  const months = monthsToTarget(target, savedThisMonth, liveRate, principal);
  const reachLabel =
    principal >= target
      ? "¡Meta alcanzada!"
      : !isFinite(months)
        ? "Define un ahorro mensual"
        : months < 12
          ? `~${months} meses`
          : `~${(months / 12).toFixed(1)} años`;

  return (
    <div className="screen pad">
      <ScreenHeader title="Metas" back="/home" />
      <p className="dim" style={{ fontSize: 14, margin: "0 0 16px" }}>
        Tu ahorro, hacia lo que importa.
      </p>

      {/* real retirement goal */}
      <div className="card" style={{ padding: 16 }}>
        <div className="row" style={{ gap: 12 }}>
          <div
            className="tok"
            style={{
              background: "var(--accent)",
              color: "var(--on-accent)",
              borderColor: "transparent",
            }}
          >
            <Icon name="shield" size={19} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Retiro</div>
            <div className="faint" style={{ fontSize: 12.5 }}>
              <span className="num">
                ${principal.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </span>{" "}
              de <span className="num">${RETIREMENT_GOAL.toLocaleString()}</span>
            </div>
          </div>
          <div className="num" style={{ fontSize: 18, color: "var(--accent)" }}>
            {retPct < 1 && principal > 0 ? retPct.toFixed(2) : retPct.toFixed(0)}%
          </div>
        </div>
        <div className="bar" style={{ marginTop: 12 }}>
          <i style={{ width: Math.max(retPct, principal > 0 ? 0.8 : 0) + "%" }} />
        </div>
      </div>

      {/* custom target planner */}
      <div className="label" style={{ margin: "20px 0 8px" }}>
        Planificador de metas
      </div>
      <div className="card s2" style={{ padding: 16 }}>
        <div className="between">
          <span className="dim" style={{ fontSize: 13.5 }}>
            Meta
          </span>
          <span className="num" style={{ fontSize: 18 }}>
            ${target.toLocaleString("en-US")}
          </span>
        </div>
        <input
          type="range"
          min={1000}
          max={100000}
          step={1000}
          value={target}
          onChange={(e) => setTarget(+e.target.value)}
          style={{ width: "100%", marginTop: 12 }}
        />
        <div className="bar" style={{ marginTop: 14 }}>
          <i style={{ width: Math.max(tgtPct, principal > 0 ? 0.8 : 0) + "%" }} />
        </div>
        <div className="between" style={{ marginTop: 14 }}>
          <span className="dim" style={{ fontSize: 13.5 }}>
            Lo alcanzas en
          </span>
          <span className="num" style={{ fontSize: 16, color: "var(--accent)" }}>
            {reachLabel}
          </span>
        </div>
        <p className="faint" style={{ fontSize: 11.5, margin: "10px 0 0", lineHeight: 1.45 }}>
          Estimado con tu ahorro de este mes ($
          {savedThisMonth.toLocaleString("en-US", { maximumFractionDigits: 0 })}) a ~
          {(liveRate * 100).toFixed(1)}% anual.
        </p>
      </div>
    </div>
  );
}

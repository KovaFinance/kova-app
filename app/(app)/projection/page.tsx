"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import {
  ScreenHeader,
  ProjectionChart,
  chartSeries,
  projectionYAxis,
  fmtUSDk,
  useCountUp,
} from "@/components/kova";

export default function ProjectionPage() {
  const principal = useStore((s) => s.principal);
  const liveRate = useStore((s) => s.liveRate);
  const savedThisMonth = useStore((s) => s.savedThisMonth);

  const [years, setYears] = useState(20);
  const monthly = savedThisMonth; // the user's real monthly saving pace
  const ratePct = (liveRate * 100).toFixed(1);

  const series = chartSeries(monthly, liveRate, years, principal);
  const final = series[series.length - 1].value;
  const { ticks: yTicks, top: yMax } = projectionYAxis(final);
  const headRef = useCountUp(final, { run: true });
  const xLabels = ["Hoy", `${years / 2} años`, `${years} años`];

  useEffect(() => {
    if (headRef.current) headRef.current.textContent = "$" + final.toLocaleString("en-US");
  }, [final, headRef]);

  return (
    <div className="screen pad prj-screen">
      <ScreenHeader title="Proyección" back="/home" />

      <div className="prj-seg">
        {[10, 20, 30].map((y) => (
          <button key={y} className={years === y ? "on" : ""} onClick={() => setYears(y)}>
            {y} años
          </button>
        ))}
      </div>

      <div className="prj-hero">
        <div className="label">En {years} años tendrás</div>
        <div ref={headRef} className="num prj-hero-amt">
          ${final.toLocaleString("en-US")}
        </div>
        <p className="prj-hero-sub">Si mantienes tu hábito de ahorro</p>
      </div>

      <div className="prj-chart-wrap">
        <div className="prj-yaxis">
          {[...yTicks].reverse().map((v) => (
            <span key={v} className="prj-ytick">
              {fmtUSDk(v)}
            </span>
          ))}
        </div>
        <div className="prj-chart-main">
          <ProjectionChart
            series={series}
            animKey={`${years}_${Math.round(principal)}`}
            height={200}
            showDots={false}
            showAllDots
            yMax={yMax}
          />
          <div className="prj-xaxis">
            {xLabels.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="card s2 prj-meta">
        <div className="between">
          <span className="dim" style={{ fontSize: 13.5 }}>
            Aporte mensual promedio
          </span>
          <span className="num" style={{ fontSize: 13.5 }}>
            ${monthly.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="between" style={{ marginTop: 10 }}>
          <span className="dim" style={{ fontSize: 13.5 }}>
            Rendimiento promedio anual
          </span>
          <span className="num" style={{ fontSize: 13.5 }}>
            {ratePct}%
          </span>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useStore } from "@/lib/store";
import { ScreenHeader, streakMeta } from "@/components/kova";

export default function StreakPage() {
  const weeks = useStore((s) => s.weeks);
  const meta = streakMeta(weeks);
  const ringR = 88;
  const ringLen = 2 * Math.PI * ringR;
  const ringPct = meta.progress;

  return (
    <div className="screen pad stk-screen">
      <ScreenHeader title="Racha" back="/home" />

      <div className="stk-hero">
        <div className="stk-ring-wrap">
          <div className="stk-flame" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22c4 0 6.5-2.6 6.5-6 0-3-2-5-3.2-7.5C14 6 13.5 4 13.5 2c-2 1.5-6 5-6 10.5 0 .9.2 1.7.5 2.4C7 14 6.5 13 6.5 11.5 4.8 13.5 4 15 4 16.5 4 19.8 7.5 22 12 22Z" />
            </svg>
          </div>
          <svg
            className="stk-ring"
            width="200"
            height="200"
            viewBox="0 0 200 200"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="stk-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D4F94A" />
                <stop offset="100%" stopColor="#A9D119" />
              </linearGradient>
            </defs>
            <circle
              cx="100"
              cy="100"
              r={ringR}
              fill="none"
              stroke="var(--border)"
              strokeWidth="14"
            />
            <circle
              cx="100"
              cy="100"
              r={ringR}
              fill="none"
              stroke="url(#stk-grad)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={ringLen}
              strokeDashoffset={ringLen * (1 - ringPct)}
              transform="rotate(-90 100 100)"
            />
          </svg>
          <div className="stk-ring-center">
            <div className="num stk-num">{weeks}</div>
            <div className="stk-lbl">semanas</div>
          </div>
        </div>
        <p className="stk-msg">¡Sigue así! La consistencia construye tu futuro.</p>
      </div>

      <div className="card s2 stk-level">
        <div className="stk-level-top">
          <div className="stk-level-ico" aria-hidden="true">
            {meta.current.emoji}
          </div>
          <div>
            <div className="label" style={{ marginBottom: 4 }}>
              Nivel actual
            </div>
            <div className="stk-level-name">
              {meta.current.name} {meta.current.emoji}
            </div>
          </div>
        </div>
        <div className="bar stk-bar">
          <i style={{ width: ringPct * 100 + "%" }} />
        </div>
        {!meta.atMax && (
          <div className="stk-level-next">
            <span className="dim" style={{ fontSize: 13 }}>
              Próximo nivel:{" "}
              <b style={{ color: "var(--text)" }}>
                {meta.next.name} {meta.next.emoji}
              </b>
            </span>
            <span className="faint" style={{ fontSize: 12.5 }}>
              {meta.weeksLeft} semanas restantes
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

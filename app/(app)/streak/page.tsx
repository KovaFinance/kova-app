"use client";

import { StreakDots } from "@/components/StreakDots";
import { useStore } from "@/lib/store";
import { tr } from "@/lib/i18n";

const LEVELS = [
  { key: "semilla", label: "Semilla", min: 0, emoji: "🌱" },
  { key: "brote", label: "Brote", min: 5, emoji: "🌿" },
  { key: "arbol", label: "Árbol", min: 13, emoji: "🌳" },
  { key: "bosque", label: "Bosque", min: 27, emoji: "🌲" },
  { key: "legado", label: "Legado", min: 53, emoji: "🏞️" },
];

export default function StreakPage() {
  const lang = useStore((s) => s.lang);
  const weeks = useStore((s) => s.weeks);

  const currentIdx = LEVELS.reduce((acc, l, i) => (weeks >= l.min ? i : acc), 0);
  const current = LEVELS[currentIdx];
  const next = LEVELS[currentIdx + 1];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h1 className="display" style={{ fontSize: 30 }}>
        {tr(lang, "streak.title")}
      </h1>

      <section
        className="card"
        style={{
          padding: 22,
          background: "var(--coral)",
          color: "#fff",
          boxShadow: "6px 6px 0 0 #111",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="num" style={{ fontSize: 44 }}>
              {weeks}
            </div>
            <div className="display" style={{ fontSize: 16 }}>
              {tr(lang, "streak.weeks")}
            </div>
          </div>
          <div style={{ fontSize: 44 }}>{current.emoji}</div>
        </div>
        <div style={{ marginTop: 14 }}>
          <StreakDots weeks={weeks} />
        </div>
      </section>

      <div className="card" style={{ padding: 18, background: "var(--sun)" }}>
        <div className="mono" style={{ fontSize: 12, color: "#7a5a00" }}>
          {tr(lang, "streak.keep")}
        </div>
      </div>

      {/* ladder */}
      <div className="card" style={{ padding: 8 }}>
        {LEVELS.map((l, i) => {
          const reached = weeks >= l.min;
          const isCurrent = i === currentIdx;
          return (
            <div
              key={l.key}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 12px",
                borderBottom: i < LEVELS.length - 1 ? "2px solid #f0e6d2" : "none",
                opacity: reached ? 1 : 0.45,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 24 }}>{l.emoji}</span>
                <div>
                  <div className="display" style={{ fontSize: 16 }}>
                    {l.label}
                  </div>
                  <div className="mono" style={{ fontSize: 10, color: "#999" }}>
                    {l.min}+ {tr(lang, "streak.weeks")}
                  </div>
                </div>
              </div>
              {isCurrent && <span className="chip chip-coral">{tr(lang, "streak.level")}</span>}
              {reached && !isCurrent && <span className="chip chip-green">✓</span>}
            </div>
          );
        })}
      </div>

      {next && (
        <p className="mono" style={{ fontSize: 11, color: "#777", textAlign: "center" }}>
          {next.min - weeks} {tr(lang, "streak.weeks")} → {next.label} {next.emoji}
        </p>
      )}
    </div>
  );
}

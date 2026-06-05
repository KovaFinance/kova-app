"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui";
import { useStore } from "@/lib/store";
import { tr } from "@/lib/i18n";

const PRESETS = [500, 1000, 1500, 2000];

export default function OnboardingPage() {
  const router = useRouter();
  const lang = useStore((s) => s.lang);
  const setRate = useStore((s) => s.setRate);
  const setOnboarded = useStore((s) => s.setOnboarded);
  const [bps, setBps] = useState(1500);
  const [custom, setCustom] = useState(false);

  function finish() {
    setRate(bps);
    setOnboarded(true);
    router.replace("/home");
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        justifyContent: "center",
        background: "var(--paper)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          padding: 24,
          borderLeft: "3px solid #111",
          borderRight: "3px solid #111",
        }}
      >
        <Logo size={26} />

        <div
          style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}
        >
          <h1 className="display" style={{ fontSize: 34 }}>
            {tr(lang, "ob.title")}
          </h1>
          <p style={{ fontSize: 14, color: "#444", marginTop: 8 }}>{tr(lang, "ob.sub")}</p>

          {/* big % display */}
          <div style={{ textAlign: "center", margin: "26px 0" }}>
            <span className="num" style={{ fontSize: 96, color: "var(--coral)" }}>
              {(bps / 100).toFixed(0)}
            </span>
            <span className="display" style={{ fontSize: 40 }}>
              %
            </span>
          </div>

          {/* presets */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
            {PRESETS.map((p) => (
              <button
                key={p}
                className="btn"
                style={{
                  padding: "14px 0",
                  background: bps === p && !custom ? "var(--coral)" : "#fff",
                  color: bps === p && !custom ? "#fff" : "#111",
                }}
                onClick={() => {
                  setBps(p);
                  setCustom(false);
                }}
              >
                {p / 100}%
              </button>
            ))}
          </div>

          {/* custom slider */}
          <button
            className="btn btn-ghost"
            style={{ marginTop: 12, borderStyle: "dashed" }}
            onClick={() => setCustom((c) => !c)}
          >
            {tr(lang, "ob.custom")}
          </button>
          {custom && (
            <input
              className="neo"
              style={{ marginTop: 12 }}
              type="range"
              min={300}
              max={3000}
              step={100}
              value={bps}
              onChange={(e) => setBps(Number(e.target.value))}
            />
          )}
        </div>

        <button className="btn btn-primary" onClick={finish}>
          {tr(lang, "ob.continue")}
        </button>
      </div>
    </main>
  );
}

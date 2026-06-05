"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { usd } from "@/lib/format";
import { tr } from "@/lib/i18n";
import { useStore } from "@/lib/store";

export function AutoSplitOverlay({
  amount,
  saved,
  spendable,
  source,
  onDone,
}: {
  amount: number;
  saved: number;
  spendable: number;
  source: string;
  onDone: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const lang = useStore((s) => s.lang);

  useGSAP(
    () => {
      const tl = gsap.timeline();
      tl.from(".as-amount", { y: 24, autoAlpha: 0, duration: 0.5, ease: "back.out(1.6)" })
        .from(".as-source", { autoAlpha: 0, duration: 0.3 }, "-=0.2")
        .to(".as-amount", { scale: 0.85, y: -10, duration: 0.4, ease: "power2.inOut" }, "+=0.3")
        .from(".as-coin", { autoAlpha: 0, scale: 0.4, duration: 0.01 })
        .to(".as-coin", { y: 150, x: -70, scale: 0.7, duration: 0.7, ease: "power2.in" })
        .to(".as-vault", { scale: 1.15, duration: 0.18, ease: "power2.out" }, "-=0.1")
        .to(".as-vault", { scale: 1, duration: 0.18 })
        .from(".as-saved", { autoAlpha: 0, y: 14, duration: 0.4, ease: "back.out(2)" }, "-=0.1")
        .from(".as-spend", { autoAlpha: 0, y: 10, duration: 0.35 }, "-=0.15")
        .from(".as-cta", { autoAlpha: 0, y: 10, duration: 0.3 }, "-=0.1");
    },
    { scope: root }
  );

  return (
    <div
      ref={root}
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--sun)",
        zIndex: 90,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div className="as-source mono" style={{ fontSize: 12, color: "#7a5a00", marginBottom: 6 }}>
        {source} · {tr(lang, "split.youGot")}
      </div>
      <div className="as-amount num" style={{ fontSize: 72, color: "#111" }}>
        {usd(amount)}
      </div>

      {/* the flying coin */}
      <div
        className="as-coin"
        style={{
          position: "absolute",
          top: "46%",
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "var(--coral)",
          border: "3px solid #111",
          display: "grid",
          placeItems: "center",
          color: "#fff",
          fontWeight: 800,
        }}
      >
        $
      </div>

      {/* vault target */}
      <div
        className="as-vault card-flat"
        style={{
          marginTop: 28,
          padding: "16px 22px",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="12" cy="12" r="3.5" />
          <path d="M12 8.5v-.01" />
        </svg>
        <div className="display" style={{ fontSize: 16 }}>
          Kova
        </div>
      </div>

      <div className="as-saved" style={{ marginTop: 22, textAlign: "center" }}>
        <div className="mono" style={{ fontSize: 12, color: "#7a5a00" }}>
          {tr(lang, "split.saved")}
        </div>
        <div className="num" style={{ fontSize: 40, color: "var(--green)" }}>
          {usd(saved)}
        </div>
        <div className="mono" style={{ fontSize: 11, color: "#7a5a00" }}>
          {tr(lang, "split.auto")}
        </div>
      </div>

      <div className="as-spend mono" style={{ marginTop: 14, fontSize: 13, color: "#111" }}>
        {usd(spendable)} {tr(lang, "split.spendable")}
      </div>

      <button className="as-cta btn" style={{ marginTop: 26, maxWidth: 320 }} onClick={onDone}>
        {tr(lang, "split.done")}
      </button>
    </div>
  );
}

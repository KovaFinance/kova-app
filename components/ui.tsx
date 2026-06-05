"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { splitUsd } from "@/lib/format";

/** Kova logomark — 2×2 rounded-square grid, one accent cell lit. */
export function Logo({ size = 26, light = false }: { size?: number; light?: boolean }) {
  const ink = light ? "#FFF8EE" : "#111111";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
      <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden>
        <rect
          x="3"
          y="3"
          width="7"
          height="7"
          rx="2"
          fill="#FF5C39"
          stroke={ink}
          strokeWidth="1.5"
        />
        <rect x="12" y="3" width="7" height="7" rx="2" fill="none" stroke={ink} strokeWidth="1.5" />
        <rect x="3" y="12" width="7" height="7" rx="2" fill="none" stroke={ink} strokeWidth="1.5" />
        <rect
          x="12"
          y="12"
          width="7"
          height="7"
          rx="2"
          fill="#FFD23F"
          stroke={ink}
          strokeWidth="1.5"
        />
      </svg>
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontWeight: 800,
          fontSize: size * 0.8,
          letterSpacing: "-1px",
          color: ink,
        }}
      >
        kova
      </span>
    </span>
  );
}

/** Big money display with a small cents tail. */
export function Money({
  value,
  size = 56,
  color = "#111111",
  cents = true,
}: {
  value: number;
  size?: number;
  color?: string;
  cents?: boolean;
}) {
  const { whole, cents: c } = splitUsd(value);
  return (
    <span className="num" style={{ color, fontSize: size, lineHeight: 1 }}>
      {whole}
      {cents && <span style={{ fontSize: size * 0.5, opacity: 0.45 }}>{c}</span>}
    </span>
  );
}

/** Animated count-up number (GSAP). */
export function NumberRoll({
  value,
  size = 56,
  color = "#111111",
  prefix = "$",
  decimals = 0,
}: {
  value: number;
  size?: number;
  color?: string;
  prefix?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obj = { v: prev.current };
    const tween = gsap.to(obj, {
      v: value,
      duration: 0.9,
      ease: "power2.out",
      onUpdate: () => {
        el.textContent =
          prefix +
          obj.v.toLocaleString("en-US", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          });
      },
    });
    prev.current = value;
    return () => {
      tween.kill();
    };
  }, [value, prefix, decimals]);
  return (
    <span ref={ref} className="num" style={{ color, fontSize: size, lineHeight: 1 }}>
      {prefix}0
    </span>
  );
}

export function Chip({
  children,
  variant = "",
}: {
  children: React.ReactNode;
  variant?: "" | "sun" | "green" | "coral";
}) {
  return <span className={`chip ${variant ? "chip-" + variant : ""}`}>{children}</span>;
}

/** Bottom-sheet modal, neo-brutalist. */
export function Sheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(17,17,17,0.45)",
        zIndex: 80,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card pop"
        style={{
          width: "100%",
          maxWidth: 420,
          margin: 12,
          padding: 20,
          boxShadow: "8px 8px 0 0 #111",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** A Face-ID confirm affordance used in flows. */
export function FaceIdBadge({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        padding: "8px 0",
      }}
    >
      <div
        style={{
          width: 76,
          height: 76,
          borderRadius: 20,
          border: "3px solid #111",
          display: "grid",
          placeItems: "center",
          background: "#fff",
        }}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#111"
          strokeWidth="1.7"
          strokeLinecap="round"
        >
          <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
          <path d="M9 10h.01M15 10h.01M9.5 14.5c.8.7 4.2.7 5 0" />
        </svg>
      </div>
      <div className="mono" style={{ fontSize: 12, color: "#555" }}>
        {label}
      </div>
    </div>
  );
}

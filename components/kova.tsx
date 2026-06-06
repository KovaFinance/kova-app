"use client";

// ============================================================
// Kova — shared Volt Dark UI primitives, icons, hooks & charts
// (ported from the koba-frontend redesign)
// ============================================================
import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";

// ---- Icon set (stroke = currentColor) ----------------------
export const ICONS: Record<string, string> = {
  home: "M3 11.5 12 4l9 7.5M5 10v9h5v-6h4v6h5v-9",
  chart: "M4 19V5M4 19h16M8 15l3.5-4 3 2.5L20 7",
  bolt: "M13 3 4 14h6l-1 7 9-11h-6z",
  vault: "M4 5h16v14H4zM4 9h16M9 19v-3M15 19v-3",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20c1.2-3.4 4-5 7-5s5.8 1.6 7 5",
  arrowR: "M5 12h14M13 6l6 6-6 6",
  arrowL: "M19 12H5M11 18l-6-6 6-6",
  arrowUp: "M12 19V5M6 11l6-6 6 6",
  arrowDown: "M12 5v14M6 13l6 6 6-6",
  check: "M5 12.5 10 17l9-10",
  plus: "M12 5v14M5 12h14",
  face: "M4 9V6a2 2 0 0 1 2-2h3M15 4h3a2 2 0 0 1 2 2v3M20 15v3a2 2 0 0 1-2 2h-3M9 20H6a2 2 0 0 1-2-2v-3M9 10v1M15 10v1M9.5 15a3.5 3.5 0 0 0 5 0",
  lock: "M6 11V8a6 6 0 0 1 12 0v3M5 11h14v9H5zM12 15v2",
  shield: "M12 3 5 6v5c0 4.4 3 7.4 7 9 4-1.6 7-4.6 7-9V6z",
  globe:
    "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM3 12h18M12 3c2.5 2.5 3.8 5.6 3.8 9S14.5 18.5 12 21M12 3C9.5 5.5 8.2 8.6 8.2 12s1.3 6.5 3.8 9",
  spark: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18",
  flame:
    "M12 22c4 0 6.5-2.6 6.5-6 0-3-2-5-3.2-7.5C14 6 13.5 4 13.5 2c-2 1.5-6 5-6 10.5 0 .9.2 1.7.5 2.4C7 14 6.5 13 6.5 11.5 4.8 13.5 4 15 4 16.5 4 19.8 7.5 22 12 22Z",
  send: "M22 2 11 13M22 2l-7 20-4-9-9-4z",
  swap: "M7 4 4 7l3 3M4 7h12M17 20l3-3-3-3M20 17H8",
  laptop: "M5 6h14v9H5zM3 19h18M9 19h6",
  plane: "M10.5 13.5 3 11l18-7-7 18-2.5-7.5z",
  bell: "M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 20a2 2 0 0 0 4 0",
  key: "M14 7a4 4 0 1 1-3.8 5.2L4 18.4V21H7v-2h2v-2h2l1.2-1.2A4 4 0 0 1 14 7Z",
  gift: "M4 11h16v9H4zM4 7h16v4H4zM12 7v13M12 7C12 4 9 3 8 5s1 2 4 2c3 0 5 0 4-2s-4-1-4 2",
  trophy: "M7 4h10v4a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 19h6M12 13v6",
  dollar: "M12 3v18M16 7c0-1.7-1.8-3-4-3S8 5.3 8 7s1.8 3 4 3 4 1.3 4 3-1.8 3-4 3-4-1.3-4-3",
  clock: "M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z",
  note: "M7 4h7l3 3v13H7zM14 4v3h3M10 12h4M10 15.5h4",
  users:
    "M8.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2 19.5c1-3.2 3.4-4.8 6.5-4.8s5.5 1.6 6.5 4.8M16.5 4.2a3.5 3.5 0 0 1 0 7M22 19.5c-.7-2.4-2.2-3.9-4.3-4.5",
  shieldcheck: "M12 3 5 6v5c0 4.4 3 7.4 7 9 4-1.6 7-4.6 7-9V6zM9 11.5l2 2 4-4",
  info: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 8h.01M11 11.5h1v5h1",
  calendar: "M7 4v2M17 4v2M5 8h14M6 5h12a2 2 0 0 1 2 2v13H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z",
  piggy:
    "M6 10c0-3.3 2.7-6 6-6 2.2 0 4.1 1.2 5.2 3M18 10v2a2 2 0 0 1-2 2h-1l-2 3v1H9v-1l-2-3H6a2 2 0 0 1-2-2v-2M8 14h.01M16 14h.01",
  filter: "M4 6h16M7 12h10M10 18h4",
  qr: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM16 16h2v2M20 20h2v2M14 14h2v2",
  close: "M6 6l12 12M18 6 6 18",
  copy: "M8 4h8v2H8zM6 8v12h2V8zM14 8v12h2V8z",
  share: "M6 12l4-5 3 3 4-5M6 12v7M18 5v7",
  usdc: "M12 2v20M8 7c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4-4-1.8-4-4",
  chevDown: "M6 9l6 6 6-6",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a7.8 7.8 0 0 0 .1-1 7.8 7.8 0 0 0-.1-1l2.1-1.6a.5.5 0 0 0 .1-.6l-2-3.5a.5.5 0 0 0-.6-.2l-2.5 1a7 7 0 0 0-1.7-1L15 4.5a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 0-.5.5l-.4 2.4a7 7 0 0 0-1.7 1l-2.5-1a.5.5 0 0 0-.6.2l-2 3.5a.5.5 0 0 0 .1.6L4.6 13a7.8 7.8 0 0 0-.1 1 7.8 7.8 0 0 0 .1 1l-2.1 1.6a.5.5 0 0 0-.1.6l2 3.5a.5.5 0 0 0 .6.2l2.5-1a7 7 0 0 0 1.7 1l.4 2.4a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5l.4-2.4a7 7 0 0 0 1.7-1l2.5 1a.5.5 0 0 0 .6-.2l2-3.5a.5.5 0 0 0-.1-.6Z",
  help: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 8.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM11 12.5h1v5h1",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  wallet:
    "M4 5h16a2 2 0 0 1 2 2v3H2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3h-4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6",
  eyeOff:
    "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-6.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24M3 3l18 18",
};

export function Icon({
  name,
  size = 20,
  sw = 1.8,
  fill = "none",
  style,
}: {
  name: string;
  size?: number;
  sw?: number;
  fill?: "none" | "solid";
  style?: React.CSSProperties;
}) {
  const d = ICONS[name] || "";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill === "solid" ? "currentColor" : "none"}
      stroke={fill === "solid" ? "none" : "currentColor"}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className="navico"
    >
      <path d={d} />
    </svg>
  );
}

// ---- Brand logomark ----------------------------------------
export function Logo({ size = 22, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/Logo.png"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      style={{ display: "block", width: size, height: size, objectFit: "contain", ...style }}
    />
  );
}

export function LogoMark({ size = 22, style }: { size?: number; style?: React.CSSProperties }) {
  const s = size;
  const c = s * 0.42;
  const g = s * 0.12;
  const r = s * 0.16;
  const gray = "#2E2E32";
  const cell = { width: c, height: c, rx: r };
  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      aria-hidden="true"
      style={{ display: "block", flex: "none", ...style }}
    >
      <rect x="0" y="0" fill="#C8F135" {...cell} />
      <rect x={c + g} y="0" fill={gray} {...cell} />
      <rect x="0" y={c + g} fill={gray} {...cell} />
      <rect x={c + g} y={c + g} fill={gray} {...cell} />
    </svg>
  );
}

// ---- Animation resilience -----------------------------------
// rAF can be throttled (background tab). Wait until an animation SHOULD be done
// (its duration + buffer); if it hasn't completed, force the final state. On
// cleanup, REVERT the tween (React 18 StrictMode runs effects twice).
export function animGuard(els: unknown, anim: gsap.core.Animation | null) {
  const ms = (anim && anim.duration ? anim.duration() * 1000 : 600) + 400;
  const id = setTimeout(() => {
    try {
      const done = anim && anim.totalProgress ? anim.totalProgress() >= 0.99 : false;
      if (!done) {
        if (anim && anim.kill) anim.kill();
        if (els) gsap.set(els as gsap.TweenTarget, { clearProps: "all" });
      }
    } catch {
      /* noop */
    }
  }, ms);
  return () => {
    clearTimeout(id);
    try {
      if (anim && anim.revert) anim.revert();
      else if (els) gsap.set(els as gsap.TweenTarget, { clearProps: "all" });
    } catch {
      /* noop */
    }
  };
}

// ---- Count-up hook (resilient) ------------------------------
export function useCountUp(
  target: number,
  {
    dec = 0,
    prefix = "$",
    dur = 1.1,
    run = true,
  }: { dec?: number; prefix?: string; dur?: number; run?: boolean } = {}
) {
  const ref = useRef<any>(null);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current as HTMLElement;
    const final =
      prefix +
      Number(target).toLocaleString("en-US", {
        minimumFractionDigits: dec,
        maximumFractionDigits: dec,
      });
    el.textContent = final; // resting state = final value (correct even if rAF frozen)
    if (!run) return;
    const obj = { v: 0 };
    const tw = gsap.to(obj, {
      v: target,
      duration: dur,
      ease: "power2.out",
      immediateRender: false,
      onUpdate: () => {
        el.textContent =
          prefix +
          obj.v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
      },
    });
    const t = setTimeout(
      () => {
        if (tw.totalProgress() < 0.99) {
          tw.kill();
          el.textContent = final;
        }
      },
      dur * 1000 + 400
    );
    return () => {
      tw.kill();
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, run]);
  return ref;
}

// ---- Screen header (back button + title) -------------------
export function ScreenHeader({
  title,
  back = "/home",
  right,
}: {
  title: string;
  back?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="between" style={{ padding: "6px 0 14px" }}>
      <Link className="tok" href={back} aria-label="Atrás">
        <Icon name="arrowL" size={19} />
      </Link>
      <div style={{ fontWeight: 700, fontSize: 16, fontFamily: "var(--font-display)" }}>
        {title}
      </div>
      <div style={{ width: 40, display: "flex", justifyContent: "flex-end" }}>{right || null}</div>
    </div>
  );
}

export function StepDots({ n, i }: { n: number; i: number }) {
  return (
    <div className="row" style={{ gap: 6, padding: "6px 0 2px" }}>
      {Array.from({ length: n }).map((_, k) => (
        <span
          key={k}
          style={{
            height: 4,
            flex: k === i ? 2 : 1,
            borderRadius: 999,
            background: k <= i ? "var(--accent)" : "var(--border)",
          }}
        />
      ))}
    </div>
  );
}

// ---- Mini sparkline for the home hero card ------------------
export function MiniSparkline({ height = 56, width = 120 }: { height?: number; width?: number }) {
  const pts = [4, 8, 6, 14, 12, 22, 18, 28, 24, 36, 32, 44];
  const max = Math.max(...pts);
  const xs = (i: number) => (i / (pts.length - 1)) * width;
  const ys = (v: number) => height - 6 - (v / max) * (height - 12);
  const d = pts
    .map((v, i) => (i ? "L" : "M") + xs(i).toFixed(1) + " " + ys(v).toFixed(1))
    .join(" ");
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <defs>
        <filter id="spk-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d={d}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#spk-glow)"
        opacity="0.95"
      />
    </svg>
  );
}

const CHART = {
  line: "#C8F135",
  fill1: "rgba(200,241,53,0.28)",
  fill2: "rgba(200,241,53,0.0)",
  grid: "rgba(255,255,255,0.06)",
};

// ---- Projection chart (GSAP draw-in) -----------------------
// `series` is an array of { value } points (map your projection balances onto this).
export function ProjectionChart({
  series,
  height = 180,
  animKey = "0",
  showDots = true,
  showAllDots = false,
  yMax,
}: {
  series: { value: number }[];
  height?: number;
  animKey?: string | number;
  showDots?: boolean;
  showAllDots?: boolean;
  yMax?: number;
}) {
  const t = CHART;
  const pathRef = useRef<SVGPathElement | null>(null);
  const areaRef = useRef<SVGPathElement | null>(null);
  const W = 320,
    H = height,
    padL = 6,
    padR = 6,
    padT = 14,
    padB = 22;
  const max = yMax || Math.max(...series.map((d) => d.value)) || 1;
  const xs = (i: number) => padL + (i / (series.length - 1)) * (W - padL - padR);
  const ys = (v: number) => H - padB - (v / max) * (H - padT - padB);
  const pts = series.map((d, i) => [xs(i), ys(d.value)] as [number, number]);
  const line = pts
    .map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1))
    .join(" ");
  const area = line + ` L ${xs(series.length - 1).toFixed(1)} ${H - padB} L ${padL} ${H - padB} Z`;

  useEffect(() => {
    if (!pathRef.current) return;
    const len = pathRef.current.getTotalLength();
    const tl = gsap.timeline();
    tl.fromTo(
      pathRef.current,
      { strokeDasharray: len, strokeDashoffset: len },
      { strokeDashoffset: 0, duration: 1.4, ease: "power2.out", immediateRender: false }
    ).fromTo(
      areaRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.7, immediateRender: false },
      0.3
    );
    const to = setTimeout(() => {
      if (tl.totalProgress() < 0.99) {
        tl.kill();
        gsap.set([pathRef.current, areaRef.current], { clearProps: "all" });
      }
    }, 2200);
    return () => {
      tl.kill();
      clearTimeout(to);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animKey, series.length]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: "block" }}>
      <defs>
        <linearGradient id="cg-volt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={t.fill1} />
          <stop offset="1" stopColor={t.fill2} />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line
          key={g}
          x1={padL}
          x2={W - padR}
          y1={padT + g * (H - padT - padB)}
          y2={padT + g * (H - padT - padB)}
          stroke={t.grid}
          strokeWidth="1"
        />
      ))}
      <path ref={areaRef} d={area} fill="url(#cg-volt)" />
      <path
        ref={pathRef}
        d={line}
        fill="none"
        stroke={t.line}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showAllDots &&
        pts.map((p, i) => (
          <circle
            key={i}
            cx={p[0]}
            cy={p[1]}
            r="3.5"
            fill={t.line}
            stroke="var(--screen-bg)"
            strokeWidth="1.5"
          />
        ))}
      {showDots && !showAllDots && (
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="4.5" fill={t.line} />
      )}
    </svg>
  );
}

// ---- Gamification levels (shared by home/streak/landing) ----
export const LEVELS = [
  {
    key: "semilla",
    name: "Semilla",
    en: "Seed",
    range: "1–4 sem",
    benefit: "Proyecciones básicas",
    emoji: "🌱",
  },
  {
    key: "brote",
    name: "Brote",
    en: "Sprout",
    range: "5–12 sem",
    benefit: "Proyecciones avanzadas + consejos",
    emoji: "🌿",
  },
  {
    key: "arbol",
    name: "Árbol",
    en: "Tree",
    range: "13–26 sem",
    benefit: "Insignia on-chain + descuentos",
    emoji: "🌳",
  },
  {
    key: "bosque",
    name: "Bosque",
    en: "Forest",
    range: "27–52 sem",
    benefit: "Instrumentos de ahorro extra",
    emoji: "🌲",
  },
  {
    key: "legado",
    name: "Legado",
    en: "Legacy",
    range: "1 año +",
    benefit: "Beneficio comunitario + voz",
    emoji: "✨",
  },
];
const LEVEL_START = [0, 5, 13, 27, 52];

export function streakMeta(weeks: number) {
  let idx = 0;
  if (weeks >= 52) idx = 4;
  else if (weeks >= 27) idx = 3;
  else if (weeks >= 13) idx = 2;
  else if (weeks >= 5) idx = 1;
  const nextIdx = Math.min(idx + 1, 4);
  const nextAt = LEVEL_START[nextIdx];
  const weeksLeft = nextIdx > idx ? Math.max(0, nextAt - weeks) : 0;
  const progress = nextIdx > idx ? Math.min(weeks / nextAt, 1) : 1;
  return { current: LEVELS[idx], next: LEVELS[nextIdx], weeksLeft, progress, atMax: idx >= 4 };
}

// ---- formatting helpers (match the redesign) ----------------
export const fmtUSD = (n: number, dec = 0) =>
  "$" +
  Number(n).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
export const fmtUSDk = (n: number) =>
  n >= 1000 ? "$" + (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k" : "$" + n;

// Build a {value}[] series for ProjectionChart from monthly contribution + annual
// rate (DECIMAL, e.g. 0.045) over `years`, compounded monthly from a start balance.
export function chartSeries(monthly: number, annualRate: number, years: number, startBalance = 0) {
  const r = annualRate / 12;
  const out = [{ value: Math.round(startBalance) }];
  let bal = startBalance;
  for (let m = 1; m <= years * 12; m++) {
    bal = bal * (1 + r) + monthly;
    if (m % 12 === 0) out.push({ value: Math.round(bal) });
  }
  return out;
}

export function projectionYAxis(maxValue: number) {
  const step = 25000;
  const top = Math.max(step, Math.ceil(maxValue / step) * step);
  const ticks: number[] = [];
  for (let v = 0; v <= top; v += step) ticks.push(v);
  return { ticks, top };
}

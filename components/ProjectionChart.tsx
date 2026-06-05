"use client";

import { useRef, useMemo } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { projectionSeries } from "@/lib/yield";

export function ProjectionChart({
  monthly,
  rate,
  years = 30,
  startingBalance = 0,
  height = 180,
}: {
  monthly: number;
  rate: number;
  years?: number;
  startingBalance?: number;
  height?: number;
}) {
  const root = useRef<SVGSVGElement>(null);
  const W = 320;
  const H = height;
  const pad = 6;

  const { line, area, max } = useMemo(() => {
    const data = projectionSeries(monthly, rate, years, startingBalance);
    const max = Math.max(1, data[data.length - 1].balance);
    const x = (i: number) => pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = (v: number) => H - pad - (v / max) * (H - pad * 2);
    const pts = data.map((d, i) => `${x(i)},${y(d.balance)}`);
    const line = "M" + pts.join(" L");
    const area = `${line} L${x(data.length - 1)},${H - pad} L${x(0)},${H - pad} Z`;
    return { line, area, max };
  }, [monthly, rate, years, startingBalance, H]);

  useGSAP(
    () => {
      const path = root.current?.querySelector(".pl") as SVGPathElement | null;
      if (path) {
        const len = path.getTotalLength();
        gsap.fromTo(
          path,
          { strokeDasharray: len, strokeDashoffset: len },
          { strokeDashoffset: 0, duration: 1.1, ease: "power2.out" }
        );
      }
      gsap.from(root.current?.querySelector(".pa") ?? {}, {
        autoAlpha: 0,
        duration: 1.0,
        ease: "power1.out",
      });
    },
    { scope: root, dependencies: [line], revertOnUpdate: true }
  );

  return (
    <svg ref={root} viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
      <defs>
        <linearGradient id="kvg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFD23F" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFD23F" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <path className="pa" d={area} fill="url(#kvg)" />
      <path
        className="pl"
        d={line}
        fill="none"
        stroke="#111"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

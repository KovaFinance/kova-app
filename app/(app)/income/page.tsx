"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useStore } from "@/lib/store";
import { Icon, ScreenHeader } from "@/components/kova";
import { monthlyIncome } from "@/lib/yield";

export default function IncomePage() {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const principal = useStore((s) => s.principal);
  const liveRate = useStore((s) => s.liveRate);
  const accruedYield = useStore((s) => s.accruedYield);
  const claimYield = useStore((s) => s.claimYield);

  const ratePct = (liveRate * 100).toFixed(1);
  const monthlyOf = (b: number) => monthlyIncome(b, liveRate);
  const fmtMo = (b: number) =>
    "$" +
    monthlyOf(b).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const [simBal, setSimBal] = useState(Math.max(500, Math.round(principal)));
  const monRef = useRef<HTMLSpanElement | null>(null);
  const isIncome = mode === "income";
  const yearly = monthlyOf(simBal) * 12;

  const [claimMsg, setClaimMsg] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!monRef.current) return;
    const target = monthlyOf(simBal);
    monRef.current.textContent = fmtMo(simBal);
    const obj = { v: 0 };
    const tw = gsap.to(obj, {
      v: target,
      duration: 1,
      ease: "power2.out",
      immediateRender: false,
      onUpdate: () => {
        if (monRef.current)
          monRef.current.textContent =
            "$" +
            obj.v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      },
    });
    const t = setTimeout(() => {
      if (tw.totalProgress() < 0.99) {
        tw.kill();
        if (monRef.current) monRef.current.textContent = fmtMo(simBal);
      }
    }, 1400);
    return () => {
      tw.kill();
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDrag = (v: number) => {
    setSimBal(v);
    if (monRef.current) monRef.current.textContent = fmtMo(v);
  };

  const doClaim = async () => {
    setClaiming(true);
    setClaimMsg(null);
    try {
      const amt = await claimYield();
      setClaimMsg(`✓ Cobraste $${amt.toFixed(2)}`);
    } catch (e) {
      setClaimMsg(e instanceof Error ? e.message : "No se pudo cobrar.");
    } finally {
      setClaiming(false);
    }
  };

  const presets = [Math.max(500, Math.round(principal)), 25000, 100000];

  return (
    <div className="screen pad">
      <ScreenHeader title="Modo ingreso" back="/home" />

      {/* mode toggle */}
      <div className="card s2" style={{ padding: 4, display: "flex" }}>
        {(
          [
            ["grow", "Crecer", "Acumula"],
            ["income", "Ingreso", "Vive del rendimiento"],
          ] as const
        ).map(([k, t, s]) => (
          <button
            key={k}
            onClick={() => setMode(k)}
            style={{
              flex: 1,
              padding: "11px 8px",
              borderRadius: "var(--radius-sm)",
              background: mode === k ? "var(--surface)" : "transparent",
              border: mode === k ? "1px solid var(--border)" : "1px solid transparent",
              color: "var(--text)",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 14 }}>{t}</div>
            <div className="faint" style={{ fontSize: 11 }}>
              {s}
            </div>
          </button>
        ))}
      </div>

      {/* monthly income hero */}
      <div className="card" style={{ padding: 22, textAlign: "center", marginTop: 14 }}>
        <div className="label">Recibirías cada mes</div>
        <div
          className="row"
          style={{ justifyContent: "center", alignItems: "baseline", gap: 4, margin: "4px 0" }}
        >
          <span ref={monRef} className="num" style={{ fontSize: 48, color: "var(--accent)" }}>
            $0.00
          </span>
          <span className="dim num" style={{ fontSize: 20 }}>
            /mes
          </span>
        </div>
        <span className="chip" style={{ fontSize: 11.5 }}>
          <Icon name="spark" size={12} /> variable · a tasa actual ~{ratePct}%
        </span>
      </div>

      {/* real claimable yield */}
      {accruedYield > 0 && (
        <div className="card" style={{ padding: 16, marginTop: 12 }}>
          <div className="between">
            <div>
              <div className="label">Rendimiento disponible ahora</div>
              <div className="num" style={{ fontSize: 26, color: "var(--positive)", marginTop: 4 }}>
                ${accruedYield.toFixed(2)}
              </div>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: "auto", padding: "12px 18px" }}
              disabled={claiming}
              onClick={doClaim}
            >
              {claiming ? "Cobrando…" : "Cobrar"}
            </button>
          </div>
          {claimMsg && (
            <p
              className="mono"
              style={{
                fontSize: 12,
                color: "var(--text-dim)",
                margin: "10px 0 0",
                textAlign: "center",
              }}
            >
              {claimMsg}
            </p>
          )}
        </div>
      )}

      {/* balance slider */}
      <div className="card s2" style={{ padding: 16, marginTop: 12 }}>
        <div className="between">
          <span className="label">Ahorro en la bóveda</span>
          <span className="num" style={{ fontSize: 18 }}>
            ${simBal.toLocaleString("en-US")}
          </span>
        </div>
        <input
          type="range"
          min={500}
          max={200000}
          step={500}
          value={simBal}
          onChange={(e) => onDrag(+e.target.value)}
          style={{ width: "100%", marginTop: 12 }}
        />
        <div className="between faint" style={{ fontSize: 11, marginTop: 2 }}>
          <span>$500</span>
          <span>$200k</span>
        </div>
        <div className="row" style={{ gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {presets.map((v) => (
            <button
              key={v}
              className={"chip" + (simBal === v ? " on" : "")}
              onClick={() => onDrag(v)}
            >
              ${v / 1000 < 1 ? v : Math.round(v / 1000) + "k"}
            </button>
          ))}
        </div>
      </div>

      {/* principal-preserved explainer */}
      <div className="card" style={{ padding: 16, marginTop: 12 }}>
        <div className="row" style={{ gap: 10, alignItems: "flex-start" }}>
          <div className="tok" style={{ flex: "none" }}>
            <Icon name="lock" size={18} />
          </div>
          <p className="dim" style={{ fontSize: 13.5, margin: 0, lineHeight: 1.5 }}>
            Con{" "}
            <b className="num" style={{ color: "var(--text)" }}>
              ${simBal.toLocaleString("en-US")}
            </b>{" "}
            ahorrados recibirías ~
            <b className="num" style={{ color: "var(--text)" }}>
              {fmtMo(simBal)}
            </b>
            /mes (≈<span className="num">${Math.round(yearly).toLocaleString("en-US")}</span>/año).
            Tu principal queda <b style={{ color: "var(--text)" }}>intacto y tuyo</b> — retiras solo
            el rendimiento.
          </p>
        </div>
      </div>

      <p
        className="dim"
        style={{ fontSize: 13, textAlign: "center", margin: "14px 8px 0", lineHeight: 1.45 }}
      >
        Cada dólar que ahorras suma{" "}
        <b style={{ color: "var(--text)" }}>ingreso mensual permanente.</b>
      </p>

      <button
        className="btn btn-primary"
        style={{ marginTop: 16 }}
        onClick={() => setMode(isIncome ? "grow" : "income")}
      >
        {isIncome ? (
          <span>
            <Icon name="arrowUp" size={16} /> Volver a modo crecer
          </span>
        ) : (
          <span>
            <Icon name="dollar" size={16} /> Activar modo ingreso
          </span>
        )}
      </button>
      <p
        className="faint"
        style={{ fontSize: 11, marginTop: 10, textAlign: "center", lineHeight: 1.4 }}
      >
        No es un salario garantizado. El rendimiento varía con las tasas del tesoro tokenizado.
      </p>
    </div>
  );
}

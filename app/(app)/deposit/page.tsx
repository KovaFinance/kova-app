"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Icon, ScreenHeader } from "@/components/kova";

const PRESETS = [25, 50, 100, 200];

export default function DepositPage() {
  const router = useRouter();
  const recordIncome = useStore((s) => s.recordIncome);
  const savingsBps = useStore((s) => s.savingsBps);
  const pct = Math.round(savingsBps / 100);

  const [amt, setAmt] = useState("100");
  const [result, setResult] = useState<{ saved: number; spendable: number } | null>(null);
  const n = parseFloat(amt) || 0;
  const canSubmit = n > 0;

  const submit = () => {
    if (!canSubmit) return;
    const r = recordIncome("Aporte manual", "manual", n);
    setResult(r);
  };

  if (result) {
    return (
      <div
        className="screen pad"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          gap: 16,
        }}
      >
        <div style={{ color: "var(--positive)" }}>
          <Icon name="check" size={64} />
        </div>
        <h1 style={{ fontSize: 26 }}>Ingreso registrado</h1>
        <p className="dim" style={{ fontSize: 15, lineHeight: 1.5 }}>
          De{" "}
          <b className="num" style={{ color: "var(--text)" }}>
            ${n.toFixed(2)}
          </b>{" "}
          guardamos{" "}
          <b className="num" style={{ color: "var(--positive)" }}>
            ${result.saved.toFixed(2)}
          </b>{" "}
          en tu fondo de retiro — quedan <b className="num">${result.spendable.toFixed(2)}</b>{" "}
          disponibles.
        </p>
        <button className="btn btn-primary" onClick={() => router.push("/home")}>
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="screen pad mn-screen">
      <ScreenHeader title="Aporte manual" back="/home" />

      <div className="mn-hero">
        <div className="mn-plus-ico">
          <Icon name="plus" size={30} sw={2.4} />
        </div>
        <p className="mn-desc">
          Registra un ingreso — guardamos tu {pct}% automáticamente en tu fondo de retiro.
        </p>
      </div>

      <div className="mn-amount-row">
        <span className="num mn-dollar">$</span>
        <input
          className="num mn-amount"
          value={amt}
          onChange={(e) => setAmt(e.target.value.replace(/[^0-9.]/g, ""))}
          inputMode="decimal"
        />
        <button className="snd-currency" type="button" aria-label="Moneda USDC">
          <span>USDC</span>
          <Icon name="chevDown" size={16} />
        </button>
      </div>

      <div className="mn-chips row">
        {PRESETS.map((v) => (
          <button
            key={v}
            className={"mn-chip" + (parseFloat(amt) === v ? " on" : "")}
            onClick={() => setAmt(String(v))}
          >
            ${v}
          </button>
        ))}
      </div>

      <div className="card s2 mn-info">
        Tu ahorro automático del <b>{pct}%</b> se aplica a este ingreso; el resto queda disponible.
      </div>

      <div style={{ flex: 1 }} />

      <button className="btn btn-primary" disabled={!canSubmit} onClick={submit}>
        Registrar ingreso
      </button>
    </div>
  );
}

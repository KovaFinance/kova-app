"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Icon, ScreenHeader, useCountUp } from "@/components/kova";

const FOOTER = "kova.app · stellar testnet · USDC";

export default function VaultPage() {
  const router = useRouter();
  const [view, setView] = useState<"vault" | "withdraw">("vault");
  const principal = useStore((s) => s.principal);
  const liveRate = useStore((s) => s.liveRate);

  if (view === "withdraw") return <Withdraw onBack={() => setView("vault")} max={principal} />;

  const ratePct = (liveRate * 100).toFixed(1);
  const yearYield = principal * liveRate;

  return (
    <VaultView
      principal={principal}
      ratePct={ratePct}
      yearYield={yearYield}
      onWithdraw={() => setView("withdraw")}
      onIncome={() => router.push("/income")}
      onCash={() => router.push("/cash")}
      onHistory={() => router.push("/activity")}
    />
  );
}

function VaultView({
  principal,
  ratePct,
  yearYield,
  onWithdraw,
  onIncome,
  onCash,
  onHistory,
}: {
  principal: number;
  ratePct: string;
  yearYield: number;
  onWithdraw: () => void;
  onIncome: () => void;
  onCash: () => void;
  onHistory: () => void;
}) {
  const balRef = useCountUp(principal, { dec: 2 });
  return (
    <div className="screen pad">
      <ScreenHeader
        title="Mi bóveda"
        back="/home"
        right={
          <button className="tok" onClick={onHistory} aria-label="Historial">
            <Icon name="clock" size={19} />
          </button>
        }
      />

      <div className="card" style={{ padding: 22, textAlign: "center" }}>
        <div className="row" style={{ justifyContent: "center", gap: 6, marginBottom: 4 }}>
          <Icon name="lock" size={14} style={{ color: "var(--text-dim)" }} />
          <span className="label" style={{ marginBottom: 0 }}>
            Bóveda USD · solo tú la controlas
          </span>
        </div>
        <div ref={balRef} className="num" style={{ fontSize: 46, margin: "4px 0" }}>
          $0
        </div>
        <span className="chip" style={{ color: "var(--positive)" }}>
          <Icon name="spark" size={13} /> ganan ~{ratePct}% al año
        </span>
      </div>

      <div className="row" style={{ gap: 12, marginTop: 12 }}>
        <button
          className="card s2"
          style={{ flex: 1, padding: 14, textAlign: "left" }}
          onClick={onIncome}
        >
          <div className="between">
            <div className="label">Rendimiento</div>
            <Icon name="arrowR" size={14} style={{ color: "var(--text-faint)" }} />
          </div>
          <div className="num" style={{ fontSize: 22, marginTop: 4, color: "var(--positive)" }}>
            +${yearYield.toFixed(0)}
            <span className="dim" style={{ fontSize: 12 }}>
              /año
            </span>
          </div>
          <div className="faint" style={{ fontSize: 11, marginTop: 2 }}>
            Vívelo: modo ingreso →
          </div>
        </button>
        <div className="card s2" style={{ flex: 1, padding: 14 }}>
          <div className="label">Candado</div>
          <div className="num" style={{ fontSize: 22, marginTop: 4 }}>
            Abierto
          </div>
          <div className="faint" style={{ fontSize: 11, marginTop: 2 }}>
            Retira cuando quieras
          </div>
        </div>
      </div>

      <div className="card s2" style={{ padding: 14, marginTop: 12 }}>
        <div className="row" style={{ gap: 10 }}>
          <Icon name="shield" size={20} style={{ color: "var(--accent)" }} />
          <p className="dim" style={{ fontSize: 13, lineHeight: 1.45, margin: 0 }}>
            No-custodial: ningún banco ni empresa puede congelar ni prestar tu dinero. Auditable
            on-chain.
          </p>
        </div>
      </div>

      <div className="row" style={{ gap: 12, marginTop: 16 }}>
        <button className="btn btn-secondary" onClick={onCash}>
          <Icon name="swap" size={18} /> Cash in/out
        </button>
        <button className="btn btn-primary" onClick={onWithdraw}>
          <Icon name="arrowUp" size={18} /> Retirar
        </button>
      </div>
      <div className="mono faint" style={{ fontSize: 10.5, textAlign: "center", marginTop: 16 }}>
        {FOOTER}
      </div>
    </div>
  );
}

function Withdraw({ onBack, max }: { onBack: () => void; max: number }) {
  const withdraw = useStore((s) => s.withdraw);
  const [amt, setAmt] = useState(String(Math.min(200, Math.floor(max)) || 0));
  const [mode, setMode] = useState<"normal" | "emergency">("normal");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const n = Math.min(parseFloat(amt) || 0, max);
  const penalty = mode === "emergency" ? n * 0.02 : 0;

  const confirm = async () => {
    if (n <= 0) return;
    setBusy(true);
    setErr("");
    try {
      await withdraw(n);
      setDone(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo completar el retiro.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
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
        <h1 style={{ fontSize: 26 }}>Retiro enviado</h1>
        <p className="dim" style={{ fontSize: 15 }}>
          <b className="num">${(n - penalty).toFixed(2)}</b> en camino a tu billetera USDC.
        </p>
        <button className="btn btn-primary" onClick={onBack}>
          Volver a la bóveda
        </button>
      </div>
    );
  }

  return (
    <div className="screen pad" style={{ display: "flex", flexDirection: "column" }}>
      <div className="between" style={{ padding: "6px 0 14px" }}>
        <button className="tok" onClick={onBack} aria-label="Atrás">
          <Icon name="arrowL" size={19} />
        </button>
        <div style={{ fontWeight: 700, fontSize: 16, fontFamily: "var(--font-display)" }}>
          Retirar
        </div>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ textAlign: "center", padding: "14px 0" }}>
        <div className="label">Monto a retirar · USD</div>
        <div
          className="row"
          style={{ justifyContent: "center", alignItems: "baseline", gap: 2, marginTop: 6 }}
        >
          <span className="num" style={{ fontSize: 40, color: "var(--text-dim)" }}>
            $
          </span>
          <input
            className="num"
            value={amt}
            onChange={(e) => setAmt(e.target.value.replace(/[^0-9.]/g, ""))}
            inputMode="decimal"
            style={{
              width: 170,
              fontSize: 52,
              background: "transparent",
              border: "none",
              color: "var(--text)",
              textAlign: "center",
              outline: "none",
            }}
          />
        </div>
        <div className="faint" style={{ fontSize: 12.5 }}>
          Disponible <span className="num">${max.toFixed(2)}</span>
        </div>
      </div>

      <div className="row" style={{ gap: 8, justifyContent: "center" }}>
        {[50, 100, 200].map((v) => (
          <button key={v} className="chip" onClick={() => setAmt(String(v))}>
            ${v}
          </button>
        ))}
        <button className="chip" onClick={() => setAmt(String(Math.floor(max)))}>
          Máx
        </button>
      </div>

      <div className="card s2" style={{ padding: 4, marginTop: 20, display: "flex" }}>
        {(
          [
            ["normal", "Normal", "Sin penalización"],
            ["emergency", "Emergencia", "2% de penalización"],
          ] as const
        ).map(([k, t, s]) => (
          <button
            key={k}
            onClick={() => setMode(k)}
            style={{
              flex: 1,
              padding: "12px 8px",
              borderRadius: "var(--radius-sm)",
              textAlign: "center",
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

      {mode === "emergency" && (
        <div
          className="card s2"
          style={{ padding: 14, marginTop: 12, borderColor: "var(--negative)" }}
        >
          <div className="row" style={{ gap: 8 }}>
            <Icon name="lock" size={18} style={{ color: "var(--negative)" }} />
            <p className="dim" style={{ fontSize: 13, margin: 0, lineHeight: 1.4 }}>
              Retiro anticipado del candado opcional. Penalización de{" "}
              <b className="num">${penalty.toFixed(2)}</b> — definida por el contrato, no por
              nosotros.
            </p>
          </div>
        </div>
      )}

      <div style={{ flex: 1 }} />

      <div className="card s2" style={{ padding: 14, marginTop: 16 }}>
        <div className="between">
          <span className="dim" style={{ fontSize: 13 }}>
            Recibes
          </span>
          <span className="num" style={{ fontSize: 18 }}>
            ${(n - penalty).toFixed(2)}
          </span>
        </div>
      </div>
      {err && (
        <p
          className="mono"
          style={{ fontSize: 11.5, color: "var(--negative)", textAlign: "center", marginTop: 10 }}
        >
          {err}
        </p>
      )}
      <button
        className="btn btn-primary"
        style={{ marginTop: 12 }}
        disabled={n <= 0 || busy}
        onClick={confirm}
      >
        <Icon name="face" size={18} /> {busy ? "Confirmando…" : "Confirmar con Face ID"}
      </button>
    </div>
  );
}

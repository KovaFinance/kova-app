"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { toStroops, fromStroops } from "@/lib/stellar/config";
import { Icon, ScreenHeader } from "@/components/kova";

const money = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Floor to cents so a preset / Máx never proposes more than the real available balance.
const floorCents = (n: number) => Math.floor(Math.max(0, n) * 100) / 100;

const CENT_STROOPS = 100_000n; // 0.01 USDC — the minimum that can land in the fund

export default function DepositPage() {
  const router = useRouter();
  const contribute = useStore((s) => s.contribute);
  const refreshBalance = useStore((s) => s.refreshBalance);
  const savingsBps = useStore((s) => s.savingsBps);
  const walletBalance = useStore((s) => s.walletBalance);
  const pct = Math.round(savingsBps / 100);

  const [amt, setAmt] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState<{ amount: number; saved: number; available: number } | null>(
    null
  );
  // Synchronous in-flight guard — closes the same-tick double-submit window that a React
  // state flag (busy) leaves open (state updates are async).
  const inFlight = useRef(false);

  // Pull the real available balance from chain when the screen opens, so the cap + "Disponible"
  // figure are current even if the user navigated straight here.
  useEffect(() => {
    void refreshBalance();
  }, [refreshBalance]);

  const n = parseFloat(amt) || 0;
  // Mirror the contract's integer math (it floors at stroops) so the previewed saved/remaining
  // match the post-deposit on-chain balance to the cent — never overstating what stays available.
  const savedStroops = (toStroops(n) * BigInt(savingsBps)) / 10_000n;
  const saved = fromStroops(savedStroops);
  const remaining = fromStroops(toStroops(walletBalance) - savedStroops);
  const overBalance = n > walletBalance + 1e-9;
  const noFunds = walletBalance <= 0;
  const belowMin = n > 0 && !overBalance && savedStroops < CENT_STROOPS; // <1¢ would reach the fund
  const canSubmit = n > 0 && !overBalance && !noFunds && !belowMin && !busy;

  const presets = [
    { label: "25%", value: floorCents(walletBalance * 0.25) },
    { label: "50%", value: floorCents(walletBalance * 0.5) },
    { label: "Máx", value: floorCents(walletBalance) },
  ];

  const submit = async () => {
    if (inFlight.current || !canSubmit) return;
    inFlight.current = true;
    setBusy(true);
    setErr("");
    try {
      const r = await contribute(n);
      // contribute() returns the authoritative post-deposit available (never the stale balance).
      setResult({ amount: n, saved: r.saved, available: r.available });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo aportar. Intenta de nuevo.");
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
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
        <h1 style={{ fontSize: 26 }}>Aporte realizado</h1>
        <p className="dim" style={{ fontSize: 15, lineHeight: 1.5 }}>
          Guardamos{" "}
          <b className="num" style={{ color: "var(--positive)" }}>
            ${money(result.saved)}
          </b>{" "}
          en tu fondo de retiro.
          <br />
          Saldo disponible:{" "}
          <b className="num" style={{ color: "var(--text)" }}>
            ${money(result.available)}
          </b>
        </p>
        <button className="btn btn-primary" onClick={() => router.push("/home")}>
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="screen pad mn-screen">
      <ScreenHeader title="Aportar a tu fondo" back="/home" />

      <div className="mn-hero">
        <div className="mn-plus-ico">
          <Icon name="plus" size={30} sw={2.4} />
        </div>
        <p className="mn-desc">
          Mueve parte de tu saldo disponible a tu fondo de retiro — guardamos tu {pct}% y el resto
          queda disponible.
        </p>
      </div>

      <div
        className="card s2"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <span className="label">Disponible</span>
        <span className="num" style={{ fontWeight: 700 }}>
          ${money(walletBalance)}{" "}
          <span className="faint" style={{ fontSize: 12 }}>
            USDC
          </span>
        </span>
      </div>

      <div className="mn-amount-row">
        <span className="num mn-dollar">$</span>
        <input
          className="num mn-amount"
          value={amt}
          onChange={(e) => setAmt(e.target.value.replace(/[^0-9.]/g, ""))}
          inputMode="decimal"
          placeholder="0"
          disabled={noFunds}
          aria-label="Monto a aportar"
          aria-invalid={overBalance}
          aria-describedby="mn-note"
        />
        {/* USDC-only app → static label, not an interactive (and dead) currency picker. */}
        <span className="snd-currency" aria-label="Moneda USDC">
          <span>USDC</span>
        </span>
      </div>

      <div className="mn-chips row">
        {presets.map((p) => (
          <button
            key={p.label}
            className={"mn-chip" + (n > 0 && parseFloat(amt) === p.value ? " on" : "")}
            onClick={() => setAmt(String(p.value))}
            disabled={noFunds || p.value <= 0}
          >
            {p.label}
          </button>
        ))}
      </div>

      {noFunds ? (
        <div id="mn-note" className="card s2 mn-info">
          No tienes USDC disponible todavía. Recíbelo en tu dirección y vuelve para aportar.
        </div>
      ) : overBalance ? (
        <div id="mn-note" className="card s2 mn-info" style={{ color: "var(--negative)" }}>
          Solo tienes ${money(walletBalance)} disponibles.
        </div>
      ) : belowMin ? (
        <div id="mn-note" className="card s2 mn-info">
          Aumenta el monto: a tu fondo debe llegar al menos <b>$0.01</b>.
        </div>
      ) : n > 0 ? (
        <div id="mn-note" className="card s2 mn-info">
          A tu fondo: <b>${money(saved)}</b> ({pct}%) · te quedan <b>${money(remaining)}</b>{" "}
          disponibles.
        </div>
      ) : (
        <div id="mn-note" className="card s2 mn-info">
          Guardamos tu <b>{pct}%</b> en tu fondo; el resto queda disponible al instante.
        </div>
      )}

      {err && (
        <p
          className="mono"
          style={{ fontSize: 12, color: "var(--negative)", textAlign: "center", marginTop: 12 }}
        >
          {err}
        </p>
      )}

      <div style={{ flex: 1 }} />

      {noFunds ? (
        <button className="btn btn-primary" onClick={() => router.push("/receive")}>
          Recibir USDC
        </button>
      ) : (
        <button className="btn btn-primary" disabled={!canSubmit} onClick={submit}>
          {busy ? "Aportando…" : "Aportar al fondo"}
        </button>
      )}
    </div>
  );
}

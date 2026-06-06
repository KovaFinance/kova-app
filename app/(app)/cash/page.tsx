"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Icon, ScreenHeader } from "@/components/kova";
import { ANCHOR_ASSET_CODE, ANCHOR_HOME_DOMAIN } from "@/lib/stellar/config";
import {
  sep10Authenticate,
  sep24Interactive,
  sep24Transaction,
  isTerminalStatus,
  isSafeAnchorUrl,
  type AnchorTransaction,
} from "@/lib/anchor/client";

type Phase = "idle" | "auth" | "interactive" | "polling" | "done" | "error";

function prettyStatus(s: string): string {
  const map: Record<string, string> = {
    incomplete: "Esperando que completes el formulario…",
    pending_user_transfer_start: "Esperando tu transferencia…",
    pending_anchor: "El anchor está procesando…",
    pending_stellar: "Liquidando en Stellar…",
    completed: "¡Completado!",
    refunded: "Reembolsado",
    expired: "Expiró",
    error: "Error en el anchor",
  };
  return map[s] ?? s;
}

export default function CashPage() {
  const signer = useStore((s) => s.signer);
  const [dir, setDir] = useState<"in" | "out">("in");
  const [amount, setAmount] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [tx, setTx] = useState<AnchorTransaction | null>(null);
  const [err, setErr] = useState("");
  const alive = useRef(true);
  useEffect(() => () => void (alive.current = false), []);

  // SEP-10 authenticates classic ed25519 (G…) accounts. Passkey smart wallets are C…
  // contracts (SEP-45, Draft) — gated honestly.
  const isContractAccount = (signer?.publicKey ?? "").startsWith("C");
  const canCash = !!signer && !isContractAccount;

  const start = async () => {
    if (!signer) return;
    setErr("");
    setTx(null);
    // open the popup synchronously (inside the click) so it isn't blocked, fill it after auth.
    const popup = window.open("", "kova-anchor", "popup,width=460,height=680");
    try {
      setPhase("auth");
      const jwt = await sep10Authenticate(signer);
      setPhase("interactive");
      const amt = parseFloat(amount) || undefined;
      const { url, id } = await sep24Interactive(
        jwt,
        dir === "in" ? "deposit" : "withdraw",
        signer.publicKey,
        amt
      );
      if (popup) popup.location.href = url;
      else window.open(url, "kova-anchor", "popup,width=460,height=680");

      setPhase("polling");
      // poll the transaction until it reaches a terminal status (or we give up).
      for (let i = 0; i < 150 && alive.current; i++) {
        await new Promise((r) => setTimeout(r, 4000));
        if (!alive.current) return;
        const t = await sep24Transaction(jwt, id).catch(() => null);
        if (t) {
          setTx(t);
          if (isTerminalStatus(t.status)) {
            setPhase("done");
            return;
          }
        }
      }
      setPhase("done");
    } catch (e) {
      if (popup) popup.close();
      setErr(e instanceof Error ? e.message : "No se pudo iniciar el flujo del anchor.");
      setPhase("error");
    }
  };

  const busy = phase === "auth" || phase === "interactive" || phase === "polling";

  return (
    <div className="screen pad" style={{ display: "flex", flexDirection: "column" }}>
      <ScreenHeader title="Cash in / out" back="/vault" />

      {/* direction toggle */}
      <div className="card s2" style={{ padding: 4, display: "flex" }}>
        {(
          [
            ["in", "Ingresar", "Efectivo → " + ANCHOR_ASSET_CODE],
            ["out", "Sacar", ANCHOR_ASSET_CODE + " → efectivo"],
          ] as const
        ).map(([k, t, s]) => (
          <button
            key={k}
            onClick={() => setDir(k)}
            disabled={busy}
            style={{
              flex: 1,
              padding: "12px 8px",
              borderRadius: "var(--radius-sm)",
              background: dir === k ? "var(--surface)" : "transparent",
              border: dir === k ? "1px solid var(--border)" : "1px solid transparent",
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

      {/* amount (optional — anchor finalizes amount/fee in its popup) */}
      <div className="card" style={{ padding: 18, marginTop: 14, textAlign: "center" }}>
        <div className="label">
          {dir === "in" ? "Monto a depositar" : "Monto a retirar"} (opcional)
        </div>
        <div
          className="row"
          style={{ justifyContent: "center", alignItems: "baseline", gap: 6, marginTop: 4 }}
        >
          <input
            className="num"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            inputMode="decimal"
            placeholder="0"
            disabled={busy}
            style={{
              width: 160,
              fontSize: 40,
              background: "transparent",
              border: "none",
              color: "var(--text)",
              textAlign: "center",
              outline: "none",
            }}
          />
          <span className="dim num" style={{ fontSize: 18 }}>
            {ANCHOR_ASSET_CODE}
          </span>
        </div>
        <div className="faint" style={{ fontSize: 11, marginTop: 6 }}>
          vía anchor SEP-24 · {ANCHOR_HOME_DOMAIN}
        </div>
      </div>

      {/* status / progress */}
      {(busy || phase === "done") && (
        <div className="card s2" style={{ padding: 16, marginTop: 14 }}>
          <div className="row" style={{ gap: 10 }}>
            <Icon
              name={phase === "done" && tx?.status === "completed" ? "check" : "clock"}
              size={18}
              style={{ color: "var(--accent)", flex: "none" }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {phase === "auth"
                  ? "Autenticando con el anchor…"
                  : phase === "interactive"
                    ? "Abriendo el formulario del anchor…"
                    : tx
                      ? prettyStatus(tx.status)
                      : "Esperando al anchor…"}
              </div>
              {isSafeAnchorUrl(tx?.more_info_url) && (
                <a
                  className="faint"
                  style={{ fontSize: 12, color: "var(--accent)" }}
                  href={tx!.more_info_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ver detalles del anchor →
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* honest gate for passkey (C…) wallets */}
      {!canCash && (
        <div className="card s2" style={{ padding: 16, marginTop: 14 }}>
          <div className="row" style={{ gap: 10, alignItems: "flex-start" }}>
            <Icon name="info" size={18} style={{ color: "var(--accent)", flex: "none" }} />
            <p className="dim" style={{ fontSize: 13, margin: 0, lineHeight: 1.5 }}>
              {!signer
                ? "Vuelve a iniciar sesión para usar el cash in/out (necesitamos firmar la autenticación del anchor)."
                : "El cash in/out usa SEP-10, que autentica cuentas Stellar clásicas. Tu billetera Face ID es un contrato (C…) — el soporte vía SEP-45 llegará pronto. Conecta o importa una cuenta clásica para usarlo ahora."}
            </p>
          </div>
        </div>
      )}

      {err && (
        <p
          className="mono"
          style={{ fontSize: 11.5, color: "var(--negative)", textAlign: "center", marginTop: 12 }}
        >
          {err}
        </p>
      )}

      <div style={{ flex: 1 }} />

      <button
        className="btn btn-primary"
        style={{ marginTop: 16 }}
        disabled={!canCash || busy}
        onClick={start}
      >
        {busy ? "Procesando…" : dir === "in" ? "Depositar con el anchor" : "Retirar con el anchor"}
      </button>
      <p
        className="faint"
        style={{ fontSize: 11, marginTop: 10, textAlign: "center", lineHeight: 1.4 }}
      >
        Flujo SEP-24 real contra un anchor de testnet (activo de prueba). En mainnet se cambia por
        un anchor regulado.
      </p>
    </div>
  );
}

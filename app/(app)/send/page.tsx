"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Icon } from "@/components/kova";
import { sendUsdc, isValidStellarAddress } from "@/lib/stellar/send";

export default function SendPage() {
  const router = useRouter();
  const signer = useStore((s) => s.signer);
  const [addr, setAddr] = useState("");
  const [amt, setAmt] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const n = parseFloat(amt) || 0;
  const addrOk = isValidStellarAddress(addr);
  const canSend = addrOk && n > 0;

  const send = async () => {
    setErr("");
    if (!signer) {
      setErr("Vuelve a iniciar sesión para firmar el envío.");
      return;
    }
    setBusy(true);
    try {
      await sendUsdc(signer, addr, n);
      setDone(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo enviar.");
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
        <h1 style={{ fontSize: 26 }}>Envío iniciado</h1>
        <p className="dim" style={{ fontSize: 15, lineHeight: 1.5 }}>
          <b className="num">{n.toFixed(2)} USDC</b> en camino a la dirección indicada.
        </p>
        <button className="btn btn-primary" onClick={() => router.push("/home")}>
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="screen pad snd-screen">
      <div className="between snd-head">
        <button className="tok" onClick={() => router.push("/home")} aria-label="Atrás">
          <Icon name="arrowL" size={19} />
        </button>
        <div style={{ fontWeight: 700, fontSize: 16, fontFamily: "var(--font-display)" }}>
          Enviar dinero
        </div>
        <div style={{ width: 40 }} />
      </div>

      <div className="snd-field">
        <div className="label" style={{ marginBottom: 8 }}>
          Dirección Stellar
        </div>
        <input
          className="snd-input"
          placeholder="G… o C…"
          value={addr}
          onChange={(e) => setAddr(e.target.value)}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          style={addr && !addrOk ? { borderColor: "var(--negative)" } : undefined}
        />
        {addr && !addrOk && (
          <div className="faint" style={{ fontSize: 11.5, marginTop: 6, color: "var(--negative)" }}>
            Dirección Stellar inválida
          </div>
        )}
      </div>

      <div className="snd-field">
        <div className="label" style={{ marginBottom: 8 }}>
          Monto
        </div>
        <div className="snd-amount-row">
          <input
            className="num snd-amount"
            placeholder="0"
            value={amt}
            onChange={(e) => setAmt(e.target.value.replace(/[^0-9.]/g, ""))}
            inputMode="decimal"
          />
          <button className="snd-currency" type="button" aria-label="Moneda USDC">
            <span>USDC</span>
            <Icon name="chevDown" size={16} />
          </button>
        </div>
        <div className="snd-usd-equiv faint">≈ ${n.toFixed(2)} USD</div>
      </div>

      <div className="card s2 snd-info">
        <div className="between">
          <span className="dim" style={{ fontSize: 13.5 }}>
            Comisión estimada
          </span>
          <span className="num" style={{ fontSize: 13.5 }}>
            ~$0.0001 USDC
          </span>
        </div>
        <div className="between" style={{ marginTop: 10 }}>
          <span className="dim" style={{ fontSize: 13.5 }}>
            Tiempo estimado
          </span>
          <span style={{ fontSize: 13.5, fontWeight: 600 }}>2–5 segundos</span>
        </div>
      </div>

      {err && (
        <p
          className="mono"
          style={{ fontSize: 11.5, color: "var(--negative)", textAlign: "center", marginBottom: 6 }}
        >
          {err}
        </p>
      )}

      <div className="snd-actions">
        <button className="btn btn-primary" disabled={!canSend || busy} onClick={send}>
          <Icon name="face" size={18} /> {busy ? "Enviando…" : "Enviar"}
        </button>
      </div>
    </div>
  );
}

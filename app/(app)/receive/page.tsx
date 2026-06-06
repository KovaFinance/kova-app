"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useStore } from "@/lib/store";
import { Icon, Logo } from "@/components/kova";
import { faucetInfo, requestFaucet } from "@/lib/faucet/client";

function shortKey(k: string) {
  return k.length > 14 ? `${k.slice(0, 7)}…${k.slice(-6)}` : k;
}

export default function ReceivePage() {
  const router = useRouter();
  const account = useStore((s) => s.account);
  const accruedYield = useStore((s) => s.accruedYield);
  const principal = useStore((s) => s.principal);
  const address = account?.publicKey ?? "";
  const [copied, setCopied] = useState(false);

  // testnet faucet (only shown when the server has one configured)
  const [faucet, setFaucet] = useState<{ enabled: boolean; amount: number }>({
    enabled: false,
    amount: 0,
  });
  const [faucetBusy, setFaucetBusy] = useState(false);
  const [faucetMsg, setFaucetMsg] = useState("");
  useEffect(() => {
    let alive = true;
    faucetInfo().then((f) => alive && setFaucet(f));
    return () => {
      alive = false;
    };
  }, []);

  const drip = async () => {
    if (!address) return;
    setFaucetBusy(true);
    setFaucetMsg("");
    try {
      const { amount } = await requestFaucet(address);
      setFaucetMsg(`✓ Enviamos ${amount} USDC de prueba — llegará en segundos.`);
    } catch (e) {
      setFaucetMsg(e instanceof Error ? e.message : "No se pudo fondear.");
    } finally {
      setFaucetBusy(false);
    }
  };

  const copyAddr = () => {
    try {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  const total = principal + accruedYield;

  return (
    <div className="screen pad rcv-screen">
      <div className="between rcv-head">
        <button className="tok" onClick={() => router.push("/home")} aria-label="Atrás">
          <Icon name="arrowL" size={19} />
        </button>
        <div style={{ fontWeight: 700, fontSize: 16, fontFamily: "var(--font-display)" }}>
          Recibir dinero
        </div>
        <div style={{ width: 40 }} />
      </div>

      <div className="card rcv-balance">
        <div className="rcv-usdc-ico">
          <Icon name="usdc" size={22} sw={2} />
        </div>
        <div>
          <div className="label" style={{ marginBottom: 4 }}>
            Tu saldo total
          </div>
          <div className="num" style={{ fontSize: 28, lineHeight: 1 }}>
            ${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="faint" style={{ fontSize: 12.5, marginTop: 4 }}>
            USDC en Stellar
          </div>
        </div>
      </div>

      <div className="rcv-qr-wrap">
        {address ? (
          <QRCodeSVG
            value={address}
            className="rcv-qr"
            bgColor="#ffffff"
            fgColor="#0A0A0A"
            level="M"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        ) : (
          <div
            style={{ aspectRatio: "1", display: "grid", placeItems: "center", color: "#0A0A0A" }}
          >
            —
          </div>
        )}
        <div className="rcv-qr-logo">
          <Logo size={34} />
        </div>
      </div>

      <div className="card rcv-addr">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="label" style={{ marginBottom: 4 }}>
            Tu dirección Stellar
          </div>
          <div className="mono" style={{ fontSize: 14.5, letterSpacing: "0.02em" }}>
            {shortKey(address)}
          </div>
        </div>
        <button
          className="tok"
          onClick={copyAddr}
          aria-label="Copiar dirección"
          style={{ flex: "none" }}
        >
          <Icon name="copy" size={18} />
        </button>
      </div>
      {copied && <div className="rcv-copied">Dirección copiada</div>}

      <div className="rcv-actions">
        <button className="rcv-act" onClick={copyAddr}>
          <Icon name="copy" size={18} />
          <span>Copiar</span>
        </button>
        <button
          className="rcv-act"
          onClick={() => {
            if (navigator.share) void navigator.share({ text: address });
            else copyAddr();
          }}
        >
          <Icon name="share" size={18} />
          <span>Compartir</span>
        </button>
        <button className="rcv-act" onClick={() => router.push("/deposit")}>
          <Icon name="plus" size={18} />
          <span>Aportar</span>
        </button>
      </div>

      {/* testnet faucet — get test USDC so the wallet is actually usable end-to-end */}
      {faucet.enabled && (
        <div className="card s2" style={{ padding: 16, marginBottom: 8 }}>
          <div className="row" style={{ gap: 10, alignItems: "flex-start" }}>
            <Icon name="gift" size={18} style={{ color: "var(--accent)", flex: "none" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Fondea con USDC de prueba</div>
              <p className="faint" style={{ fontSize: 12, margin: "2px 0 0", lineHeight: 1.4 }}>
                Solo testnet — recibe {faucet.amount} USDC de prueba para usar la app.
              </p>
            </div>
          </div>
          <button
            className="btn btn-primary"
            style={{ marginTop: 12 }}
            disabled={faucetBusy}
            onClick={drip}
          >
            {faucetBusy ? "Enviando…" : `Recibir ${faucet.amount} USDC de prueba`}
          </button>
          {faucetMsg && (
            <p
              className="mono"
              style={{
                fontSize: 11.5,
                color: "var(--text-dim)",
                margin: "10px 0 0",
                textAlign: "center",
              }}
            >
              {faucetMsg}
            </p>
          )}
        </div>
      )}

      <div className="rcv-meta row" style={{ gap: 10 }}>
        <div className="card s2 rcv-meta-card">
          <div className="label">Red</div>
          <div className="row" style={{ gap: 8, marginTop: 6 }}>
            <span className="rcv-stellar-dot">✦</span>
            <span style={{ fontWeight: 600, fontSize: 14.5 }}>Stellar</span>
          </div>
        </div>
        <div className="card s2 rcv-meta-card">
          <div className="label">Activo</div>
          <div className="row" style={{ gap: 8, marginTop: 6 }}>
            <span className="rcv-usdc-sm">
              <Icon name="usdc" size={16} sw={2} />
            </span>
            <span style={{ fontWeight: 600, fontSize: 14.5 }}>USDC</span>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Icon, Logo } from "@/components/kova";
import { createPasskeyWallet, connectExistingWallet, importSecretKey } from "@/lib/stellar/passkey";

const FOOTER = "kova.app · stellar testnet · USDC";

export default function AuthPage() {
  const router = useRouter();
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const onboarded = useStore((s) => s.onboarded);
  const signIn = useStore((s) => s.signIn);

  const [busy, setBusy] = useState<null | string>(null);
  const [advOpen, setAdvOpen] = useState(false);
  const [secret, setSecret] = useState("");
  const [err, setErr] = useState("");

  const go = () => router.replace(onboarded ? "/home" : "/onboarding");

  async function createFaceId() {
    setBusy("faceid");
    setErr("");
    try {
      const signer = await createPasskeyWallet("Kova");
      signIn(signer);
      setTimeout(go, 600);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
      setBusy(null);
    }
  }

  async function connect() {
    setBusy("wallet");
    setErr("");
    try {
      const signer = await connectExistingWallet();
      signIn(signer);
      go();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
      setBusy(null);
    }
  }

  function importKey() {
    setErr("");
    try {
      const signer = importSecretKey(secret);
      signIn(signer);
      go();
    } catch {
      setErr(lang === "es" ? "Llave inválida" : "Invalid key");
    }
  }

  return (
    <main className="kova-root">
      <div className="screen pad" style={{ display: "flex", flexDirection: "column" }}>
        {/* lang toggle */}
        <div className="between" style={{ padding: "10px 0 4px" }}>
          <Logo size={26} />
          <div className="row" style={{ gap: 6 }}>
            <button className={"chip" + (lang === "es" ? " on" : "")} onClick={() => setLang("es")}>
              ES
            </button>
            <button className={"chip" + (lang === "en" ? " on" : "")} onClick={() => setLang("en")}>
              EN
            </button>
          </div>
        </div>

        <div
          className="au-rise"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            padding: "24px 0 8px",
          }}
        >
          <Logo size={48} />
          <div
            className="brand-name"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: "var(--display-weight)",
              fontSize: 26,
            }}
          >
            kova
          </div>
        </div>
        <h1 style={{ fontSize: 24, textAlign: "center", marginTop: 6 }}>
          Empieza a ahorrar
          <br />
          en segundos
        </h1>

        <div style={{ flex: 1, minHeight: 18 }} />

        {/* primary: Face ID */}
        <button
          className="card"
          style={{ padding: 18, textAlign: "left", position: "relative" }}
          onClick={createFaceId}
          disabled={!!busy}
        >
          <span
            className="chip on"
            style={{ position: "absolute", top: 14, right: 14, fontSize: 10.5 }}
          >
            Recomendado
          </span>
          <div className="row" style={{ gap: 14 }}>
            <div
              className="tok"
              style={{
                width: 48,
                height: 48,
                background: "var(--accent)",
                color: "var(--on-accent)",
                borderColor: "transparent",
              }}
            >
              <Icon name="face" size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 17 }}>
                {busy === "faceid" ? "Creando…" : "Crear cuenta con Face ID"}
              </div>
              <div className="dim" style={{ fontSize: 13, marginTop: 2 }}>
                Sin banco, sin frase, sin gas
              </div>
            </div>
          </div>
          <p className="dim" style={{ fontSize: 13, lineHeight: 1.45, margin: "14px 0 0" }}>
            Tu cuenta está protegida por Face ID —{" "}
            <b style={{ color: "var(--text)" }}>sin frase que perder.</b>
          </p>
        </button>

        {/* secondary: connect wallet */}
        <button
          className="card s2 row"
          style={{ padding: 16, gap: 14, marginTop: 12 }}
          onClick={connect}
          disabled={!!busy}
        >
          <div className="tok">
            <Icon name="key" size={20} />
          </div>
          <div style={{ flex: 1, textAlign: "left" }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              {busy === "wallet" ? "Conectando…" : "Conectar billetera"}
            </div>
            <div className="faint" style={{ fontSize: 12.5 }}>
              ¿Ya usas Stellar? Freighter · Albedo · xBull
            </div>
          </div>
          <Icon name="arrowR" size={18} style={{ color: "var(--text-faint)" }} />
        </button>

        {/* advanced import */}
        <button className="sp-link" style={{ marginTop: 14 }} onClick={() => setAdvOpen((v) => !v)}>
          Opciones avanzadas
        </button>
        {advOpen && (
          <div className="card s2" style={{ padding: 14, marginTop: 8 }}>
            <div className="label" style={{ marginBottom: 8 }}>
              Importar llave secreta (S…)
            </div>
            <input
              className="snd-input"
              placeholder="S…"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
            />
            <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={importKey}>
              Importar
            </button>
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
        <div className="mono faint" style={{ fontSize: 10.5, textAlign: "center", marginTop: 16 }}>
          {FOOTER}
        </div>
      </div>

      {busy === "faceid" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(10,10,10,0.92)",
            display: "grid",
            placeItems: "center",
            zIndex: 90,
          }}
        >
          <div style={{ textAlign: "center", color: "var(--accent)" }}>
            <Icon name="face" size={72} sw={1.4} />
            <div className="label" style={{ marginTop: 14, color: "var(--text-dim)" }}>
              Confirma con Face ID
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo, Chip, Sheet, FaceIdBadge } from "@/components/ui";
import { useStore } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { createPasskeyWallet, connectExistingWallet, importSecretKey } from "@/lib/stellar/passkey";

export default function AuthPage() {
  const router = useRouter();
  const lang = useStore((s) => s.lang);
  const onboarded = useStore((s) => s.onboarded);
  const signIn = useStore((s) => s.signIn);
  const setLang = useStore((s) => s.setLang);

  const [busy, setBusy] = useState<null | string>(null);
  const [advOpen, setAdvOpen] = useState(false);
  const [secret, setSecret] = useState("");
  const [err, setErr] = useState("");

  const go = () => router.replace(onboarded ? "/home" : "/onboarding");

  async function createFaceId() {
    setBusy("faceid");
    try {
      const signer = await createPasskeyWallet("Kova");
      signIn(signer);
      setTimeout(go, 700);
    } catch (e: any) {
      setErr(e.message ?? "error");
      setBusy(null);
    }
  }

  async function connect() {
    setBusy("wallet");
    try {
      const signer = await connectExistingWallet();
      signIn(signer);
      go();
    } catch (e: any) {
      setErr(e.message ?? "error");
      setBusy(null);
    }
  }

  function importKey() {
    try {
      const signer = importSecretKey(secret);
      signIn(signer);
      go();
    } catch {
      setErr(lang === "es" ? "Llave inválida" : "Invalid key");
    }
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        justifyContent: "center",
        background: "var(--paper)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          padding: 24,
          borderLeft: "3px solid #111",
          borderRight: "3px solid #111",
        }}
      >
        {/* lang toggle */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Logo size={26} />
          <div style={{ display: "flex", gap: 6 }}>
            <button
              className="chip"
              style={{ background: lang === "es" ? "var(--sun)" : "#fff" }}
              onClick={() => setLang("es")}
            >
              ES
            </button>
            <button
              className="chip"
              style={{ background: lang === "en" ? "var(--sun)" : "#fff" }}
              onClick={() => setLang("en")}
            >
              EN
            </button>
          </div>
        </div>

        {/* hero */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <h1 className="display" style={{ fontSize: 52, lineHeight: 0.9 }}>
            {tr(lang, "tagline.main")}
          </h1>
          <p style={{ fontSize: 15, color: "#444" }}>{tr(lang, "tagline.sub")}</p>
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            <Chip variant="green">{lang === "es" ? "Sin banco" : "Unbanked"}</Chip>
            <Chip variant="sun">{lang === "es" ? "En dólares" : "In dollars"}</Chip>
            <Chip variant="coral">{lang === "es" ? "Solo tuyo" : "Non-custodial"}</Chip>
          </div>
        </div>

        {/* actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 8 }}>
          <button className="btn btn-primary" onClick={createFaceId} disabled={!!busy}>
            {busy === "faceid" ? "…" : tr(lang, "auth.create")}
          </button>
          <p
            className="mono"
            style={{ fontSize: 11, color: "#777", textAlign: "center", margin: "-4px 0 4px" }}
          >
            {tr(lang, "auth.createSub")}
          </p>

          <button className="btn" onClick={connect} disabled={!!busy}>
            {busy === "wallet" ? "…" : tr(lang, "auth.connect")}
          </button>

          <button
            className="btn btn-ghost"
            style={{ borderStyle: "dashed" }}
            onClick={() => setAdvOpen(true)}
          >
            {tr(lang, "auth.advanced")}
          </button>

          {err && (
            <p
              className="mono"
              style={{ fontSize: 11, color: "var(--coral)", textAlign: "center" }}
            >
              {err}
            </p>
          )}
          <p className="mono" style={{ fontSize: 10, color: "#aaa", textAlign: "center" }}>
            {tr(lang, "tagline.pitch")} · {tr(lang, "common.testnet")}
          </p>
        </div>
      </div>

      <Sheet open={advOpen} onClose={() => setAdvOpen(false)}>
        <h2 className="display" style={{ fontSize: 22, marginBottom: 8 }}>
          {tr(lang, "auth.advanced")}
        </h2>
        <p className="mono" style={{ fontSize: 12, color: "#777", marginBottom: 12 }}>
          {lang === "es"
            ? "Importa una llave secreta de Stellar (S…). Solo para usuarios avanzados."
            : "Import a Stellar secret key (S…). Advanced users only."}
        </p>
        <input
          className="field mono"
          placeholder="S…"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
        />
        <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={importKey}>
          {lang === "es" ? "Importar" : "Import"}
        </button>
      </Sheet>

      {busy === "faceid" && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(255,210,63,0.96)",
            display: "grid",
            placeItems: "center",
            zIndex: 90,
          }}
        >
          <FaceIdBadge label={tr(lang, "common.faceid")} />
        </div>
      )}
    </main>
  );
}

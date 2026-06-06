"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Icon, Logo } from "@/components/kova";
import { createPasskeyWallet, connectPasskeyWallet } from "@/lib/stellar/passkey";

const FOOTER = "kova.app · stellar testnet · USDC";

export default function AuthPage() {
  const router = useRouter();
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const onboarded = useStore((s) => s.onboarded);
  const account = useStore((s) => s.account);
  const signIn = useStore((s) => s.signIn);

  // A returning passkey user is detected from the persisted `account` (its signer is
  // in-memory only, so they still re-auth with Face ID — we just know which CTA to show).
  const returning = account?.method === "passkey";

  const [busy, setBusy] = useState<null | "create" | "signin">(null);
  const [err, setErr] = useState("");
  const t = (es: string, en: string) => (lang === "es" ? es : en);

  const go = () => router.replace(onboarded ? "/home" : "/onboarding");

  // Both flows run a Face ID ceremony. `create` registers a new passkey + smart wallet;
  // `signin` discovers the existing passkey and resolves its wallet from our backend.
  async function auth(kind: "create" | "signin") {
    setBusy(kind);
    setErr("");
    try {
      const signer =
        kind === "create" ? await createPasskeyWallet("Kova") : await connectPasskeyWallet();
      signIn(signer);
      setTimeout(go, 500);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
      setBusy(null);
    }
  }

  // Primary CTA follows the detected state; the link offers the opposite path as an escape hatch.
  const primary = returning ? "signin" : "create";
  const alternate = returning ? "create" : "signin";

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
          {returning ? (
            t("Bienvenido de vuelta", "Welcome back")
          ) : (
            <>
              {t("Empieza a ahorrar", "Start saving")}
              <br />
              {t("en segundos", "in seconds")}
            </>
          )}
        </h1>

        <div style={{ flex: 1, minHeight: 18 }} />

        {/* primary: Face ID — sign in for returning users, create for new ones */}
        <button
          className="card"
          style={{ padding: 18, textAlign: "left", position: "relative" }}
          onClick={() => auth(primary)}
          disabled={!!busy}
        >
          {!returning && (
            <span
              className="chip on"
              style={{ position: "absolute", top: 14, right: 14, fontSize: 10.5 }}
            >
              {t("Recomendado", "Recommended")}
            </span>
          )}
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
                {busy === primary
                  ? returning
                    ? t("Entrando…", "Signing in…")
                    : t("Creando…", "Creating…")
                  : returning
                    ? t("Iniciar sesión con Face ID", "Sign in with Face ID")
                    : t("Crear cuenta con Face ID", "Create account with Face ID")}
              </div>
              <div className="dim" style={{ fontSize: 13, marginTop: 2 }}>
                {returning
                  ? t("Toca para entrar con Face ID", "Tap to unlock with Face ID")
                  : t("Sin banco, sin frase, sin gas", "No bank, no seed phrase, no gas")}
              </div>
            </div>
          </div>
          <p className="dim" style={{ fontSize: 13, lineHeight: 1.45, margin: "14px 0 0" }}>
            {returning ? (
              t(
                "Tu cuenta vive en este dispositivo, protegida por Face ID.",
                "Your account lives on this device, protected by Face ID."
              )
            ) : (
              <>
                {t(
                  "Tu cuenta está protegida por Face ID —",
                  "Your account is protected by Face ID —"
                )}{" "}
                <b style={{ color: "var(--text)" }}>
                  {t("sin frase que perder.", "no seed phrase to lose.")}
                </b>
              </>
            )}
          </p>
        </button>

        {/* alternate path: the opposite action, for a wiped device or a fresh account */}
        <button
          className="sp-link"
          style={{ marginTop: 16, textAlign: "center" }}
          onClick={() => auth(alternate)}
          disabled={!!busy}
        >
          {returning
            ? t("Crear una cuenta nueva", "Create a new account")
            : t("Ya tengo una cuenta", "I already have an account")}
        </button>

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

      {!!busy && (
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
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              color: "var(--accent)",
            }}
          >
            <Icon name="face" size={72} sw={1.4} style={{ display: "block" }} />
            <div className="label" style={{ marginTop: 14, color: "var(--text-dim)" }}>
              {t("Confirma con Face ID", "Confirm with Face ID")}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

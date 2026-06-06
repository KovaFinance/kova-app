"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Icon } from "@/components/kova";
import { tr } from "@/lib/i18n";
import { addRecoveryPasskey, enableAutoSplit } from "@/lib/stellar/passkey";
import { fetchProfile, saveProfile } from "@/lib/profile/client";

const PRESETS = [
  { pct: 5, bps: 500 },
  { pct: 10, bps: 1000 },
  { pct: 15, bps: 1500 },
  { pct: 20, bps: 2000 },
];

function shortKey(k: string) {
  return k.length > 12 ? `${k.slice(0, 6)}…${k.slice(-5)}` : k;
}

export default function SettingsPage() {
  const router = useRouter();
  const name = useStore((s) => s.name);
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const savingsBps = useStore((s) => s.savingsBps);
  const setRate = useStore((s) => s.setRate);
  const account = useStore((s) => s.account);
  const signOut = useStore((s) => s.signOut);

  const initial = (name || "K").charAt(0).toUpperCase();
  const isPasskey = account?.method === "passkey";

  // recovery passkey + autonomous auto-save (passkey wallets only)
  const [recoverBusy, setRecoverBusy] = useState(false);
  const [recoverMsg, setRecoverMsg] = useState("");
  const [autoSplit, setAutoSplit] = useState(false);
  const [autoBusy, setAutoBusy] = useState(false);
  const [autoMsg, setAutoMsg] = useState("");

  useEffect(() => {
    if (!account) return;
    fetchProfile(account.publicKey).then((p) => setAutoSplit(Boolean(p?.auto_split)));
  }, [account]);

  const addRecovery = async () => {
    setRecoverBusy(true);
    setRecoverMsg("");
    try {
      await addRecoveryPasskey();
      setRecoverMsg("✓ Dispositivo de recuperación agregado.");
    } catch (e) {
      setRecoverMsg(e instanceof Error ? e.message : "No se pudo agregar.");
    } finally {
      setRecoverBusy(false);
    }
  };

  const toggleAutoSplit = async () => {
    if (!account) return;
    setAutoBusy(true);
    setAutoMsg("");
    try {
      if (!autoSplit) {
        const r = await fetch("/api/keeper/pubkey");
        const { publicKey } = await r.json();
        if (!publicKey) throw new Error("El keeper no está configurado.");
        await enableAutoSplit(publicKey); // delegate the keeper signer (Face ID)
        await saveProfile({ contractId: account.publicKey, autoSplit: true });
        setAutoSplit(true);
        setAutoMsg("✓ Ahorro automático activado.");
      } else {
        await saveProfile({ contractId: account.publicKey, autoSplit: false });
        setAutoSplit(false);
        setAutoMsg("Ahorro automático desactivado.");
      }
    } catch (e) {
      setAutoMsg(e instanceof Error ? e.message : "No se pudo cambiar.");
    } finally {
      setAutoBusy(false);
    }
  };

  const logout = () => {
    signOut();
    router.replace("/auth");
  };

  return (
    <div className="screen pad pf-screen">
      <div className="pf-top">
        <div style={{ width: 40 }} />
        <button className="tok" aria-label="Ajustes">
          <Icon name="settings" size={19} />
        </button>
      </div>

      <div className="pf-user">
        <div className="pf-avatar">{initial}</div>
        <div className="pf-name">{name || "Mi cuenta"}</div>
        <div className="pf-sub">{account ? shortKey(account.publicKey) : "Mi cuenta"}</div>
      </div>

      {/* savings rate */}
      <div className="label" style={{ margin: "4px 0 8px" }}>
        {tr(lang, "set.rate")}
      </div>
      <div className="card s2" style={{ padding: 16 }}>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          {PRESETS.map((p) => (
            <button
              key={p.bps}
              className={"chip" + (savingsBps === p.bps ? " on" : "")}
              onClick={() => setRate(p.bps)}
            >
              {p.pct}%
            </button>
          ))}
        </div>
        <p className="faint" style={{ fontSize: 12, margin: "12px 0 0", lineHeight: 1.45 }}>
          Cada ingreso se divide automáticamente al porcentaje que elijas.
        </p>
      </div>

      {/* language */}
      <div className="label" style={{ margin: "18px 0 8px" }}>
        {tr(lang, "set.lang")}
      </div>
      <div className="card s2" style={{ padding: 16 }}>
        <div className="row" style={{ gap: 8 }}>
          <button className={"chip" + (lang === "es" ? " on" : "")} onClick={() => setLang("es")}>
            Español
          </button>
          <button className={"chip" + (lang === "en" ? " on" : "")} onClick={() => setLang("en")}>
            English
          </button>
        </div>
      </div>

      {/* security / recovery — honest passkey stance */}
      <div className="label" style={{ margin: "18px 0 8px" }}>
        {tr(lang, "set.recovery")}
      </div>
      <div className="card s2" style={{ padding: 16 }}>
        <div className="row" style={{ gap: 10, alignItems: "flex-start" }}>
          <Icon name="shieldcheck" size={20} style={{ color: "var(--accent)", flex: "none" }} />
          <p className="dim" style={{ fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            {isPasskey ? tr(lang, "set.noExport") : tr(lang, "set.exportWarn")}
          </p>
        </div>
      </div>

      {/* recovery passkey + autonomous auto-save — passkey wallets only */}
      {isPasskey && (
        <>
          <div className="label" style={{ margin: "18px 0 8px" }}>
            Recuperación · multi-dispositivo
          </div>
          <div className="card s2" style={{ padding: 16 }}>
            <p className="dim" style={{ fontSize: 13, margin: "0 0 12px", lineHeight: 1.5 }}>
              Agrega un segundo dispositivo (Face ID) como respaldo — si pierdes uno, no pierdes tu
              wallet.
            </p>
            <button className="btn btn-secondary" disabled={recoverBusy} onClick={addRecovery}>
              <Icon name="key" size={16} /> {recoverBusy ? "Agregando…" : "Agregar dispositivo"}
            </button>
            {recoverMsg && (
              <p
                className="mono"
                style={{
                  fontSize: 11.5,
                  color: "var(--text-dim)",
                  margin: "10px 0 0",
                  textAlign: "center",
                }}
              >
                {recoverMsg}
              </p>
            )}
          </div>

          <div className="label" style={{ margin: "18px 0 8px" }}>
            Ahorro automático
          </div>
          <button
            className="card s2"
            style={{ padding: 16, width: "100%", textAlign: "left" }}
            disabled={autoBusy}
            onClick={toggleAutoSplit}
          >
            <div className="between">
              <div style={{ flex: 1, paddingRight: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Guardar mis ingresos solo</div>
                <p className="faint" style={{ fontSize: 12, margin: "2px 0 0", lineHeight: 1.4 }}>
                  Autoriza al keeper (solo la bóveda) para apartar tu % en cada ingreso, sin tocar
                  nada.
                </p>
              </div>
              <span
                aria-hidden="true"
                style={{
                  width: 44,
                  height: 26,
                  borderRadius: 999,
                  flex: "none",
                  background: autoSplit ? "var(--accent)" : "var(--surface-2)",
                  border: "1px solid var(--border-strong)",
                  position: "relative",
                  transition: "background .15s",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 2,
                    left: autoSplit ? 20 : 2,
                    width: 20,
                    height: 20,
                    borderRadius: 999,
                    background: autoSplit ? "var(--on-accent)" : "var(--text-dim)",
                    transition: "left .15s",
                  }}
                />
              </span>
            </div>
          </button>
          {autoMsg && (
            <p
              className="mono"
              style={{
                fontSize: 11.5,
                color: "var(--text-dim)",
                margin: "8px 0 0",
                textAlign: "center",
              }}
            >
              {autoMsg}
            </p>
          )}
        </>
      )}

      {/* quick links */}
      <div className="card pf-menu" style={{ marginTop: 18 }}>
        <button
          className="pf-row pf-row--border"
          onClick={() => router.push("/receive")}
          type="button"
        >
          <span className="pf-row-ico">
            <Icon name="wallet" size={20} />
          </span>
          <span className="pf-row-text">
            <span className="pf-row-title">Mi wallet</span>
            <span className="pf-row-sub">Ver dirección y recibir</span>
          </span>
          <Icon name="arrowR" size={16} style={{ color: "var(--text-faint)", flex: "none" }} />
        </button>
        <button className="pf-row" onClick={() => router.push("/activity")} type="button">
          <span className="pf-row-ico">
            <Icon name="clock" size={20} />
          </span>
          <span className="pf-row-text">
            <span className="pf-row-title">Actividad</span>
            <span className="pf-row-sub">Historial de movimientos</span>
          </span>
          <Icon name="arrowR" size={16} style={{ color: "var(--text-faint)", flex: "none" }} />
        </button>
      </div>

      <button className="card pf-logout" onClick={logout} type="button">
        <Icon name="logout" size={18} />
        <span>{tr(lang, "set.signout")}</span>
      </button>

      <div className="mono faint" style={{ fontSize: 10.5, textAlign: "center", marginTop: 16 }}>
        kova.app · stellar testnet · USDC
      </div>
    </div>
  );
}

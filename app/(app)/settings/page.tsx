"use client";

import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Icon } from "@/components/kova";
import { tr } from "@/lib/i18n";

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

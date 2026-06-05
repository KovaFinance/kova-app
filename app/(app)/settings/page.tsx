"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Chip, Sheet, FaceIdBadge } from "@/components/ui";
import { useStore } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { pct } from "@/lib/format";

export default function SettingsPage() {
  const router = useRouter();
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const bps = useStore((s) => s.savingsBps);
  const setRate = useStore((s) => s.setRate);
  const account = useStore((s) => s.account);
  const signOut = useStore((s) => s.signOut);

  const [advOpen, setAdvOpen] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [revealed, setRevealed] = useState<string | null>(null);

  function reveal() {
    setRevealing(true);
    // Production: passkey/smart-wallet keys are non-exportable; there is no seed phrase.
    setTimeout(() => {
      setRevealing(false);
      setRevealed(tr(lang, "set.noExport"));
    }, 1000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h1 className="display" style={{ fontSize: 30 }}>
        {tr(lang, "set.title")}
      </h1>

      {/* savings % */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span className="label">{tr(lang, "set.rate")}</span>
          <span className="num" style={{ fontSize: 22 }}>
            {pct(bps)}
          </span>
        </div>
        <input
          className="neo"
          style={{ marginTop: 12 }}
          type="range"
          min={500}
          max={3000}
          step={500}
          value={bps}
          onChange={(e) => setRate(Number(e.target.value))}
        />
      </div>

      {/* language */}
      <div
        className="card"
        style={{
          padding: 18,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span className="label">{tr(lang, "set.lang")}</span>
        <div style={{ display: "flex", gap: 8 }}>
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

      {/* account */}
      <div className="card" style={{ padding: 18 }}>
        <div className="label">{tr(lang, "set.account")}</div>
        <div
          className="mono"
          style={{ fontSize: 11, color: "#555", marginTop: 8, wordBreak: "break-all" }}
        >
          {account?.publicKey}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <Chip variant="green">{account?.label ?? account?.method}</Chip>
          <Chip>{tr(lang, "set.recovery")}</Chip>
        </div>
      </div>

      {/* advanced */}
      <button
        className="btn btn-ghost"
        style={{ borderStyle: "dashed" }}
        onClick={() => setAdvOpen(true)}
      >
        {tr(lang, "set.export")}
      </button>

      <button
        className="btn btn-coral"
        onClick={() => {
          signOut();
          router.replace("/auth");
        }}
      >
        {tr(lang, "set.signout")}
      </button>

      <p className="mono" style={{ fontSize: 10, color: "#aaa", textAlign: "center" }}>
        kova.app · {tr(lang, "common.testnet")} · USDC
      </p>

      <Sheet
        open={advOpen}
        onClose={() => {
          if (!revealing) {
            setAdvOpen(false);
            setRevealed(null);
          }
        }}
      >
        {revealing ? (
          <FaceIdBadge label={tr(lang, "common.faceid")} />
        ) : revealed ? (
          <>
            <h2 className="display" style={{ fontSize: 20, marginBottom: 8 }}>
              {tr(lang, "set.reveal")}
            </h2>
            <div
              className="field mono"
              style={{ fontSize: 12, wordBreak: "break-all", background: "#fff8ee" }}
            >
              {revealed}
            </div>
            <p className="mono" style={{ fontSize: 11, color: "var(--coral)", marginTop: 10 }}>
              {tr(lang, "set.exportWarn")}
            </p>
            <button
              className="btn"
              style={{ marginTop: 14 }}
              onClick={() => {
                setAdvOpen(false);
                setRevealed(null);
              }}
            >
              OK
            </button>
          </>
        ) : (
          <>
            <h2 className="display" style={{ fontSize: 22, marginBottom: 8 }}>
              {tr(lang, "set.export")}
            </h2>
            <p className="mono" style={{ fontSize: 12, color: "#777", marginBottom: 16 }}>
              {tr(lang, "set.exportWarn")}
            </p>
            <button className="btn btn-primary" onClick={reveal}>
              {tr(lang, "set.reveal")}
            </button>
            <button
              className="btn btn-ghost"
              style={{ marginTop: 8 }}
              onClick={() => setAdvOpen(false)}
            >
              {tr(lang, "common.cancel")}
            </button>
          </>
        )}
      </Sheet>
    </div>
  );
}

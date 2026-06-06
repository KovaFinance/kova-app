"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Icon, StepDots } from "@/components/kova";

function PctRadio({ on }: { on: boolean }) {
  return (
    <span className="pct-radio" data-on={on ? "true" : "false"}>
      {on && <span className="pct-radio-dot" />}
    </span>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const storeName = useStore((s) => s.name);
  const setName = useStore((s) => s.setName);
  const savingsBps = useStore((s) => s.savingsBps);
  const setRate = useStore((s) => s.setRate);
  const setOnboarded = useStore((s) => s.setOnboarded);

  const [step, setStep] = useState<"name" | "plan">("name");
  const [name, setNameLocal] = useState(storeName || "");
  const [pct, setPct] = useState(Math.round(savingsBps / 100) || 15);
  const [custom, setCustom] = useState(![5, 10, 15, 20].includes(Math.round(savingsBps / 100)));

  const opts = [5, 10, 15, 20];
  const example = Math.round((320 * pct) / 100);

  const finishName = () => {
    if (!name.trim()) return;
    setName(name.trim());
    setStep("plan");
  };

  const finishPlan = () => {
    setRate(pct * 100);
    setOnboarded(true);
    router.replace("/home");
  };

  if (step === "name") {
    return (
      <main className="kova-root">
        <div className="screen pad" style={{ display: "flex", flexDirection: "column" }}>
          <StepDots n={2} i={0} />
          <div
            style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}
          >
            <div style={{ textAlign: "center" }}>
              <h1 style={{ fontSize: 30 }}>Bienvenido</h1>
              <p className="dim" style={{ fontSize: 15.5, marginTop: 10 }}>
                ¿Cómo te llamas?
              </p>
            </div>
            <input
              className="ns-input"
              value={name}
              onChange={(e) => setNameLocal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") finishName();
              }}
              placeholder="Tu nombre"
              aria-label="Tu nombre"
              autoFocus
            />
          </div>
          <button className="btn btn-primary" disabled={!name.trim()} onClick={finishName}>
            Continuar
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="kova-root">
      <div className="screen pad" style={{ display: "flex", flexDirection: "column" }}>
        <StepDots n={2} i={1} />
        <h1 style={{ fontSize: 24, lineHeight: 1.22, marginTop: 8 }}>
          ¿Qué porcentaje de cada
          <br />
          ingreso quieres ahorrar?
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22 }}>
          {opts.map((o) => {
            const active = !custom && pct === o;
            return (
              <button
                key={o}
                className="pct-row"
                data-on={active ? "true" : "false"}
                onClick={() => {
                  setCustom(false);
                  setPct(o);
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 16 }}>{o}%</span>
                <PctRadio on={active} />
              </button>
            );
          })}
          <button
            className="pct-row"
            data-on={custom ? "true" : "false"}
            onClick={() => setCustom(true)}
          >
            <span style={{ fontWeight: 600, fontSize: 16 }}>Personalizado</span>
            <PctRadio on={custom} />
          </button>
        </div>

        {custom && (
          <div className="card s2" style={{ padding: 16, marginTop: 12 }}>
            <div className="between">
              <span className="label" style={{ marginBottom: 0 }}>
                Personalizado
              </span>
              <span className="num" style={{ color: "var(--accent)", fontSize: 18 }}>
                {pct}%
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={40}
              value={pct}
              onChange={(e) => setPct(+e.target.value)}
              style={{ width: "100%", marginTop: 12 }}
            />
          </div>
        )}

        <p className="dim" style={{ fontSize: 13, marginTop: 14, lineHeight: 1.45 }}>
          Cada ingreso se dividirá automáticamente en el porcentaje que elijas.
        </p>

        <div style={{ flex: 1, minHeight: 14 }} />

        <div
          className="card"
          style={{
            padding: 18,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div className="label">Ejemplo</div>
            <div style={{ fontSize: 15, marginTop: 4 }}>
              Te pagan <b className="num">$320</b>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="num" style={{ fontSize: 28, color: "var(--accent)" }}>
              ${example}
            </div>
            <div className="faint" style={{ fontSize: 12 }}>
              se guardan
            </div>
          </div>
        </div>

        <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={finishPlan}>
          Crear mi plan <Icon name="arrowR" size={18} />
        </button>
      </div>
    </main>
  );
}

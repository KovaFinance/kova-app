"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { Icon, Logo, ProjectionChart, chartSeries, fmtUSD, LEVELS } from "@/components/kova";

const RATE = 0.045; // illustrative ~4.5% annual (marketing)
const FOOTER = "kova.app · stellar testnet · USDC";

const PROFILES = [
  { key: "student", label: "Estudiante", monthly: 25 },
  { key: "freelance", label: "Freelance básico", monthly: 75 },
  { key: "gig", label: "Gig worker", monthly: 150 },
  { key: "senior", label: "Freelance senior", monthly: 300 },
];

export default function Landing() {
  const router = useRouter();
  const start = () => router.push("/auth");
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const c = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
      tl.from(".ld-h", { y: 26, opacity: 0, duration: 0.6, stagger: 0.08 }).from(
        ".ld-phone",
        { y: 30, opacity: 0, scale: 0.96, duration: 0.7 },
        "-=0.4"
      );
      gsap.from(".ld-reveal", { y: 24, opacity: 0, duration: 0.6, stagger: 0.04, delay: 0.2 });
    }, rootRef);
    return () => c.revert();
  }, []);

  const pillars = [
    {
      icon: "globe",
      t: "Funciona sin banco",
      es: "Works unbanked",
      d: "Una billetera Stellar y un agente de efectivo: la única rampa que estos usuarios tienen.",
    },
    {
      icon: "dollar",
      t: "En dólares",
      es: "Dollar-denominated",
      d: "Ahorro respaldado en USD — protección frente a la inflación del colón y la región.",
    },
    {
      icon: "shield",
      t: "No-custodial",
      es: "Non-custodial",
      d: "Nadie congela, retiene ni presta tu dinero. Auditable on-chain en tiempo real.",
    },
    {
      icon: "send",
      t: "Nativo de remesas",
      es: "Remittance-native",
      d: "El dinero que llega del exterior se ahorra en el instante en que aterriza.",
    },
  ];
  const steps = [
    {
      n: "01",
      t: "Únete con Face ID",
      d: "Sin banco, sin frase secreta, sin gas. Tu llave es tu rostro — passkey sobre Stellar.",
    },
    {
      n: "02",
      t: "Elige tu porcentaje",
      d: "Guarda 5, 10, 15 o 20% de cada ingreso. Lo separamos al instante, el resto queda disponible.",
    },
    {
      n: "03",
      t: "Míralo crecer",
      d: "Cada pago suma a una posición en dólares que gana ~4.5% al año. Mira tu futuro en 10, 20, 30 años.",
    },
  ];
  const stellar = [
    "Passkeys CAP-51",
    "Gasless CAP-73",
    "Soroban Vault",
    "USDC",
    "USDY / Spiko",
    "SEP-24 Anchors",
    "CCTP V2",
  ];
  const stats = [
    { n: "37%", d: "de la fuerza laboral costarricense trabaja en la informalidad" },
    { n: "45%", d: "de los millennials viven de ingresos variables o por proyecto" },
    { n: "60%+", d: "de los freelancers no tienen ningún ahorro para el retiro" },
  ];
  const habitPoints = [
    {
      icon: "flame",
      t: "Sunk cost saludable",
      d: "Perder una racha de 20 semanas duele más que perder dinero. Vas a guardar aunque sea poco, con tal de no romperla.",
    },
    {
      icon: "user",
      t: "Identidad financiera",
      d: "Pasas de “alguien que quiere ahorrar” a “alguien que ahorra”. El hábito se vuelve parte de quién eres.",
    },
    {
      icon: "chart",
      t: "Progreso visible",
      d: "Ver tu proyección crecer cada semana convierte un futuro abstracto en algo concreto y tangible.",
    },
  ];

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="theme-scope">
      <div ref={rootRef} className="landing">
        {/* header */}
        <header className="ld-head">
          <div className="row" style={{ gap: 10 }}>
            <Logo size={26} />
            <span
              className="brand-name"
              style={{
                fontWeight: "var(--display-weight)",
                fontFamily: "var(--font-display)",
                fontSize: 21,
              }}
            >
              kova
            </span>
          </div>
          <nav className="ld-nav">
            <a onClick={() => scrollTo("ld-problema")}>Problema</a>
            <a onClick={() => scrollTo("ld-producto")}>Producto</a>
            <a onClick={() => scrollTo("ld-como")}>Cómo funciona</a>
            <a onClick={() => scrollTo("ld-stellar")}>Stellar</a>
          </nav>
          <button
            className="btn btn-primary"
            style={{ width: "auto", padding: "11px 20px" }}
            onClick={start}
          >
            Probar la app
          </button>
        </header>

        {/* hero */}
        <section className="ld-hero">
          <div>
            <span className="ld-h chip" style={{ marginBottom: 18 }}>
              <span style={{ width: 7, height: 7, borderRadius: 9, background: "var(--accent)" }} />{" "}
              Construido en Stellar · Tuyo por completo
            </span>
            <h1 className="ld-h ld-title">
              Tu ingreso
              <br />
              se ahorra solo<span style={{ color: "var(--accent)" }}>.</span>
            </h1>
            <p className="ld-h ld-sub">
              En dólares, automáticamente. La capa de ahorro de largo plazo para quienes el sistema
              de pensiones nunca alcanzó.
            </p>
            <div
              className="ld-h"
              style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}
            >
              <button
                className="btn btn-primary"
                style={{ width: "auto", padding: "15px 26px" }}
                onClick={start}
              >
                Empezar ahora <Icon name="arrowR" size={18} />
              </button>
              <button
                className="btn btn-secondary"
                style={{ width: "auto", padding: "15px 26px" }}
                onClick={start}
              >
                Ver el auto-ahorro
              </button>
            </div>
            <div className="ld-h row" style={{ gap: 22, marginTop: 30 }}>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: "var(--display-weight)",
                    fontSize: 16,
                  }}
                >
                  Save first. <span style={{ color: "var(--accent)" }}>Always.</span>
                </div>
                <div className="faint" style={{ fontSize: 12 }}>
                  la promesa de Kova
                </div>
              </div>
              <div className="hr" style={{ width: 1, height: 34 }} />
              <div>
                <div className="num" style={{ fontSize: 22, color: "var(--accent)" }}>
                  ~4.5%
                </div>
                <div className="faint" style={{ fontSize: 12 }}>
                  anual · tesoro tokenizado
                </div>
              </div>
              <div>
                <div className="num" style={{ fontSize: 22 }}>
                  0
                </div>
                <div className="faint" style={{ fontSize: 12 }}>
                  banco · frase · gas
                </div>
              </div>
            </div>
          </div>
          <div className="ld-phone">
            <LandingPhone />
          </div>
        </section>

        {/* problem */}
        <section id="ld-problema" className="ld-section">
          <div className="ld-reveal ld-eyebrow">El problema</div>
          <h2 className="ld-reveal ld-h2">
            El sistema de pensiones se diseñó
            <br />
            para un trabajo que ya no existe.
          </h2>
          <p
            className="ld-reveal dim"
            style={{ fontSize: 16.5, lineHeight: 1.55, maxWidth: 640, marginTop: 16 }}
          >
            Costa Rica tiene un sistema pensado para empleos formales y salarios fijos. Pero hoy una
            parte enorme de la fuerza laboral —freelancers, gig workers, creadores y receptores de
            remesas— genera ingresos que ese sistema simplemente no contempla.
          </p>
          <div className="ld-stats">
            {stats.map((s, i) => (
              <div key={i} className="ld-reveal ld-stat">
                <div className="ld-statnum num">{s.n}</div>
                <div className="ld-statlabel">{s.d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* pillars */}
        <section id="ld-producto" className="ld-section">
          <div className="ld-reveal ld-eyebrow">Por qué necesita Stellar</div>
          <h2 className="ld-reveal ld-h2">
            Cuatro razones que ningún banco
            <br />
            puede ofrecer.
          </h2>
          <div className="ld-pillars">
            {pillars.map((p, i) => (
              <div key={i} className="ld-reveal card ld-pillar">
                <div className="ld-pnum num">0{i + 1}</div>
                <div
                  className="tok"
                  style={{
                    width: 46,
                    height: 46,
                    background: "var(--accent)",
                    color: "var(--on-accent)",
                    borderColor: "transparent",
                  }}
                >
                  <Icon name={p.icon} size={22} />
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 18,
                    marginTop: 14,
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {p.t}
                </div>
                <div className="mono faint" style={{ fontSize: 11, margin: "2px 0 8px" }}>
                  {p.es}
                </div>
                <p className="dim" style={{ fontSize: 13.5, lineHeight: 1.5, margin: 0 }}>
                  {p.d}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* how it works */}
        <section id="ld-como" className="ld-section">
          <div className="ld-reveal ld-eyebrow">Cómo funciona</div>
          <h2 className="ld-reveal ld-h2">Cada pago, un paso adelante.</h2>
          <div className="ld-steps">
            {steps.map((s, i) => (
              <div key={i} className="ld-reveal ld-step">
                <div className="num ld-stepnum">{s.n}</div>
                <div style={{ fontWeight: 700, fontSize: 20, fontFamily: "var(--font-display)" }}>
                  {s.t}
                </div>
                <p className="dim" style={{ fontSize: 14.5, lineHeight: 1.55, marginTop: 8 }}>
                  {s.d}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* habit > amount */}
        <section className="ld-section">
          <div className="ld-reveal ld-eyebrow">Lo que nos hace distintos</div>
          <h2 className="ld-reveal ld-h2">
            Premiamos la constancia,
            <br />
            no el tamaño de tu billetera.
          </h2>
          <div className="ld-habit">
            <div>
              <p
                className="ld-reveal dim"
                style={{ fontSize: 16, lineHeight: 1.6, margin: "0 0 6px" }}
              >
                Un estudiante que guarda $5 cada semana construye el mismo hábito —y a veces más
                patrimonio— que alguien que guarda $200 una vez y lo olvida. Como Duolingo con los
                idiomas, Kova celebra cada semana de ahorro, sin importar el monto.{" "}
                <b style={{ color: "var(--text)" }}>El hábito es el activo.</b>
              </p>
              <div className="ld-habit-points">
                {habitPoints.map((p, i) => (
                  <div key={i} className="ld-reveal ld-habit-point">
                    <div
                      className="tok"
                      style={{
                        background: "var(--accent)",
                        color: "var(--on-accent)",
                        borderColor: "transparent",
                      }}
                    >
                      <Icon name={p.icon} size={18} />
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 15.5,
                          fontFamily: "var(--font-display)",
                        }}
                      >
                        {p.t}
                      </div>
                      <p
                        className="dim"
                        style={{ fontSize: 13.5, lineHeight: 1.5, margin: "2px 0 0" }}
                      >
                        {p.d}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="ld-reveal ld-levels">
              <div className="label" style={{ marginBottom: 4 }}>
                Tu camino de rachas
              </div>
              {LEVELS.map((l, i) => (
                <div key={l.key} className="ld-level">
                  <span className="ld-level-dot" style={{ opacity: 1 - i * 0.14 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5 }}>
                      {l.name}{" "}
                      <span className="faint" style={{ fontWeight: 400 }}>
                        · {l.en}
                      </span>
                    </div>
                    <div className="faint" style={{ fontSize: 12 }}>
                      {l.benefit}
                    </div>
                  </div>
                  <div className="mono faint" style={{ fontSize: 11.5 }}>
                    {l.range}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* interactive projection */}
        <section className="ld-section">
          <div className="ld-reveal ld-eyebrow">Tu futuro, en números</div>
          <h2 className="ld-reveal ld-h2">¿Cuánto podrías tener?</h2>
          <p
            className="ld-reveal dim"
            style={{ fontSize: 16, lineHeight: 1.55, maxWidth: 560, marginTop: 14 }}
          >
            Elige el perfil que más se parece a ti y mira cómo crece tu ahorro con interés
            compuesto, en dólares.
          </p>
          <ProfileProjector />
        </section>

        {/* app preview band */}
        <section className="ld-section">
          <div className="ld-preview card ld-reveal">
            <div style={{ flex: 1 }}>
              <div className="ld-eyebrow">El momento que lo dice todo</div>
              <h2 className="ld-h2" style={{ fontSize: 34 }}>
                Te pagaron $320.
                <br />
                Guardamos $48 — solo.
              </h2>
              <p
                className="dim"
                style={{ fontSize: 15.5, lineHeight: 1.55, maxWidth: 440, marginTop: 14 }}
              >
                En 30 segundos un trabajador recibe un pago, una porción se separa hacia dólares por
                sí sola, y un número que representa su futuro empieza a crecer. Sin banco, sin frase
                secreta.
              </p>
              <button
                className="btn btn-primary"
                style={{ width: "auto", padding: "14px 24px", marginTop: 22 }}
                onClick={start}
              >
                <Icon name="bolt" size={18} /> Empezar ahora
              </button>
            </div>
            <div className="ld-split-demo">
              <div className="label">Cliente Figma te pagó</div>
              <div className="num" style={{ fontSize: 44, margin: "4px 0 14px" }}>
                +$320
              </div>
              <div
                style={{
                  display: "flex",
                  height: 60,
                  borderRadius: "var(--radius)",
                  overflow: "hidden",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    width: "15%",
                    minWidth: 70,
                    background: "var(--accent)",
                    color: "var(--on-accent)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    paddingLeft: 12,
                  }}
                >
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".06em" }}>
                    GUARDADO
                  </span>
                  <span className="num" style={{ fontSize: 18 }}>
                    $48
                  </span>
                </div>
                <div
                  style={{
                    flex: 1,
                    background: "var(--surface-2)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    paddingLeft: 14,
                  }}
                >
                  <span className="label" style={{ fontSize: 9 }}>
                    Disponible
                  </span>
                  <span className="num" style={{ fontSize: 18 }}>
                    $272
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* GROW -> INCOME */}
        <section className="ld-section">
          <div className="ld-reveal ld-eyebrow">Dos fases, una bóveda</div>
          <h2 className="ld-reveal ld-h2">Primero crece. Después, te paga.</h2>
          <div className="ld-phases">
            <div className="ld-reveal card ld-phase">
              <div className="row" style={{ gap: 10 }}>
                <div
                  className="tok"
                  style={{
                    background: "var(--accent)",
                    color: "var(--on-accent)",
                    borderColor: "transparent",
                  }}
                >
                  <Icon name="spark" size={18} />
                </div>
                <span className="label" style={{ marginBottom: 0 }}>
                  Fase 1
                </span>
              </div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 22,
                  marginTop: 12,
                  fontFamily: "var(--font-display)",
                }}
              >
                Crecer
              </div>
              <p className="dim" style={{ fontSize: 14, lineHeight: 1.5, marginTop: 6 }}>
                Cada pago guarda una porción automáticamente. Tu balance y tu proyección crecen — en
                dólares, ganando ~4.5% al año.
              </p>
            </div>
            <div className="ld-reveal ld-phase-arrow">
              <Icon name="arrowR" size={26} />
            </div>
            <div className="ld-reveal card ld-phase">
              <div className="row" style={{ gap: 10 }}>
                <div
                  className="tok"
                  style={{
                    background: "var(--accent-2)",
                    color: "var(--on-accent)",
                    borderColor: "transparent",
                  }}
                >
                  <Icon name="dollar" size={18} />
                </div>
                <span className="label" style={{ marginBottom: 0 }}>
                  Fase 2
                </span>
              </div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 22,
                  marginTop: 12,
                  fontFamily: "var(--font-display)",
                }}
              >
                Ingreso
              </div>
              <p className="dim" style={{ fontSize: 14, lineHeight: 1.5, marginTop: 6 }}>
                Cuando quieras, la bóveda te paga su rendimiento mensual — el principal queda
                intacto y tuyo. <b style={{ color: "var(--text)" }}>$100,000 → ~$375/mes</b>{" "}
                (variable, a tasa actual).
              </p>
            </div>
          </div>
        </section>

        {/* Built on Stellar */}
        <section id="ld-stellar" className="ld-section ld-stellar">
          <div className="ld-reveal" style={{ textAlign: "center" }}>
            <div className="ld-eyebrow" style={{ justifyContent: "center" }}>
              Construido en Stellar · Tuyo por completo
            </div>
            <h2 className="ld-h2" style={{ textAlign: "center" }}>
              Primitivos reales, en producción.
            </h2>
            <p
              className="dim"
              style={{ fontSize: 15, maxWidth: 560, margin: "12px auto 0", lineHeight: 1.55 }}
            >
              Kova compone bloques maduros y auditables — no reinventa nada. Onboarding con
              passkeys, bóveda en Soroban, ahorro en USDC con rendimiento de tesoros tokenizados.
            </p>
            <div
              className="row"
              style={{ flexWrap: "wrap", justifyContent: "center", gap: 10, marginTop: 22 }}
            >
              {stellar.map((s) => (
                <span key={s} className="chip mono" style={{ fontSize: 12 }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* final CTA */}
        <section className="ld-cta ld-reveal">
          <h2 className="ld-h2" style={{ fontSize: "clamp(34px,4vw,52px)" }}>
            Tu futuro empieza hoy.
          </h2>
          <p className="dim" style={{ fontSize: 16, marginTop: 10 }}>
            Save first. Always.
          </p>
          <button
            className="btn btn-primary"
            style={{ width: "auto", padding: "16px 32px", margin: "22px auto 0" }}
            onClick={start}
          >
            Crear mi billetera <Icon name="arrowR" size={18} />
          </button>
          <div className="mono faint" style={{ fontSize: 12, marginTop: 30 }}>
            {FOOTER}
          </div>
        </section>
      </div>
    </div>
  );
}

function ProfileProjector() {
  const [pi, setPi] = useState(2);
  const [years, setYears] = useState(20);
  const p = PROFILES[pi];
  const series = chartSeries(p.monthly, RATE, years);
  const final = series[series.length - 1].value;
  return (
    <div className="ld-projector">
      <div className="ld-proj-panel">
        <div className="ld-proj-chips">
          {PROFILES.map((pr, i) => (
            <button
              key={pr.key}
              className={"chip" + (i === pi ? " on" : "")}
              style={{ fontSize: 13, padding: "10px 14px" }}
              onClick={() => setPi(i)}
            >
              {pr.label}
            </button>
          ))}
        </div>
        <div className="row" style={{ gap: 8, marginTop: 12 }}>
          {[10, 20, 30].map((y) => (
            <button
              key={y}
              className={"chip" + (years === y ? " on" : "")}
              style={{ justifyContent: "center", padding: "9px 16px", fontSize: 13 }}
              onClick={() => setYears(y)}
            >
              {y} años
            </button>
          ))}
        </div>
        <div style={{ marginTop: "auto", paddingTop: 28 }}>
          <div className="label">Guardando ~{fmtUSD(p.monthly)}/mes</div>
          <div
            className="num"
            style={{
              fontSize: "clamp(44px,5.4vw,64px)",
              color: "var(--accent)",
              lineHeight: 1,
              margin: "6px 0 4px",
            }}
          >
            {fmtUSD(final)}
          </div>
          <div className="faint" style={{ fontSize: 13 }}>
            en {years} años · a ~4.5% anual en USD
          </div>
        </div>
      </div>
      <div className="ld-proj-chart">
        <ProjectionChart series={series} animKey={p.key + "_" + years} height={210} showDots />
        <div className="between faint" style={{ fontSize: 11.5, marginTop: 4 }}>
          <span>hoy</span>
          <span>+{years} años</span>
        </div>
      </div>
    </div>
  );
}

function LandingPhone() {
  return (
    <div className="ld-phoneframe">
      <div className="ld-phonescreen">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="row" style={{ gap: 8 }}>
            <Logo size={20} />
            <span
              className="brand-name"
              style={{ fontWeight: "var(--display-weight)", fontSize: 15 }}
            >
              kova
            </span>
          </div>
          <div className="tok" style={{ width: 32, height: 32 }}>
            <Icon name="bell" size={15} />
          </div>
        </div>
        <div style={{ textAlign: "center", padding: "22px 0 10px" }}>
          <div className="label">Ahorro total · USD</div>
          <div className="num" style={{ fontSize: 40, margin: "4px 0" }}>
            $1,284.50
          </div>
          <span className="chip" style={{ color: "var(--positive)", fontSize: 11 }}>
            <Icon name="arrowUp" size={12} /> +$47.20 esta semana
          </span>
        </div>
        <div className="card s2" style={{ padding: 14, marginTop: 6 }}>
          <div className="label">Tu futuro</div>
          <div className="row" style={{ alignItems: "baseline", gap: 6, marginTop: 4 }}>
            <span className="num" style={{ fontSize: 24, color: "var(--accent)" }}>
              ~$74,000
            </span>
            <span className="dim" style={{ fontSize: 12 }}>
              en 20 años
            </span>
          </div>
          <div style={{ marginTop: 8 }}>
            <ProjectionChart
              series={chartSeries(190, RATE, 20)}
              height={92}
              animKey="lp-volt"
              showDots={false}
            />
          </div>
        </div>
        <div className="row" style={{ gap: 10, marginTop: 10 }}>
          <div className="card s2" style={{ flex: 1, padding: 12 }}>
            <div className="row" style={{ gap: 5, color: "var(--accent)" }}>
              <Icon name="flame" size={13} fill="solid" />
              <span className="label" style={{ marginBottom: 0 }}>
                Racha
              </span>
            </div>
            <div style={{ marginTop: 4 }}>
              <span className="num" style={{ fontSize: 16 }}>
                11
              </span>{" "}
              <span className="dim" style={{ fontSize: 11 }}>
                sem · Brote
              </span>
            </div>
          </div>
          <div className="card s2" style={{ flex: 1, padding: 12 }}>
            <div className="label">Este mes</div>
            <div style={{ marginTop: 4 }}>
              <span className="num" style={{ fontSize: 16 }}>
                $312
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

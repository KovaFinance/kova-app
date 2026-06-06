"use client";

// ============================================================
// Kova — desktop landing (pension-first wallet). Ported from the koba-frontend
// prototype (Landing.jsx, commit 6da093f): aurora background + cursor parallax,
// GSAP entrance + scroll reveals, neon hover states. CTAs enter the real app (/auth).
// ============================================================
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { Icon, LogoMark } from "@/components/kova";

const FOOTER = "kova.app · stellar testnet · USDC";

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const problemCards = [
  {
    icon: "chart",
    t: "Ingresos variables",
    d: "Un mes cobrás mucho, al otro poco. Ahorrar “lo que sobra” casi nunca funciona.",
  },
  {
    icon: "user",
    t: "Sin empleo formal",
    d: "Muchas personas trabajan por proyecto y no tienen una ruta clara de pensión.",
  },
  {
    icon: "shield",
    t: "Sin una ruta clara de pensión",
    d: "Saben que deberían ahorrar, pero no saben por dónde empezar ni con qué constancia.",
  },
];

const solutionSteps = [
  { n: "1", t: "Recibís dinero", d: "Un pago de cliente, remesa o venta llega a tu wallet KOVA." },
  {
    n: "2",
    t: "KOVA separa un porcentaje",
    d: "Configurás 5%, 10% o el monto que quieras. Se aparta al instante.",
  },
  {
    n: "3",
    t: "Ves crecer tu pensión",
    d: "El resto queda disponible. Tu sobre de pensión crece sin que lo recuerdes.",
  },
];

const features = [
  {
    icon: "bolt",
    t: "Ahorro automático para pensión",
    d: "Cada ingreso alimenta tu retiro sin fricción.",
  },
  { icon: "user", t: "Porcentaje configurable", d: "Vos definís cuánto apartar en cada pago." },
  { icon: "chart", t: "Progreso visual", d: "Mirá cómo avanza tu meta de pensión en tiempo real." },
  {
    icon: "globe",
    t: "Wallet construida sobre Stellar",
    d: "Pagos rápidos, transparentes y de bajo costo.",
  },
  {
    icon: "gift",
    t: "Sobres de ahorro futuros",
    d: "Emergencia, estudios, casa y metas personales.",
  },
  {
    icon: "laptop",
    t: "Control simple desde el celular",
    d: "Todo en una app clara, pensada para el día a día.",
  },
];

const envelopes = [
  { icon: "shield", t: "Pensión", d: "El foco de hoy.", on: true },
  { icon: "lock", t: "Emergencia", d: "Próximamente." },
  { icon: "note", t: "Estudios", d: "Próximamente." },
  { icon: "home", t: "Casa", d: "Próximamente." },
  { icon: "spark", t: "Metas personales", d: "Próximamente." },
];

export default function Landing() {
  const router = useRouter();
  const start = () => router.push("/auth");
  const rootRef = useRef<HTMLDivElement | null>(null);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  // Anchor handler: prevent the hash jump but keep native link focusability/semantics.
  const navTo = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    scrollTo(id);
  };

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const rm = reducedMotion();

    const ctx = gsap.context(() => {
      if (rm) {
        gsap.set(".ld-h, .ld-hero-card", { opacity: 1, y: 0, scale: 1 });
        return;
      }
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".ld-h", { y: 18, opacity: 0, duration: 0.7, stagger: 0.09 }).from(
        ".ld-hero-card",
        { y: 24, opacity: 0, scale: 0.96, duration: 0.85, ease: "power3.out" },
        "-=0.45"
      );
    }, root);

    const revealEls = root.querySelectorAll<HTMLElement>(".ld-reveal");
    const groupEls = root.querySelectorAll<HTMLElement>("[data-reveal-group]");
    let io: IntersectionObserver | undefined;

    if (rm) {
      gsap.set([...revealEls, ...groupEls], { opacity: 1, y: 0 });
      [...groupEls].forEach((g) => gsap.set(g.children, { opacity: 1, y: 0 }));
    } else {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target as HTMLElement;
            if (el.dataset.revealGroup !== undefined) {
              gsap.from(el.children, {
                y: 16,
                opacity: 0,
                duration: 0.65,
                stagger: 0.1,
                ease: "power3.out",
              });
            } else {
              gsap.from(el, { y: 16, opacity: 0, duration: 0.65, ease: "power3.out" });
            }
            io?.unobserve(el);
          });
        },
        { threshold: 0.12 }
      );
      revealEls.forEach((el) => io!.observe(el));
      groupEls.forEach((el) => io!.observe(el));
    }

    return () => {
      ctx.revert();
      io?.disconnect();
    };
  }, []);

  return (
    <div className="theme-scope">
      <div ref={rootRef} className="landing">
        <LandingBackground containerRef={rootRef} />

        <header className="ld-head">
          <div className="row" style={{ gap: 10 }}>
            <LogoMark size={26} />
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
            {/* Real in-page anchors → keyboard-focusable + announced as links; the handler
                keeps the smooth scroll without a hash jump. */}
            <a href="#ld-problema" onClick={(e) => navTo(e, "ld-problema")}>
              Problema
            </a>
            <a href="#ld-solucion" onClick={(e) => navTo(e, "ld-solucion")}>
              Solución
            </a>
            <a href="#ld-producto" onClick={(e) => navTo(e, "ld-producto")}>
              Producto
            </a>
            <a href="#ld-vision" onClick={(e) => navTo(e, "ld-vision")}>
              Visión
            </a>
          </nav>
          <button className="btn btn-primary ld-head-cta" onClick={start}>
            Empezar
          </button>
        </header>

        {/* 1 — Hero */}
        <section className="ld-hero">
          <div className="ld-hero-l">
            <h1 className="ld-h ld-title">
              Tu pensión empieza
              <br />
              con cada ingreso
              <span style={{ color: "var(--accent)" }}>.</span>
            </h1>
            <p className="ld-h ld-sub">
              KOVA es una wallet de pensión personal que separa automáticamente un porcentaje de
              cada pago que recibís, para que podás construir tu retiro desde hoy.
            </p>
            <div className="ld-h ld-hero-ctas">
              <button className="btn btn-primary" onClick={start}>
                Empezar <Icon name="arrowR" size={18} />
              </button>
              <button className="btn btn-secondary" onClick={() => scrollTo("ld-solucion")}>
                Ver cómo funciona
              </button>
            </div>
            <p className="ld-h ld-trust">
              Construida sobre Stellar para pagos rápidos, transparentes y de bajo costo.
            </p>
          </div>
          <div className="ld-hero-r">
            <HeroWalletCard />
          </div>
        </section>

        {/* 2 — Problem */}
        <section id="ld-problema" className="ld-section">
          <div className="ld-reveal ld-eyebrow">El problema</div>
          <h2 className="ld-reveal ld-h2">
            El problema no es querer ahorrar.
            <br />
            Es que la vida pasa.
          </h2>
          <p className="ld-reveal ld-body">
            Recibís plata, pagás comida, transporte, alquiler, deudas y salidas. Cuando te acordás
            de ahorrar, muchas veces ya no quedó nada.
          </p>
          <div className="ld-cards ld-cards--3" data-reveal-group>
            {problemCards.map((c) => (
              <div key={c.t} className="card ld-card">
                <div className="ld-card-ico">
                  <Icon name={c.icon} size={20} />
                </div>
                <div className="ld-card-title">{c.t}</div>
                <p className="ld-card-text">{c.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3 — Solution */}
        <section id="ld-solucion" className="ld-section">
          <div className="ld-reveal ld-eyebrow">La solución</div>
          <h2 className="ld-reveal ld-h2">
            KOVA aparta primero
            <br />
            una parte para vos.
          </h2>
          <p className="ld-reveal ld-quote">
            No se trata de ahorrar lo que sobra. Se trata de apartar primero una parte para tu
            futuro.
          </p>
          <div className="ld-solution-grid">
            <div className="ld-steps" data-reveal-group>
              {solutionSteps.map((s) => (
                <div key={s.n} className="ld-step">
                  <div className="ld-step-num">{s.n}</div>
                  <div className="ld-step-title">{s.t}</div>
                  <p className="ld-step-text">{s.d}</p>
                </div>
              ))}
            </div>
            <SplitDiagram />
          </div>
        </section>

        {/* 4 — Features */}
        <section id="ld-producto" className="ld-section">
          <div className="ld-reveal ld-eyebrow">El producto</div>
          <h2 className="ld-reveal ld-h2">Una wallet con propósito.</h2>
          <div className="ld-cards ld-cards--3" data-reveal-group>
            {features.map((f) => (
              <div key={f.t} className="card ld-card ld-card--feat">
                <div className="ld-card-ico ld-card-ico--accent">
                  <Icon name={f.icon} size={18} />
                </div>
                <div className="ld-card-title">{f.t}</div>
                <p className="ld-card-text">{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 5 — Why now */}
        <section className="ld-section ld-section--why">
          <div className="ld-reveal ld-eyebrow">Por qué ahora</div>
          <h2 className="ld-reveal ld-h2">
            La forma de trabajar cambió.
            <br />
            La forma de ahorrar también tiene que cambiar.
          </h2>
          <p className="ld-reveal ld-body ld-body--center">
            Cada vez más personas trabajan por proyectos, reciben ingresos variables o viven fuera
            del modelo tradicional de empleo fijo. KOVA está diseñado para esa realidad.
          </p>
        </section>

        {/* 6 — Future vision */}
        <section id="ld-vision" className="ld-section">
          <div className="ld-reveal ld-eyebrow">La visión</div>
          <h2 className="ld-reveal ld-h2">
            Hoy empezamos con pensión.
            <br />
            La visión va más allá.
          </h2>
          <p className="ld-reveal ld-body">
            KOVA evolucionará hacia una wallet de bienestar financiero, donde cada ingreso pueda
            dividirse automáticamente según las prioridades reales del usuario.
          </p>
          <div className="ld-envelopes" data-reveal-group>
            {envelopes.map((e) => (
              <div key={e.t} className={`ld-envelope${e.on ? " ld-envelope--on" : ""}`}>
                <div className="ld-envelope-ico">
                  <Icon name={e.icon} size={18} />
                </div>
                <div className="ld-envelope-title">{e.t}</div>
                <div className="ld-envelope-sub">{e.d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 7 — Closing CTA */}
        <section className="ld-cta ld-reveal">
          <h2 className="ld-h2 ld-cta-title">
            Tus ingresos de hoy.
            <br />
            Tu pensión de mañana.
          </h2>
          <p className="ld-cta-sub">
            Empezá a construir tu futuro financiero desde cada pago que recibís.
          </p>
          <button className="btn btn-primary ld-cta-btn" onClick={start}>
            Probar KOVA <Icon name="arrowR" size={18} />
          </button>
          <div className="mono faint ld-cta-foot">{FOOTER}</div>
        </section>
      </div>
    </div>
  );
}

// ---- Animated background + cursor interaction ----
function LandingBackground({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const bgRef = useRef<HTMLDivElement | null>(null);
  const spotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef?.current;
    const root = bgRef.current;
    if (!container || !root) return;
    const rm = reducedMotion();

    const spot = spotRef.current;
    const wrap1 = root.querySelector<HTMLElement>(".ld-aurora-wrap--1");
    const wrap2 = root.querySelector<HTMLElement>(".ld-aurora-wrap--2");
    const blob1 = root.querySelector<HTMLElement>(".ld-aurora--1");
    const blob2 = root.querySelector<HTMLElement>(".ld-aurora--2");
    const grid = root.querySelector<HTMLElement>(".ld-bg-grid");
    const heroCard = container.querySelector<HTMLElement>(".ld-hero-card");

    const ctx = gsap.context(() => {
      if (!rm) {
        gsap.to(blob1, { x: 18, y: 12, duration: 16, repeat: -1, yoyo: true, ease: "sine.inOut" });
        gsap.to(blob2, {
          x: -14,
          y: -10,
          duration: 20,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 3,
        });
      }
    }, root);

    const resetTilt = () => {
      if (heroCard) {
        gsap.to(heroCard, { rotateX: 0, rotateY: 0, y: 0, duration: 0.9, ease: "power3.out" });
      }
    };

    const onMove = (e: MouseEvent) => {
      if (rm) return;
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const px = (x - 0.5) * 2;
      const py = (y - 0.5) * 2;

      if (spot) {
        gsap.to(spot, {
          left: x * rect.width,
          top: y * rect.height,
          opacity: 0.85,
          duration: 1.1,
          ease: "power3.out",
          overwrite: "auto",
        });
      }

      gsap.to(wrap1, {
        x: px * 22,
        y: py * 16,
        duration: 1.4,
        ease: "power3.out",
        overwrite: "auto",
      });
      gsap.to(wrap2, {
        x: px * -16,
        y: py * -12,
        duration: 1.6,
        ease: "power3.out",
        overwrite: "auto",
      });
      gsap.to(grid, { x: px * 5, y: py * 4, duration: 1.8, ease: "power3.out", overwrite: "auto" });

      if (heroCard) {
        gsap.to(heroCard, {
          rotateX: py * -4,
          rotateY: px * 5,
          y: py * -4,
          duration: 0.9,
          ease: "power3.out",
          transformPerspective: 900,
          overwrite: "auto",
        });
      }
    };

    const onLeave = () => {
      if (spot) gsap.to(spot, { opacity: 0, duration: 0.6, ease: "power2.out" });
      gsap.to([wrap1, wrap2, grid], { x: 0, y: 0, duration: 1.4, ease: "power3.out" });
      resetTilt();
    };

    container.addEventListener("mousemove", onMove);
    container.addEventListener("mouseleave", onLeave);

    return () => {
      ctx.revert();
      container.removeEventListener("mousemove", onMove);
      container.removeEventListener("mouseleave", onLeave);
    };
  }, [containerRef]);

  return (
    <div ref={bgRef} className="ld-bg" aria-hidden="true">
      <div className="ld-bg-grid" />
      <div className="ld-aurora-wrap ld-aurora-wrap--1">
        <div className="ld-aurora ld-aurora--1" />
      </div>
      <div className="ld-aurora-wrap ld-aurora-wrap--2">
        <div className="ld-aurora ld-aurora--2" />
      </div>
      <div ref={spotRef} className="ld-bg-spot" />
      <div className="ld-bg-vignette" />
    </div>
  );
}

// ---- Hero wallet visual ----
function HeroWalletCard() {
  const ref = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<SVGCircleElement | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const rm = reducedMotion();
    const ctx = gsap.context(() => {
      if (rm) {
        gsap.set(".hw-line, .hw-ring-fill", { opacity: 1, scaleX: 1, strokeDashoffset: 0 });
        return;
      }
      const tl = gsap.timeline({ delay: 0.5, defaults: { ease: "power2.out" } });
      tl.from(".hw-income", { y: 12, opacity: 0, duration: 0.45 })
        .from(".hw-line", { scaleX: 0, duration: 0.35, transformOrigin: "left center" }, "-=0.1")
        .from(
          ".hw-node",
          { scale: 0.6, opacity: 0, duration: 0.35, ease: "back.out(1.6)" },
          "-=0.15"
        )
        .from(".hw-split > *", { y: 10, opacity: 0, duration: 0.35, stagger: 0.1 }, "-=0.1");
      if (ringRef.current) {
        const len = ringRef.current.getTotalLength();
        gsap.fromTo(
          ringRef.current,
          { strokeDasharray: len, strokeDashoffset: len },
          { strokeDashoffset: len * 0.88, duration: 1.2, ease: "power2.out", delay: 0.9 }
        );
      }
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="ld-hero-card card">
      <div className="hw-head">
        <LogoMark size={22} />
        <span className="brand-name" style={{ fontWeight: 700, fontSize: 14 }}>
          kova
        </span>
      </div>

      <div className="hw-income">
        <div className="label">Ingreso recibido</div>
        <div className="num hw-amount">₡100,000</div>
      </div>

      <div className="hw-flow">
        <div className="hw-line" />
        <div className="hw-node">
          <LogoMark size={18} />
        </div>
      </div>

      <div className="hw-split">
        <div className="hw-split-item hw-split-item--pension">
          <span className="hw-split-pct">10%</span>
          <span className="hw-split-label">→ Sobre pensión</span>
          <span className="num hw-split-val">₡10,000</span>
        </div>
        <div className="hw-split-item hw-split-item--avail">
          <span className="hw-split-pct">90%</span>
          <span className="hw-split-label">→ Disponible</span>
          <span className="num hw-split-val">₡90,000</span>
        </div>
      </div>

      <div className="hw-goal">
        <div className="hw-goal-text">
          <div className="label" style={{ marginBottom: 4 }}>
            Meta de pensión
          </div>
          <div className="faint" style={{ fontSize: 12 }}>
            12% del objetivo
          </div>
        </div>
        <svg className="hw-ring" width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="26" fill="none" stroke="var(--border)" strokeWidth="5" />
          <circle
            ref={ringRef}
            className="hw-ring-fill"
            cx="32"
            cy="32"
            r="26"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="5"
            strokeLinecap="round"
            transform="rotate(-90 32 32)"
          />
        </svg>
      </div>
    </div>
  );
}

// ---- Split diagram (solution section) ----
function SplitDiagram() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const rm = reducedMotion();
    let io: IntersectionObserver | undefined;
    const ctx = gsap.context(() => {
      if (rm) {
        gsap.set(".sd-income, .sd-path, .sd-kova, .sd-out", {
          opacity: 1,
          scale: 1,
          scaleX: 1,
          y: 0,
        });
        return;
      }
      io = new IntersectionObserver(
        (entries) => {
          if (!entries[0]?.isIntersecting) return;
          const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
          tl.from(".sd-income", { y: 16, opacity: 0, duration: 0.45 })
            .from(
              ".sd-path",
              { scaleX: 0, duration: 0.4, transformOrigin: "left center", stagger: 0.12 },
              "-=0.1"
            )
            .from(
              ".sd-kova",
              { scale: 0.7, opacity: 0, duration: 0.35, ease: "back.out(1.6)" },
              "-=0.2"
            )
            .from(".sd-out", { y: 12, opacity: 0, duration: 0.35, stagger: 0.1 }, "-=0.1");
          io?.disconnect();
        },
        { threshold: 0.3 }
      );
      io.observe(root);
    }, root);
    return () => {
      ctx.revert();
      io?.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className="ld-reveal sd-wrap card">
      <div className="sd-income">
        <div className="label">Ingreso</div>
        <div className="num" style={{ fontSize: 28 }}>
          ₡100,000
        </div>
      </div>
      <div className="sd-mid">
        <div className="sd-path sd-path--h" />
        <div className="sd-kova">
          <LogoMark size={20} />
          <span>KOVA</span>
        </div>
        <div className="sd-path sd-path--v" />
      </div>
      <div className="sd-outs">
        <div className="sd-out sd-out--pension">
          <div className="label">Sobre pensión</div>
          <div className="num" style={{ color: "var(--accent)" }}>
            10% · ₡10,000
          </div>
        </div>
        <div className="sd-out sd-out--avail">
          <div className="label">Disponible</div>
          <div className="num">90% · ₡90,000</div>
        </div>
      </div>
    </div>
  );
}

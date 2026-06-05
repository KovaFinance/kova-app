import Link from "next/link";
import { Logo, Chip } from "@/components/ui";

export default function Landing() {
  return (
    <main style={{ background: "var(--paper)", minHeight: "100dvh" }}>
      {/* nav */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 28px",
          borderBottom: "3px solid #111",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <Logo size={28} />
        <Link
          href="/auth"
          className="btn btn-primary"
          style={{ width: "auto", padding: "12px 22px", textDecoration: "none" }}
        >
          Abrir app
        </Link>
      </header>

      {/* hero */}
      <section
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "64px 28px 32px",
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: 40,
          alignItems: "center",
        }}
      >
        <div>
          <Chip variant="coral">Construido en Stellar · No custodial</Chip>
          <h1 className="display" style={{ fontSize: 76, margin: "18px 0 10px" }}>
            Ahorra primero.
            <br />
            Siempre.
          </h1>
          <p style={{ fontSize: 19, color: "#333", maxWidth: 460, lineHeight: 1.5 }}>
            Kova convierte cada pago en ahorro en dólares, automáticamente. Para la economía gig y
            quienes no tienen banco — tu dinero, solo tuyo.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 26 }}>
            <Link
              href="/auth"
              className="btn btn-primary"
              style={{ width: "auto", padding: "16px 26px", textDecoration: "none" }}
            >
              Crear cuenta con Face ID
            </Link>
            <Link
              href="/home"
              className="btn"
              style={{ width: "auto", padding: "16px 26px", textDecoration: "none" }}
            >
              Ver demo
            </Link>
          </div>
          <p className="mono" style={{ fontSize: 12, color: "#888", marginTop: 14 }}>
            Sin banco · sin frase secreta · sin gas
          </p>
        </div>

        {/* phone preview */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div className="phone">
            <div style={{ background: "#111", color: "#fff", padding: 18 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 18,
                }}
              >
                <Logo size={18} light />
                <span className="chip chip-green" style={{ fontSize: 8 }}>
                  MODO CRECER
                </span>
              </div>
              <div className="label" style={{ color: "#888" }}>
                AHORRADO
              </div>
              <div className="num" style={{ fontSize: 44, color: "#fff" }}>
                $1,284<span style={{ fontSize: 22, opacity: 0.4 }}>.50</span>
              </div>
              <div className="chip chip-green" style={{ marginTop: 10, fontSize: 9 }}>
                ▲ +$47.20 esta semana
              </div>
            </div>
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  ["ESTE MES", "$312"],
                  ["EN 20 AÑOS", "$74k"],
                  ["%", "15%"],
                ].map(([l, v]) => (
                  <div key={l} className="card-flat" style={{ padding: 8, flex: 1 }}>
                    <div className="label" style={{ fontSize: 7 }}>
                      {l}
                    </div>
                    <div className="num" style={{ fontSize: 14 }}>
                      {v}
                    </div>
                  </div>
                ))}
              </div>
              <div className="card-flat" style={{ padding: 10 }}>
                <div className="label" style={{ fontSize: 8, marginBottom: 6 }}>
                  ÚLTIMO INGRESO
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                  <span style={{ fontWeight: 600 }}>Cliente Figma</span>
                  <span className="mono" style={{ color: "var(--green)" }}>
                    $48 guardado
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* pillars */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 28px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {[
            [
              "01",
              "Sin banco",
              "Funciona sin cuenta bancaria. Entra y sal con efectivo vía agentes locales.",
            ],
            ["02", "En dólares", "Tus ahorros mantienen su valor frente a la inflación local."],
            [
              "03",
              "Solo tuyo",
              "Nadie puede congelar ni prestar tu dinero. No custodial, auditable.",
            ],
            [
              "04",
              "Remesas",
              "El dinero que llega del exterior se ahorra en el instante en que cae.",
            ],
          ].map(([n, h, d], i) => (
            <div
              key={n}
              className="card"
              style={{
                padding: 18,
                background: i === 1 ? "var(--sun)" : i === 3 ? "var(--green)" : "#fff",
                color: i === 3 ? "#fff" : "#111",
              }}
            >
              <div
                className="display"
                style={{ fontSize: 30, color: i === 3 ? "#fff" : "var(--coral)" }}
              >
                {n}
              </div>
              <div className="display" style={{ fontSize: 18, marginTop: 6 }}>
                {h}
              </div>
              <div style={{ fontSize: 12, marginTop: 6, opacity: 0.85 }}>{d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* how it works */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 28px" }}>
        <h2 className="display" style={{ fontSize: 40, marginBottom: 24 }}>
          Cómo funciona
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            ["Recibe", "Tus pagos de clientes, plataformas o remesas entran a tu Kova."],
            ["Ahorra solo", "Una bóveda en Soroban aparta tu porcentaje en dólares al instante."],
            ["Crece y cobra", "Mira tu futuro crecer — y cuando quieras, vive de tu rendimiento."],
          ].map(([h, d], i) => (
            <div key={h} style={{ borderLeft: "3px solid #111", paddingLeft: 16 }}>
              <div className="display" style={{ fontSize: 22 }}>
                {i + 1}. {h}
              </div>
              <p style={{ fontSize: 13, color: "#444", marginTop: 6 }}>{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* grow -> income story */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 28px" }}>
        <div
          className="card"
          style={{
            padding: 32,
            background: "var(--ink)",
            color: "#fff",
            boxShadow: "8px 8px 0 0 var(--coral)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              gap: 24,
              alignItems: "center",
            }}
          >
            <div>
              <div className="chip chip-sun">CRECER</div>
              <h3 className="display" style={{ fontSize: 30, marginTop: 10 }}>
                Cada pago suma
              </h3>
              <p style={{ fontSize: 13, color: "#bbb", marginTop: 8 }}>
                Acumulas en dólares, automáticamente, con un rendimiento real y conservador.
              </p>
            </div>
            <div className="display" style={{ fontSize: 40, color: "var(--coral)" }}>
              →
            </div>
            <div>
              <div className="chip chip-green">INGRESO</div>
              <h3 className="display" style={{ fontSize: 30, marginTop: 10 }}>
                Vive del rendimiento
              </h3>
              <p style={{ fontSize: 13, color: "#bbb", marginTop: 8 }}>
                Cuando quieras, retira solo lo que tu fondo genera cada mes. Tu capital queda
                intacto.
              </p>
              <p className="mono" style={{ fontSize: 11, color: "#777", marginTop: 8 }}>
                $100,000 → ~$375/mes (variable, a tasa actual)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* built on stellar / CTA */}
      <section
        style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 28px 80px", textAlign: "center" }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: 22,
          }}
        >
          <Chip variant="sun">Stellar</Chip>
          <Chip>Soroban</Chip>
          <Chip variant="green">USDC</Chip>
          <Chip variant="coral">Passkeys</Chip>
          <Chip>MoneyGram · Airtm</Chip>
        </div>
        <h2 className="display" style={{ fontSize: 48 }}>
          Tu futuro empieza hoy.
        </h2>
        <Link
          href="/auth"
          className="btn btn-primary"
          style={{
            width: "auto",
            padding: "16px 30px",
            marginTop: 20,
            textDecoration: "none",
            display: "inline-flex",
          }}
        >
          Crear cuenta
        </Link>
        <p className="mono" style={{ fontSize: 11, color: "#999", marginTop: 28 }}>
          kova.app · stellar testnet · Built on Stellar. Owned by you.
        </p>
      </section>
    </main>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { useStore } from "@/lib/store";
import { Icon, LogoMark, useCountUp, animGuard } from "@/components/kova";
import type { IncomeEvent } from "@/lib/types";
import { fetchActivity } from "@/lib/activity/client";

const RETIREMENT_GOAL = 100000;

function fmtMoney(n: number, hidden: boolean) {
  if (hidden) return "••••••";
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function relTime(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return "Ahora";
  const m = Math.floor(s / 60);
  if (m < 60) return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "Ayer" : `Hace ${d} días`;
}

export default function HomePage() {
  const router = useRouter();
  const name = useStore((s) => s.name);
  const principal = useStore((s) => s.principal);
  const accruedYield = useStore((s) => s.accruedYield);
  const savingsBps = useStore((s) => s.savingsBps);
  const savedThisMonth = useStore((s) => s.savedThisMonth);
  const weeks = useStore((s) => s.weeks);
  const account = useStore((s) => s.account);

  const fund = principal;
  const available = accruedYield;
  const total = +(available + fund).toFixed(2);
  const pctGoal = Math.min(100, (fund / RETIREMENT_GOAL) * 100);
  const pctGoalLabel = pctGoal < 1 && fund > 0 ? pctGoal.toFixed(2) : pctGoal.toFixed(1);
  const ringPct = Math.min(weeks / 52, 1);
  const ringLen = 2 * Math.PI * 26;
  const savePct = Math.round(savingsBps / 100);

  const [hidden, setHidden] = useState(false);
  const [lastIncome, setLastIncome] = useState<IncomeEvent | null>(null);
  const totalRef = useCountUp(total, { dec: 2, run: !hidden });
  const root = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!totalRef.current) return;
    totalRef.current.textContent = hidden
      ? "••••••"
      : "$" + total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [hidden, total, totalRef]);

  useEffect(() => {
    if (!account) return;
    let alive = true;
    fetchActivity(account.publicKey, 1).then((evs) => {
      if (alive) setLastIncome(evs[0] ?? null);
    });
    return () => {
      alive = false;
    };
  }, [account]);

  useEffect(() => {
    if (!root.current) return;
    const q = gsap.utils.selector(root);
    const tw = gsap.from(q(".hm-rise"), {
      y: 18,
      opacity: 0,
      duration: 0.5,
      stagger: 0.06,
      ease: "power2.out",
    });
    return animGuard(q(".hm-rise"), tw);
  }, []);

  return (
    <div ref={root} className="screen">
      <div className="pad">
        <div className="between hm-rise" style={{ marginTop: 4 }}>
          <div className="row hm-greet-left">
            <LogoMark size={30} />
            <span className="hm-greet-name">{name ? `Hola, ${name} 👋` : "Hola 👋"}</span>
          </div>
          <button className="tok" onClick={() => router.push("/activity")} aria-label="Actividad">
            <Icon name="note" size={19} />
          </button>
        </div>

        {/* wallet balance hero */}
        <div className="hm-rise hm-wallet card">
          <div className="hm-wallet-top">
            <div className="hm-wallet-main">
              <div className="hm-wallet-label-row">
                <span className="label" style={{ marginBottom: 0 }}>
                  Saldo total
                </span>
                <button
                  type="button"
                  className="hm-wallet-eye"
                  onClick={() => setHidden((h) => !h)}
                  aria-label={hidden ? "Mostrar saldo" : "Ocultar saldo"}
                >
                  <Icon name={hidden ? "eyeOff" : "eye"} size={17} />
                </button>
              </div>
              <div ref={totalRef} className="num hm-wallet-total">
                $0.00
              </div>
              <div className="faint hm-wallet-net">USDC en Stellar</div>
            </div>
          </div>
          <div className="hm-wallet-divider" />
          <div className="hm-wallet-cols">
            <button type="button" className="hm-wallet-col" onClick={() => router.push("/income")}>
              <div className="hm-wallet-col-label">
                <span className="hm-wallet-dot" aria-hidden="true" />
                <span>Disponible</span>
              </div>
              <div className="num hm-wallet-col-amt">{fmtMoney(available, hidden)}</div>
              <div className="hm-wallet-col-sub">Rendimiento para cobrar</div>
            </button>
            <button
              type="button"
              className="hm-wallet-col hm-wallet-col--fund"
              onClick={() => router.push("/vault")}
            >
              <div className="hm-wallet-col-label">
                <span>Fondo de retiro</span>
                <Icon name="lock" size={13} style={{ color: "var(--text-faint)" }} />
              </div>
              <div className="num hm-wallet-col-amt">{fmtMoney(fund, hidden)}</div>
              <div className="hm-wallet-col-sub">Protegido para tu futuro</div>
            </button>
          </div>
        </div>

        {/* retirement goal */}
        <button className="hm-rise hm-goal card s2" onClick={() => router.push("/projection")}>
          <div className="between" style={{ marginBottom: 10 }}>
            <span className="label" style={{ marginBottom: 0 }}>
              Meta de retiro
            </span>
            <span className="num faint" style={{ fontSize: 13 }}>
              {pctGoalLabel}%
            </span>
          </div>
          <div className="faint" style={{ fontSize: 13, marginBottom: 10 }}>
            <span className="num" style={{ color: "var(--text)" }}>
              $
              {fund.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </span>
            {" / "}
            <span className="num">${RETIREMENT_GOAL.toLocaleString("en-US")}</span>
          </div>
          <div className="bar">
            <i style={{ width: Math.max(pctGoal, fund > 0 ? 0.8 : 0) + "%" }} />
          </div>
        </button>

        {/* savings rule + month total */}
        <div className="hm-rise hm-stats">
          <button className="hm-stat hm-stat--rule" onClick={() => router.push("/settings")}>
            <div className="hm-stat-ico">
              <Icon name="bolt" size={18} />
            </div>
            <div className="label">Tu regla</div>
            <div className="num hm-stat-val hm-stat-val--accent">{savePct}%</div>
            <div className="hm-stat-sub">Automático en cada pago</div>
          </button>
          <button className="hm-stat hm-stat--month" onClick={() => router.push("/activity")}>
            <div className="hm-stat-ico">
              <Icon name="chart" size={18} />
            </div>
            <div className="label">Este mes</div>
            <div className="num hm-stat-val">
              ${savedThisMonth.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </div>
            <div className="hm-stat-sub">guardado</div>
          </button>
        </div>

        {lastIncome && (
          <button className="hm-rise hm-income" onClick={() => router.push("/activity")}>
            <div className="hm-income-ico">
              <Icon name="spark" size={18} />
            </div>
            <div className="hm-income-body">
              <div className="label" style={{ marginBottom: 4 }}>
                Último ingreso
              </div>
              <div className="hm-income-name">{lastIncome.source}</div>
              <div className="faint" style={{ fontSize: 12 }}>
                {relTime(lastIncome.ts)}
              </div>
            </div>
            <div className="hm-income-amts">
              <div className="num hm-income-pay">+${lastIncome.amount}</div>
              <div className="num hm-income-saved">↳ ${lastIncome.saved}</div>
            </div>
          </button>
        )}

        {/* streak */}
        <button className="hm-rise hm-streak card s2" onClick={() => router.push("/streak")}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14.5 }}>Racha actual 🔥</div>
            <div className="num" style={{ fontSize: 28, color: "var(--accent)", marginTop: 6 }}>
              {weeks}{" "}
              <span style={{ fontSize: 15, color: "var(--text-dim)", fontWeight: 600 }}>
                semanas
              </span>
            </div>
          </div>
          <div className="hm-streak-ring">
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="none" stroke="var(--border)" strokeWidth="4" />
              <circle
                cx="32"
                cy="32"
                r="26"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={ringLen}
                strokeDashoffset={ringLen * (1 - ringPct)}
                transform="rotate(-90 32 32)"
              />
            </svg>
            <div className="hm-streak-flame">
              <Icon name="flame" size={22} fill="solid" />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

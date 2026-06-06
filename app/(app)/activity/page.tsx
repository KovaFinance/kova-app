"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Icon } from "@/components/kova";
import type { IncomeEvent } from "@/lib/types";
import { fetchActivity } from "@/lib/activity/client";

type Row = {
  id: string;
  kind: "income" | "savings";
  title: string;
  time: string;
  amount: number;
  ts: number;
};

const KIND_STYLE: Record<string, { icon: string; bg: string; color: string }> = {
  income: { icon: "arrowUp", bg: "rgba(200,241,53,0.16)", color: "#C8F135" },
  savings: { icon: "piggy", bg: "rgba(190,200,70,0.18)", color: "#C4CE52" },
};

const FILTERS = [
  { key: "todos", label: "Todos" },
  { key: "ingresos", label: "Ingresos", kinds: ["income"] },
  { key: "ahorros", label: "Ahorros", kinds: ["savings"] },
];

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

function dayGroup(ts: number): string {
  const days = Math.floor((Date.now() - ts) / 86400000);
  if (days <= 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 7) return "Esta semana";
  return "Anteriores";
}

function fmtAmt(n: number) {
  return (
    "+ $" +
    Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

export default function ActivityPage() {
  const account = useStore((s) => s.account);
  const [events, setEvents] = useState<IncomeEvent[] | null>(null);
  const [filter, setFilter] = useState("todos");

  useEffect(() => {
    if (!account) return;
    let alive = true;
    fetchActivity(account.publicKey).then((evs) => {
      if (alive) setEvents(evs);
    });
    return () => {
      alive = false;
    };
  }, [account]);

  const rows: Row[] = (events ?? []).flatMap((e) => [
    {
      id: e.id + "-i",
      kind: "income",
      title: `Ingreso · ${e.source}`,
      time: relTime(e.ts),
      amount: e.amount,
      ts: e.ts,
    },
    {
      id: e.id + "-s",
      kind: "savings",
      title: "Ahorro automático",
      time: relTime(e.ts),
      amount: e.saved,
      ts: e.ts,
    },
  ]);

  const fdef = FILTERS.find((f) => f.key === filter);
  const filtered = filter === "todos" ? rows : rows.filter((r) => fdef?.kinds?.includes(r.kind));

  const groupOrder = ["Hoy", "Ayer", "Esta semana", "Anteriores"];
  const groups = groupOrder
    .map((label) => ({ label, items: filtered.filter((r) => dayGroup(r.ts) === label) }))
    .filter((g) => g.items.length);

  return (
    <div className="screen pad">
      <div className="between act-head">
        <h1 className="act-title">Actividad</h1>
        <button className="tok act-filter-btn" aria-label="Filtrar">
          <Icon name="filter" size={18} />
        </button>
      </div>

      <div className="act-filters">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={"act-filter" + (filter === f.key ? " on" : "")}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {events === null ? (
        <div className="act-empty">
          <p className="dim" style={{ fontSize: 14, textAlign: "center" }}>
            Cargando…
          </p>
        </div>
      ) : groups.length === 0 ? (
        <div className="act-empty">
          <p className="dim" style={{ fontSize: 14, textAlign: "center", lineHeight: 1.5 }}>
            Aún no hay ingresos. Comparte tu dirección para recibir tu primer pago.
          </p>
        </div>
      ) : (
        groups.map((g) => (
          <div key={g.label} className="act-group">
            <div className="act-group-label">{g.label}</div>
            <div className="act-list">
              {g.items.map((it) => {
                const st = KIND_STYLE[it.kind];
                return (
                  <div key={it.id} className="act-row">
                    <div className="act-row-ico" style={{ background: st.bg, color: st.color }}>
                      <Icon name={st.icon} size={20} sw={1.8} />
                    </div>
                    <div className="act-row-body">
                      <div className="act-row-title">{it.title}</div>
                      <div className="act-row-time">{it.time}</div>
                    </div>
                    <div className="act-row-amt num act-row-amt--pos">{fmtAmt(it.amount)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

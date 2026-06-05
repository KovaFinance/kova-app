"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Money } from "@/components/ui";
import { StreakDots } from "@/components/StreakDots";
import { useStore } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { usd, pct, compact } from "@/lib/format";
import { projectFutureValue } from "@/lib/yield";
import { fetchActivity } from "@/lib/activity/client";
import type { IncomeEvent } from "@/lib/types";

export default function HomePage() {
  const lang = useStore((s) => s.lang);
  const principal = useStore((s) => s.principal);
  const week = useStore((s) => s.savedThisWeek);
  const month = useStore((s) => s.savedThisMonth);
  const bps = useStore((s) => s.savingsBps);
  const weeks = useStore((s) => s.weeks);
  const account = useStore((s) => s.account);
  const liveRate = useStore((s) => s.liveRate);

  const [activity, setActivity] = useState<IncomeEvent[]>([]);
  useEffect(() => {
    if (account?.publicKey) fetchActivity(account.publicKey, 4).then(setActivity);
  }, [account?.publicKey]);

  const monthlyContrib = month || 150;
  const in20 = projectFutureValue(monthlyContrib, liveRate, 20, principal);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* balance hero */}
      <section
        className="card"
        style={{
          padding: 22,
          background: "var(--ink)",
          color: "#fff",
          boxShadow: "6px 6px 0 0 #ff5c39",
        }}
      >
        <div className="label" style={{ color: "#888" }}>
          {tr(lang, "home.saved")}
        </div>
        <div style={{ marginTop: 4 }}>
          <Money value={principal} size={54} color="#fff" />
        </div>
        <div style={{ marginTop: 10 }}>
          <span className="chip chip-green">
            ▲ +{usd(week)} {tr(lang, "home.week")}
          </span>
        </div>
      </section>

      {/* stat trio */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <Stat label={tr(lang, "home.month")} value={usd(month)} sub="+8%" />
        <Stat
          label={tr(lang, "home.in20")}
          value={"$" + compact(in20)}
          sub={`~${pct(liveRate * 10000)}`}
        />
        <Stat label={tr(lang, "home.rate")} value={pct(bps)} sub="auto" />
      </section>

      {/* recent income */}
      <section className="card" style={{ padding: 16 }}>
        <div className="label" style={{ marginBottom: 10 }}>
          {tr(lang, "home.recent")}
        </div>
        {activity.length === 0 ? (
          <div className="mono" style={{ fontSize: 12, color: "#999", padding: "8px 0" }}>
            {tr(lang, "home.empty")}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {activity.slice(0, 4).map((e, i) => (
              <div
                key={e.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "9px 0",
                  borderBottom: i < 3 ? "2px solid #f0e6d2" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      background: "var(--coral)",
                      border: "1.5px solid #111",
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{e.source}</div>
                    <div className="mono" style={{ fontSize: 10, color: "#999" }}>
                      {e.kind}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="num" style={{ fontSize: 14 }}>
                    +{usd(e.amount)}
                  </div>
                  <div className="mono" style={{ fontSize: 10, color: "var(--green)" }}>
                    {usd(e.saved)} {tr(lang, "home.saved2")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* streak */}
      <Link href="/streak" style={{ textDecoration: "none" }}>
        <section
          className="card"
          style={{
            padding: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div className="label">{tr(lang, "streak.title").toUpperCase()}</div>
            <div className="num" style={{ fontSize: 22 }}>
              {weeks} {tr(lang, "streak.weeks")}
            </div>
            <div className="mono" style={{ fontSize: 11, color: "var(--green)" }}>
              {tr(lang, "streak.level")} brote →
            </div>
          </div>
          <StreakDots weeks={weeks} />
        </section>
      </Link>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card-flat" style={{ padding: 12 }}>
      <div className="label" style={{ fontSize: 9 }}>
        {label}
      </div>
      <div className="num" style={{ fontSize: 18, marginTop: 6 }}>
        {value}
      </div>
      <div className="mono" style={{ fontSize: 9, color: "var(--green)", marginTop: 3 }}>
        {sub}
      </div>
    </div>
  );
}

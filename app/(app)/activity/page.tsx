"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { usd } from "@/lib/format";
import { fetchActivity } from "@/lib/activity/client";
import type { IncomeEvent } from "@/lib/types";

export default function ActivityPage() {
  const lang = useStore((s) => s.lang);
  const account = useStore((s) => s.account);
  const [activity, setActivity] = useState<IncomeEvent[]>([]);

  // history is sourced from the indexer, not localStorage (master rule #4)
  useEffect(() => {
    if (account?.publicKey) fetchActivity(account.publicKey).then(setActivity);
  }, [account?.publicKey]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h1 className="display" style={{ fontSize: 30 }}>
        {tr(lang, "act.title")}
      </h1>

      {activity.length === 0 ? (
        <div className="card" style={{ padding: 20 }}>
          <p style={{ fontSize: 14, color: "#444" }}>{tr(lang, "act.empty")}</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 8 }}>
          {activity.map((e, i) => (
            <div
              key={e.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 12px",
                borderBottom: i < activity.length - 1 ? "2px solid #f0e6d2" : "none",
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
                    {e.kind} · {new Date(e.ts).toLocaleDateString(lang === "es" ? "es" : "en")}
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
    </div>
  );
}

"use client";

import { Chip } from "@/components/ui";
import { useStore } from "@/lib/store";
import { tr } from "@/lib/i18n";

export default function CashPage() {
  const lang = useStore((s) => s.lang);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h1 className="display" style={{ fontSize: 30 }}>
        {tr(lang, "cash.title")}
      </h1>

      <div className="card" style={{ padding: 22 }}>
        <div className="label">
          {tr(lang, "cash.in")} · {tr(lang, "cash.out")}
        </div>
        <p className="mono" style={{ fontSize: 13, color: "#777", marginTop: 10, lineHeight: 1.5 }}>
          {tr(lang, "cash.comingSoon")}
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
          <Chip variant="sun">MoneyGram</Chip>
          <Chip>Airtm</Chip>
          <Chip variant="green">SEP-24</Chip>
        </div>
        <button
          className="btn"
          disabled
          style={{ marginTop: 16, opacity: 0.5, cursor: "not-allowed" }}
        >
          {tr(lang, "cash.comingSoonCta")}
        </button>
      </div>
    </div>
  );
}

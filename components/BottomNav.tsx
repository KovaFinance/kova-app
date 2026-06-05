"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { tr } from "@/lib/i18n";

const ITEMS = [
  { href: "/home", key: "nav.home", icon: "M3 11l9-8 9 8M5 10v10h14V10" },
  { href: "/income", key: "nav.income", icon: "M12 3v18M5 10l7-7 7 7" },
  { href: "/projection", key: "nav.projection", icon: "M3 17l6-6 4 4 8-8M21 7v6h-6" },
  { href: "/activity", key: "nav.activity", icon: "M3 12h4l3 8 4-16 3 8h4" },
  {
    href: "/settings",
    key: "nav.settings",
    icon: "M12 15a3 3 0 100-6 3 3 0 000 6zM3 12h2m14 0h2M12 3v2m0 14v2",
  },
];

export function BottomNav() {
  const path = usePathname();
  const lang = useStore((s) => s.lang);
  return (
    <nav
      style={{
        position: "sticky",
        bottom: 0,
        left: 0,
        right: 0,
        background: "var(--paper)",
        borderTop: "3px solid #111",
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        padding: "8px 6px calc(8px + env(safe-area-inset-bottom))",
        zIndex: 50,
      }}
    >
      {ITEMS.map((it) => {
        const active = path?.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            style={{
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
            }}
          >
            <span
              style={{
                width: 40,
                height: 32,
                borderRadius: 10,
                display: "grid",
                placeItems: "center",
                background: active ? "var(--coral)" : "transparent",
                border: active ? "2px solid #111" : "2px solid transparent",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke={active ? "#fff" : "#111"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={it.icon} />
              </svg>
            </span>
            <span
              className="mono"
              style={{ fontSize: 9, color: "#111", fontWeight: active ? 700 : 400 }}
            >
              {tr(lang, it.key)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

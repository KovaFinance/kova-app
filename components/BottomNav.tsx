"use client";

import { useRouter, usePathname } from "next/navigation";
import { Icon } from "./kova";

type Tab = { key: string; href: string; icon: string; label: string; fab?: boolean };

const TABS: Tab[] = [
  { key: "home", href: "/home", icon: "home", label: "Inicio" },
  { key: "projection", href: "/projection", icon: "chart", label: "Proyección" },
  { key: "fab", href: "", icon: "plus", label: "", fab: true },
  { key: "streak", href: "/streak", icon: "flame", label: "Racha" },
  { key: "settings", href: "/settings", icon: "user", label: "Perfil" },
];

// Sub-screens that should keep a primary tab highlighted.
const ACTIVE_MAP: Record<string, string> = {
  "/home": "home",
  "/vault": "home",
  "/income": "home",
  "/activity": "home",
  "/goals": "home",
  "/cash": "home",
  "/receive": "home",
  "/send": "home",
  "/deposit": "home",
  "/projection": "projection",
  "/streak": "streak",
  "/settings": "settings",
};

export function BottomNav({ onFab }: { onFab?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const cur = ACTIVE_MAP[pathname] ?? "home";

  return (
    <nav className="botnav">
      {TABS.map((t) =>
        t.fab ? (
          <button
            key={t.key}
            onClick={() => (onFab ? onFab() : router.push("/home"))}
            aria-label="Acciones"
          >
            <span className="navfab">
              <Icon name="plus" size={26} sw={2.4} />
            </span>
          </button>
        ) : (
          <button
            key={t.key}
            className={cur === t.key ? "on" : ""}
            onClick={() => router.push(t.href)}
            aria-label={t.label}
          >
            <Icon name={t.icon} size={22} sw={cur === t.key ? 2.1 : 1.8} />
            <span>{t.label}</span>
          </button>
        )
      )}
    </nav>
  );
}

export default BottomNav;

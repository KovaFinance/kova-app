"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/app/providers";
import { BottomNav } from "@/components/BottomNav";
import { Logo, Chip } from "@/components/ui";
import { tr } from "@/lib/i18n";
import { KILL_SWITCH } from "@/lib/stellar/config";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const account = useStore((s) => s.account);
  const onboarded = useStore((s) => s.onboarded);
  const mode = useStore((s) => s.mode);
  const lang = useStore((s) => s.lang);
  const refreshPosition = useStore((s) => s.refreshPosition);
  const refreshRate = useStore((s) => s.refreshRate);
  const hydrateProfile = useStore((s) => s.hydrateProfile);

  useEffect(() => {
    if (!hydrated) return;
    if (!account) router.replace("/auth");
    else if (!onboarded) router.replace("/onboarding");
  }, [hydrated, account, onboarded, router]);

  // Chain is the source of truth: reconcile balances + live rate on load/return
  // (account persists across reloads even though the in-memory signer does not).
  useEffect(() => {
    if (hydrated && account) {
      void refreshPosition();
      void refreshRate();
      void hydrateProfile();
    }
  }, [hydrated, account, refreshPosition, refreshRate, hydrateProfile]);

  if (!hydrated || !account) {
    return (
      <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
        <Logo size={32} />
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        justifyContent: "center",
        background: "var(--paper)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          borderLeft: "3px solid #111",
          borderRight: "3px solid #111",
          background: "var(--paper)",
        }}
        className="noscroll"
      >
        {/* top bar */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderBottom: "3px solid #111",
            position: "sticky",
            top: 0,
            background: "var(--paper)",
            zIndex: 40,
          }}
        >
          <Logo size={24} />
          <div style={{ display: "flex", gap: 6 }}>
            <Chip variant={mode === "income" ? "green" : "sun"}>
              {tr(lang, mode === "income" ? "home.mode.income" : "home.mode.grow")}
            </Chip>
          </div>
        </header>

        {KILL_SWITCH && (
          <div
            style={{
              background: "var(--coral)",
              color: "#fff",
              padding: "8px 16px",
              fontSize: 12,
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            {lang === "es"
              ? "Mantenimiento — las acciones de dinero están pausadas."
              : "Maintenance — money actions are paused."}
          </div>
        )}

        {/* scrollable content */}
        <div className="noscroll" style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {children}
        </div>

        <BottomNav />
      </div>
    </main>
  );
}

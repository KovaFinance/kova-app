"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/app/providers";
import { BottomNav } from "@/components/BottomNav";
import { ActionSheet } from "@/components/ActionSheet";
import { Logo } from "@/components/kova";
import { KILL_SWITCH } from "@/lib/stellar/config";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const account = useStore((s) => s.account);
  const onboarded = useStore((s) => s.onboarded);
  const lang = useStore((s) => s.lang);
  const refreshPosition = useStore((s) => s.refreshPosition);
  const refreshRate = useStore((s) => s.refreshRate);
  const refreshBalance = useStore((s) => s.refreshBalance);
  const hydrateProfile = useStore((s) => s.hydrateProfile);
  const hydrateStats = useStore((s) => s.hydrateStats);
  const [actionsOpen, setActionsOpen] = useState(false);

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
      void refreshBalance();
      void hydrateProfile();
      void hydrateStats();
    }
  }, [
    hydrated,
    account,
    refreshPosition,
    refreshRate,
    refreshBalance,
    hydrateProfile,
    hydrateStats,
  ]);

  if (!hydrated || !account) {
    return (
      <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
        <Logo size={40} />
      </main>
    );
  }

  return (
    <div className="kova-root">
      {KILL_SWITCH && (
        <div className="kova-banner">
          {lang === "es"
            ? "Mantenimiento — las acciones de dinero están pausadas."
            : "Maintenance — money actions are paused."}
        </div>
      )}

      {/* keyed by route so each screen plays the subtle slide-in on navigation */}
      <div className="screen-host" key={pathname}>
        {children}
      </div>

      <BottomNav onFab={() => setActionsOpen(true)} />
      <ActionSheet open={actionsOpen} onClose={() => setActionsOpen(false)} />
    </div>
  );
}

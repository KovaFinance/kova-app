"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Signer, VaultMode } from "./types";
import { YIELD_RATE, isChainConfigured, KILL_SWITCH } from "./stellar/config";

const MAINTENANCE = "Kova is in maintenance — money actions are paused. Try again shortly.";
import { vaultClient, NoPositionError } from "./stellar/vault";
import { refreshRate as fetchLiveRate } from "./stellar/rate";
import { walletUsdcBalance } from "./stellar/balance";
import { fetchProfile, saveProfile } from "./profile/client";
import { fetchStats } from "./stats/client";

interface State {
  lang: "es" | "en";
  name: string; // display name for greetings/avatar (persisted, set at onboarding)
  account: { publicKey: string; method: string; label?: string } | null;
  signer: Signer | null; // in-memory only (not persisted)
  onboarded: boolean;
  savingsBps: number;
  mode: VaultMode;
  // Financial truth comes from chain (getPosition); these are an optimistic cache,
  // reconciled by refreshPosition and NOT persisted to localStorage (master rule #4).
  principal: number;
  accruedYield: number; // REAL venue-earned claimable yield (claimable_yield)
  walletBalance: number; // REAL spendable USDC balance read from the USDC SAC
  lockedUntil: number | null;
  savedThisWeek: number;
  savedThisMonth: number;
  weeks: number;
  liveRate: number; // variable yield rate read from the venue
  rateSource: "venue" | "fallback";
  syncing: boolean;
  _hydrated: boolean;

  setLang: (l: "es" | "en") => void;
  setName: (n: string) => void;
  signIn: (s: Signer) => void;
  signOut: () => void;
  setOnboarded: (v: boolean) => void;
  setRate: (bps: number) => void;
  recordIncome: (
    source: string,
    kind: string,
    amount: number
  ) => { saved: number; spendable: number };
  setMode: (m: VaultMode) => void;
  routeIncome: (amount: number) => Promise<{ saved: number; spendable: number }>;
  claimYield: () => Promise<number>;
  withdraw: (amount: number) => Promise<void>;
  availableIncome: () => number;
  refreshPosition: () => Promise<void>;
  refreshRate: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  hydrateProfile: () => Promise<void>;
  hydrateStats: () => Promise<void>;
  reset: () => void;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      lang: "es",
      name: "",
      account: null,
      signer: null,
      onboarded: false,
      savingsBps: 1500,
      mode: "grow",
      principal: 0,
      accruedYield: 0,
      walletBalance: 0,
      lockedUntil: null,
      savedThisWeek: 0,
      savedThisMonth: 0,
      weeks: 0,
      liveRate: YIELD_RATE,
      rateSource: "fallback",
      syncing: false,
      _hydrated: false,

      setLang: (l) => {
        set({ lang: l });
        const { account } = get();
        if (account) void saveProfile({ contractId: account.publicKey, lang: l });
      },

      setName: (n) => set({ name: n.trim() }),

      signIn: (s) => {
        set({
          signer: s,
          account: { publicKey: s.publicKey, method: s.method, label: s.label },
        });
        // chain is the source of truth — reconcile balances + live rate after sign-in
        void get().refreshPosition();
        void get().refreshRate();
        void get().refreshBalance();
        void get().hydrateStats();
      },

      signOut: () => set({ signer: null, account: null }),
      setOnboarded: (v) => set({ onboarded: v }),

      setRate: (bps) => {
        set({ savingsBps: bps });
        const { signer, account } = get();
        if (account) void saveProfile({ contractId: account.publicKey, savingsBps: bps });
        if (signer && isChainConfigured())
          vaultClient
            .setRate(signer, bps)
            .then(() => get().refreshPosition())
            .catch((e) => console.error("setRate failed:", e));
      },

      recordIncome: (source, kind, amount) => {
        const { savingsBps, signer } = get();
        const saved = Math.round(((amount * savingsBps) / 10000) * 100) / 100;
        const spendable = Math.round((amount - saved) * 100) / 100;
        // optimistic local counters; chain reconciles principal via refreshPosition,
        // and history comes from the indexer (/api/activity), not local state.
        void source;
        void kind;
        set((st) => ({
          principal: st.principal + saved,
          savedThisWeek: st.savedThisWeek + saved,
          savedThisMonth: st.savedThisMonth + saved,
        }));
        if (signer && isChainConfigured())
          vaultClient
            .depositAndSplit(signer, amount)
            .then(() => get().refreshPosition())
            .catch((e) => console.error("depositAndSplit failed:", e));
        return { saved, spendable };
      },

      setMode: (m) => {
        set({ mode: m });
        const { signer } = get();
        if (signer && isChainConfigured())
          vaultClient
            .setMode(signer, m)
            .then(() => get().refreshPosition())
            .catch((e) => console.error("setMode failed:", e));
      },

      // Route a DETECTED incoming payment (income watcher, Phase 4) through the vault's
      // deposit_and_split — saves the user's % slice, leaves the rest spendable. Awaitable
      // (throws on failure) so the caller can mark the pending income routed only on success.
      routeIncome: async (amount) => {
        if (KILL_SWITCH) throw new Error(MAINTENANCE);
        const { savingsBps, signer } = get();
        const saved = Math.round(((amount * savingsBps) / 10000) * 100) / 100;
        const spendable = Math.round((amount - saved) * 100) / 100;
        set((st) => ({
          savedThisWeek: st.savedThisWeek + saved,
          savedThisMonth: st.savedThisMonth + saved,
        }));
        if (signer && isChainConfigured()) {
          await vaultClient.depositAndSplit(signer, amount); // throws on failure
          await get().refreshPosition();
        } else {
          set((st) => ({ principal: st.principal + saved }));
        }
        return { saved, spendable };
      },

      // Claim REAL earned yield on-chain, then reconcile from chain.
      claimYield: async () => {
        if (KILL_SWITCH) throw new Error(MAINTENANCE);
        const amt = get().accruedYield; // claimable before the claim
        const { signer } = get();
        if (signer && isChainConfigured()) {
          await vaultClient.claimYield(signer); // throws on failure
          await get().refreshPosition();
        } else {
          set({ accruedYield: 0 });
        }
        return amt;
      },

      // Withdraw on-chain (venue redeems to the user), then reconcile from chain.
      withdraw: async (amount) => {
        if (KILL_SWITCH) throw new Error(MAINTENANCE);
        const { signer } = get();
        if (signer && isChainConfigured()) {
          await vaultClient.withdraw(signer, amount); // throws on failure
          await get().refreshPosition();
        } else {
          set((st) => ({ principal: Math.max(0, st.principal - amount) }));
        }
      },

      // The claimable (real, venue-earned) yield — what the income "claim" button pays.
      availableIncome: () => get().accruedYield,

      // Reconcile balances from the chain position (source of truth).
      refreshPosition: async () => {
        const { account } = get();
        if (!account || !isChainConfigured()) return;
        set({ syncing: true });
        try {
          const pos = await vaultClient.getPosition(account.publicKey);
          set({
            principal: pos.principal,
            accruedYield: pos.accruedYield,
            savingsBps: pos.savingsBps,
            mode: pos.mode,
            lockedUntil: pos.lockedUntil,
          });
        } catch (e) {
          if (e instanceof NoPositionError) {
            set({ principal: 0, accruedYield: 0 }); // not deposited yet
          } else {
            console.error("refreshPosition failed:", e); // keep last-known optimistic values
          }
        } finally {
          set({ syncing: false });
        }
      },

      // Read the live, variable venue rate (safe-falls-back to the constant).
      refreshRate: async () => {
        const r = await fetchLiveRate();
        set({ liveRate: r.rate, rateSource: r.source });
      },

      // Read the wallet's REAL spendable USDC balance from chain (the "Disponible" figure).
      refreshBalance: async () => {
        const { account } = get();
        if (!account) return;
        set({ walletBalance: await walletUsdcBalance(account.publicKey) });
      },

      // Chain-derived stats (saved this week/month + the deposit streak), from the indexer.
      hydrateStats: async () => {
        const { account } = get();
        if (!account) return;
        const s = await fetchStats(account.publicKey);
        if (s)
          set({ savedThisWeek: s.savedThisWeek, savedThisMonth: s.savedThisMonth, weeks: s.weeks });
      },

      // Restore server-side settings (so a returning user on a new device is correct).
      hydrateProfile: async () => {
        const { account } = get();
        if (!account) return;
        const p = await fetchProfile(account.publicKey);
        if (p?.lang === "es" || p?.lang === "en") set({ lang: p.lang });
        if (typeof p?.savings_bps === "number") set({ savingsBps: p.savings_bps });
      },

      reset: () =>
        set({
          name: "",
          account: null,
          signer: null,
          onboarded: false,
          savingsBps: 1500,
          mode: "grow",
          principal: 0,
          accruedYield: 0,
          walletBalance: 0,
          lockedUntil: null,
          savedThisWeek: 0,
          savedThisMonth: 0,
          weeks: 0,
        }),
    }),
    {
      name: "kova-store",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? window.localStorage
          : { getItem: () => null, setItem: () => {}, removeItem: () => {} }
      ),
      // Persist only ephemeral UI prefs — NEVER financial truth (that comes from chain).
      partialize: (s) => ({
        lang: s.lang,
        name: s.name,
        account: s.account,
        onboarded: s.onboarded,
        savingsBps: s.savingsBps,
        mode: s.mode,
        weeks: s.weeks,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state._hydrated = true;
      },
    }
  )
);

export const YIELD = YIELD_RATE;

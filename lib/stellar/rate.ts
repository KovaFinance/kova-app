import { simulate } from "./client";
import { VENUE_CONTRACT_ID, YIELD_RATE, isChainConfigured } from "./config";

/**
 * Live, VARIABLE yield rate read from the venue (its `rate_bps`). Never throws to the
 * UI — always resolves to a number, falling back to the static NEXT_PUBLIC_YIELD_RATE
 * constant if the venue read is unavailable or out of a sane range. Cached briefly so
 * page renders don't re-simulate.
 */
export type RateSource = "venue" | "fallback";
export interface LiveRate {
  rate: number; // annual, decimal (e.g. 0.045)
  source: RateSource;
  asOf: number; // epoch ms of last refresh (0 = never)
}

const TTL_MS = 5 * 60 * 1000;
const FALLBACK: LiveRate = { rate: YIELD_RATE, source: "fallback", asOf: 0 };

let cache: LiveRate | null = null;

/** Last known rate without hitting the network (seeded with the fallback constant). */
export function cachedRate(): LiveRate {
  return cache ?? FALLBACK;
}

/** Refresh the live rate from the venue; safe-falls-back on any failure/stale read. */
export async function refreshRate(): Promise<LiveRate> {
  if (cache && Date.now() - cache.asOf < TTL_MS) return cache;
  try {
    if (!isChainConfigured() || !VENUE_CONTRACT_ID) throw new Error("venue not configured");
    const bps = await simulate<number>(VENUE_CONTRACT_ID, "rate_bps", []);
    const rate = Number(bps) / 10_000;
    if (!Number.isFinite(rate) || rate < 0 || rate > 0.25) {
      throw new Error(`venue rate out of range: ${rate}`);
    }
    cache = { rate, source: "venue", asOf: Date.now() };
    return cache;
  } catch {
    cache = { rate: YIELD_RATE, source: "fallback", asOf: Date.now() };
    return cache;
  }
}

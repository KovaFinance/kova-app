/**
 * The honest income model: YIELD-ONLY / PERPETUAL.
 * Monthly income = the interest the balance throws off, principal untouched.
 * Income is VARIABLE with the rate — never a guaranteed salary.
 */

/** Monthly income from living off the yield (principal preserved). */
export function monthlyIncome(balance: number, annualRate: number): number {
  return (balance * annualRate) / 12;
}

/** Annual income from yield. */
export function annualIncome(balance: number, annualRate: number): number {
  return balance * annualRate;
}

/**
 * Future value of saving `monthly` for `years`, compounded monthly at
 * `annualRate`. Ordinary annuity. Illustrative only.
 */
export function projectFutureValue(
  monthly: number,
  annualRate: number,
  years: number,
  startingBalance = 0
): number {
  const i = annualRate / 12;
  const n = years * 12;
  const fvContribs = i === 0 ? monthly * n : monthly * ((Math.pow(1 + i, n) - 1) / i);
  const fvStart = startingBalance * Math.pow(1 + i, n);
  return fvContribs + fvStart;
}

/** A year-by-year balance series for charting the projection. */
export function projectionSeries(
  monthly: number,
  annualRate: number,
  years: number,
  startingBalance = 0
): { year: number; balance: number }[] {
  const out: { year: number; balance: number }[] = [];
  for (let y = 0; y <= years; y++) {
    out.push({ year: y, balance: projectFutureValue(monthly, annualRate, y, startingBalance) });
  }
  return out;
}

/** Rough months to reach a target balance given a monthly contribution. */
export function monthsToTarget(
  target: number,
  monthly: number,
  annualRate: number,
  startingBalance = 0
): number {
  if (monthly <= 0) return Infinity;
  const i = annualRate / 12;
  let bal = startingBalance;
  let m = 0;
  while (bal < target && m < 1200) {
    bal = bal * (1 + i) + monthly;
    m++;
  }
  return m;
}

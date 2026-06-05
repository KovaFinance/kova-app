export const usd = (n: number, opts: { cents?: boolean } = {}): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: opts.cents ? 2 : 0,
    maximumFractionDigits: opts.cents ? 2 : 0,
  }).format(n);

/** Split a dollar amount into the big integer part and the ".cc" tail for display. */
export const splitUsd = (n: number): { whole: string; cents: string } => {
  const fixed = n.toFixed(2);
  const [w, c] = fixed.split(".");
  const whole = "$" + Number(w).toLocaleString("en-US");
  return { whole, cents: "." + c };
};

export const pct = (bps: number): string => `${(bps / 100).toFixed(0)}%`;

export const compact = (n: number): string =>
  new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);

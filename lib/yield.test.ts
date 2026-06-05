import { describe, it, expect } from "vitest";
import { monthlyIncome, annualIncome, projectFutureValue, monthsToTarget } from "./yield";

describe("monthlyIncome", () => {
  it("is balance * rate / 12", () => {
    // $120,000 at 4.5%/yr => $450/month
    expect(monthlyIncome(120000, 0.045)).toBeCloseTo(450, 6);
  });
  it("is zero at a zero balance", () => {
    expect(monthlyIncome(0, 0.045)).toBe(0);
  });
});

describe("annualIncome", () => {
  it("is 12x the monthly income", () => {
    expect(annualIncome(120000, 0.045)).toBeCloseTo(monthlyIncome(120000, 0.045) * 12, 6);
  });
});

describe("projectFutureValue", () => {
  it("zero-rate branch is linear contributions + starting balance", () => {
    // 10 years * 12 months * $100 + $500 starting = $12,500
    expect(projectFutureValue(100, 0, 10, 500)).toBe(100 * 120 + 500);
  });
  it("annuity grows above the linear sum when rate > 0", () => {
    expect(projectFutureValue(100, 0.05, 10, 0)).toBeGreaterThan(100 * 120);
  });
  it("compounds the starting balance independently of contributions", () => {
    // monthly=0 => only the starting balance compounds monthly for a year
    expect(projectFutureValue(0, 0.12, 1, 1000)).toBeCloseTo(1000 * Math.pow(1 + 0.01, 12), 6);
  });
});

describe("monthsToTarget", () => {
  it("returns Infinity when the monthly contribution is non-positive", () => {
    expect(monthsToTarget(1000, 0, 0.045, 0)).toBe(Infinity);
  });
  it("reaches a simple zero-rate target in the exact number of months", () => {
    // $100/month, no yield => $1,200 in exactly 12 months
    expect(monthsToTarget(1200, 100, 0, 0)).toBe(12);
  });
});

/**
 * Real-USDC end-to-end on TESTNET (Phase 1 acceptance).
 *
 * Proves the vault moves REAL testnet USDC: set_rate -> deposit_and_split -> position
 * -> withdraw, asserting on-chain balance changes. Uses the installed `stellar` CLI.
 *
 *   npm run e2e:testnet
 *
 * FUNDING (one manual step): testnet USDC comes from Circle's faucet. The script
 * creates+funds an `e2e-user` identity, adds a USDC trustline, then PAUSES and prints
 * the address + faucet URL (https://faucet.circle.com — pick Stellar testnet). It polls
 * the USDC balance until funded, then runs the flow. It also `donate`s some USDC to the
 * venue so claimable yield is backed.
 */
import { execFileSync } from "node:child_process";

try {
  const mod = await import("@next/env");
  (mod.loadEnvConfig ?? mod.default?.loadEnvConfig)?.(process.cwd(), true);
} catch {}

const NET = "testnet";
const VAULT = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ID;
const VENUE = process.env.NEXT_PUBLIC_VENUE_CONTRACT_ID;
const USDC = process.env.NEXT_PUBLIC_USDC_SAC;
const USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const STROOPS = 10_000_000;

if (!VAULT || !VENUE || !USDC) {
  console.error("Set NEXT_PUBLIC_VAULT_CONTRACT_ID / VENUE / USDC_SAC in .env.local first.");
  process.exit(1);
}

const sh = (args, opts = {}) =>
  execFileSync("stellar", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
    ...opts,
  }).trim();
const invoke = (id, fn, args, source = "e2e-user") =>
  sh(["contract", "invoke", "--id", id, "--source", source, "--network", NET, "--", fn, ...args]);
const usdcBalance = (addr) => {
  try {
    return Number(JSON.parse(invoke(USDC, "balance", ["--id", addr]))) / STROOPS;
  } catch {
    return 0;
  }
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

console.log("▶ ensure e2e-user identity (funded with XLM via friendbot)");
try {
  sh(["keys", "generate", "e2e-user", "--network", NET, "--fund"]);
} catch {
  try {
    sh(["keys", "fund", "e2e-user", "--network", NET]);
  } catch {}
}
const USER = sh(["keys", "address", "e2e-user"]);
console.log("  e2e-user:", USER);

console.log("▶ ensure USDC trustline");
try {
  sh([
    "tx",
    "new",
    "change-trust",
    "--source",
    "e2e-user",
    "--network",
    NET,
    "--line",
    `USDC:${USDC_ISSUER}`,
  ]);
} catch (e) {
  console.log("  (trustline may already exist)");
}

if (usdcBalance(USER) <= 0) {
  console.log("\n⏸  FUND USDC: open https://faucet.circle.com , pick Stellar testnet, paste:");
  console.log("    " + USER);
  console.log("   waiting for USDC to arrive (Ctrl-C to abort)…");
  for (let i = 0; i < 120 && usdcBalance(USER) <= 0; i++) await sleep(5000);
}
const startBal = usdcBalance(USER);
if (startBal <= 0) {
  console.error("✗ no USDC funded; aborting.");
  process.exit(1);
}
console.log(`  USDC balance: ${startBal}`);

// back the venue so claimable yield can be paid
console.log("▶ donate USDC to venue (backs yield growth)");
try {
  invoke(VENUE, "donate", ["--from", "e2e-user", "--amount", String(5 * STROOPS)]);
} catch {}

console.log("▶ set_rate 1500 bps");
invoke(VAULT, "set_rate", ["--user", USER, "--savings_bps", "1500"]);

console.log("▶ deposit_and_split 100 USDC (saves 15)");
invoke(VAULT, "deposit_and_split", ["--user", USER, "--amount", String(100 * STROOPS)]);
const pos1 = JSON.parse(invoke(VAULT, "position", ["--user", USER]));
const principal1 = Number(pos1.principal) / STROOPS;
const afterDeposit = usdcBalance(USER);
console.log(`  position.principal=${principal1}  user USDC ${startBal}->${afterDeposit}`);
assert(Math.abs(principal1 - 15) < 0.01, `principal should be 15, got ${principal1}`);
assert(
  Math.abs(startBal - afterDeposit - 20) < 0.5,
  `user should be down ~15-20 USDC (15 saved + 5 donated)`
);

console.log("▶ withdraw 5 USDC");
invoke(VAULT, "withdraw", ["--user", USER, "--amount", String(5 * STROOPS)]);
const pos2 = JSON.parse(invoke(VAULT, "position", ["--user", USER]));
const principal2 = Number(pos2.principal) / STROOPS;
console.log(`  position.principal=${principal2} (expect ~10)`);
assert(Math.abs(principal2 - 10) < 0.01, `principal should be 10, got ${principal2}`);

console.log("\n✅ e2e PASS — real USDC moved through the vault on testnet.");

function assert(cond, msg) {
  if (!cond) {
    console.error("✗ ASSERT:", msg);
    process.exit(1);
  }
}

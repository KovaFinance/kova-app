#![cfg(test)]
//! Unit tests for the adapter's pure conversion math (b_rate → NAV, shares → underlying).
//! The live Blend supply/withdraw/NAV path is verified by compiling against `blend-contract-sdk`
//! (interface match) + a testnet deploy against the real pool — not exercised here.
use super::{nav_from_b_rate, underlying_from_shares, NAV_ONE, SCALAR_12};

#[test]
fn nav_tracks_b_rate() {
    // b_rate = 1.0 (1e12) → NAV_ONE (1.0 in the 1e7 scale)
    assert_eq!(nav_from_b_rate(SCALAR_12), NAV_ONE);
    // b_rate = 1.05 → 5% above NAV_ONE (yield)
    assert_eq!(nav_from_b_rate(SCALAR_12 * 105 / 100), NAV_ONE * 105 / 100);
    // uninitialized / nonsense guard → 1.0
    assert_eq!(nav_from_b_rate(0), NAV_ONE);
    assert_eq!(nav_from_b_rate(-1), NAV_ONE);
}

#[test]
fn underlying_value_grows_with_b_rate() {
    let shares = 100 * NAV_ONE; // 100 b-tokens (1e7-scaled)
    // at b_rate 1.0, 100 b-tokens == 100 USDC
    assert_eq!(underlying_from_shares(shares, SCALAR_12), shares);
    // at b_rate 1.10, worth 10% more
    assert_eq!(underlying_from_shares(shares, SCALAR_12 * 110 / 100), shares * 110 / 100);
}

#[test]
fn nav_and_underlying_match_the_vaults_redeem_math() {
    // redeem(shares) must equal shares * nav / NAV_ONE — the exact formula the vault uses.
    let shares = 250 * NAV_ONE;
    let b_rate = SCALAR_12 * 1234 / 1000; // 1.234
    let nav = nav_from_b_rate(b_rate);
    assert_eq!(underlying_from_shares(shares, b_rate), shares * nav / NAV_ONE);
}

#![no_std]
//! TEST-ONLY MOCK YIELD VENUE — NEVER DEPLOY TO MAINNET.
//!
//! Simulates a real yield venue (a lending pool like Blend, or a tokenized T-bill like
//! Ondo USDY / Spiko) as a share vault whose NAV-per-share grows at a fixed annual rate.
//! It is pre-funded (see `donate`) so that NAV growth is backed by real tokens it can pay
//! out — i.e. the vault earns REAL token yield from a venue, not a fabricated balance.
//!
//! The Kova vault calls this through a fixed entrypoint surface — `deposit_credit`,
//! `redeem`, `nav_per_share`, `rate_bps` — so on mainnet it is swapped for a real venue
//! adapter (Blend pool / T-bill) implementing the same surface, with NO vault source change.
//!
//! TEST-ONLY trust model: `deposit_credit` mints shares for funds the caller has ALREADY
//! transferred in (transfer-then-credit, to avoid cross-contract auth ceremony), and
//! `redeem` has no per-caller access control. The sole caller on testnet is the Kova vault.
use soroban_sdk::{contract, contracterror, contractimpl, contracttype, token, Address, Env};

const SECONDS_PER_YEAR: i128 = 31_536_000;
const BPS_DENOM: i128 = 10_000;
/// 1.0 in 1e7 fixed point (matches USDC's 7 decimals).
const NAV_ONE: i128 = 10_000_000;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Token,
    RateBps,
    NavScaled,
    Last,
    TotalShares,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Error {
    NotInit = 1,
    AlreadyInit = 2,
    BadAmount = 3,
}

#[contract]
pub struct MockVenue;

#[contractimpl]
impl MockVenue {
    pub fn init(env: Env, admin: Address, token: Address, rate_bps: u32) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInit);
        }
        admin.require_auth();
        let i = env.storage().instance();
        i.set(&DataKey::Admin, &admin);
        i.set(&DataKey::Token, &token);
        i.set(&DataKey::RateBps, &rate_bps);
        i.set(&DataKey::NavScaled, &NAV_ONE);
        i.set(&DataKey::Last, &env.ledger().timestamp());
        i.set(&DataKey::TotalShares, &0i128);
        Ok(())
    }

    /// Admin-set annualized rate (bps). Locks in growth at the old rate first.
    pub fn set_rate(env: Env, rate_bps: u32) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInit)?;
        admin.require_auth();
        Self::touch(&env);
        env.storage().instance().set(&DataKey::RateBps, &rate_bps);
        Ok(())
    }

    pub fn rate_bps(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::RateBps).unwrap_or(0)
    }

    /// NAV per share (1e7-scaled), grown to "now". View — does not persist.
    pub fn nav_per_share(env: Env) -> i128 {
        Self::current_nav(&env)
    }

    pub fn total_shares(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::TotalShares).unwrap_or(0)
    }

    /// TEST-ONLY: pre-fund the venue so NAV growth is backed by real tokens.
    pub fn donate(env: Env, from: Address, amount: i128) -> Result<(), Error> {
        if amount <= 0 {
            return Err(Error::BadAmount);
        }
        from.require_auth();
        Self::token(&env).transfer(&from, &env.current_contract_address(), &amount);
        Ok(())
    }

    /// Mint shares for `amount` USDC the caller has ALREADY transferred to the venue.
    pub fn deposit_credit(env: Env, amount: i128) -> Result<i128, Error> {
        if amount <= 0 {
            return Err(Error::BadAmount);
        }
        Self::touch(&env);
        let nav: i128 = env.storage().instance().get(&DataKey::NavScaled).unwrap();
        let shares = amount * NAV_ONE / nav;
        let total: i128 = env.storage().instance().get(&DataKey::TotalShares).unwrap_or(0);
        env.storage().instance().set(&DataKey::TotalShares, &(total + shares));
        Ok(shares)
    }

    /// Burn `shares`, pay their USDC value to `to`. Returns USDC paid.
    pub fn redeem(env: Env, to: Address, shares: i128) -> Result<i128, Error> {
        if shares <= 0 {
            return Err(Error::BadAmount);
        }
        Self::touch(&env);
        let nav: i128 = env.storage().instance().get(&DataKey::NavScaled).unwrap();
        let amount = shares * nav / NAV_ONE;
        let total: i128 = env.storage().instance().get(&DataKey::TotalShares).unwrap_or(0);
        env.storage().instance().set(&DataKey::TotalShares, &(total - shares));
        Self::token(&env).transfer(&env.current_contract_address(), &to, &amount);
        Ok(amount)
    }

    // ----------------------------------------------------------------- internals
    fn token(env: &Env) -> token::Client {
        let addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        token::Client::new(env, &addr)
    }

    /// NAV grown to now (linear at the current rate over the elapsed window).
    fn current_nav(env: &Env) -> i128 {
        let nav: i128 = env
            .storage()
            .instance()
            .get(&DataKey::NavScaled)
            .unwrap_or(NAV_ONE);
        let last: u64 = env.storage().instance().get(&DataKey::Last).unwrap_or(0);
        let now = env.ledger().timestamp();
        if now <= last {
            return nav;
        }
        let rate = Self::rate_bps(env.clone()) as i128;
        let elapsed = (now - last) as i128;
        nav + nav * rate * elapsed / (BPS_DENOM * SECONDS_PER_YEAR)
    }

    /// Persist NAV grown to now and reset the accrual clock.
    fn touch(env: &Env) {
        let nav = Self::current_nav(env);
        let i = env.storage().instance();
        i.set(&DataKey::NavScaled, &nav);
        i.set(&DataKey::Last, &env.ledger().timestamp());
    }
}

mod test;

#![no_std]
//! Kova venue adapter for the **Blend v2** lending pool. It implements the SAME venue surface
//! the Kova vault already calls — `deposit_credit` / `redeem` / `nav_per_share` / `rate_bps` —
//! backed by REAL Blend supply yield instead of the TEST-ONLY mock venue. It's a drop-in
//! replacement: point the vault's `venue` at this contract, no vault source change.
//!
//! Model: the vault transfers the saved USDC into this adapter, then calls `deposit_credit`.
//! The adapter SUPPLIES that USDC into Blend (RequestType::Supply) and reports the b-tokens
//! minted as the venue "shares". b-tokens appreciate as Blend's `b_rate` rises (real lending
//! interest), so `nav_per_share` (= b_rate scaled to the vault's 1e7 NAV) grows — that growth
//! IS the yield. `redeem` withdraws (RequestType::Withdraw) a share-slice's USDC straight to
//! the user. Principal-preservation + yield accounting live in the vault, unchanged.
//!
//! VERIFICATION STATUS: the Blend calls are type-checked against `blend-contract-sdk` (the
//! official client + contracttypes), so the call/struct shapes match Blend v2 exactly. The
//! LIVE supply/withdraw/NAV behavior + the cross-contract auth MUST still be deploy-tested
//! against the testnet Blend pool (CCEBVDYM…) before real use. The unit tests below cover the
//! adapter's own conversion math, not the live pool.
use blend_contract_sdk::pool::{Client as PoolClient, Request};
use soroban_sdk::{
    auth::{ContractContext, InvokerContractAuthEntry, SubContractInvocation},
    contract, contracterror, contractimpl, contracttype, vec, Address, Env, IntoVal, Symbol, Val,
    Vec,
};

/// 1.0 in the vault's NAV scale (USDC 7 decimals).
const NAV_ONE: i128 = 10_000_000;
/// Blend scales `b_rate` by 1e12 (SCALAR_12).
const SCALAR_12: i128 = 1_000_000_000_000;

/// Blend RequestType wire values (u32): Supply = 0, Withdraw = 1.
const REQ_SUPPLY: u32 = 0;
const REQ_WITHDRAW: u32 = 1;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Token,        // USDC SAC address (the supplied asset)
    Pool,         // Blend pool contract
    Vault,        // the Kova vault — the ONLY address allowed to deposit_credit / redeem
    ReserveIndex, // index of the USDC reserve inside the pool (read from Positions.supply)
    RateBps,      // display-only nominal rate (Blend's real APR is read live by clients)
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Error {
    NotInit = 1,
    AlreadyInit = 2,
    BadAmount = 3,
}

// ----------------------------------------------------------------- pure conversion math
// Extracted so the value/share arithmetic is unit-testable without a live Blend pool.

/// b_rate (1e12-scaled) → NAV-per-share in the vault's 1e7 scale. b_rate 1e12 == 1.0 == NAV_ONE.
fn nav_from_b_rate(b_rate: i128) -> i128 {
    if b_rate <= 0 {
        return NAV_ONE;
    }
    b_rate * NAV_ONE / SCALAR_12
}

/// USDC underlying value of `shares` b-tokens at `b_rate`.
fn underlying_from_shares(shares: i128, b_rate: i128) -> i128 {
    shares * b_rate / SCALAR_12
}

#[contract]
pub struct BlendAdapter;

#[contractimpl]
impl BlendAdapter {
    /// One-time setup. `reserve_index` is the USDC reserve's index inside `pool` (look it up
    /// once off-chain; it keys the b-token balance in `Positions.supply`).
    pub fn init(
        env: Env,
        admin: Address,
        token: Address,
        pool: Address,
        vault: Address,
        reserve_index: u32,
        rate_bps: u32,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInit);
        }
        admin.require_auth();
        let i = env.storage().instance();
        i.set(&DataKey::Admin, &admin);
        i.set(&DataKey::Token, &token);
        i.set(&DataKey::Pool, &pool);
        i.set(&DataKey::Vault, &vault);
        i.set(&DataKey::ReserveIndex, &reserve_index);
        i.set(&DataKey::RateBps, &rate_bps);
        Ok(())
    }

    /// Gate: only the configured Kova vault may move funds (deposit_credit / redeem). When the
    /// vault calls cross-contract it IS the invoker, so its require_auth is auto-satisfied; any
    /// other caller cannot supply the vault's auth and is rejected — so no one can drain the
    /// adapter's Blend position.
    fn require_vault(env: &Env) -> Result<(), Error> {
        let vault: Address = env
            .storage()
            .instance()
            .get(&DataKey::Vault)
            .ok_or(Error::NotInit)?;
        vault.require_auth();
        Ok(())
    }

    /// Display-only nominal rate (admin). Clients read Blend's live APR off-chain.
    pub fn set_rate(env: Env, rate_bps: u32) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInit)?;
        admin.require_auth();
        env.storage().instance().set(&DataKey::RateBps, &rate_bps);
        Ok(())
    }

    pub fn rate_bps(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::RateBps).unwrap_or(0)
    }

    /// NAV per share (1e7-scaled), derived live from Blend's current `b_rate`.
    pub fn nav_per_share(env: Env) -> i128 {
        nav_from_b_rate(Self::b_rate(&env))
    }

    /// The adapter's total b-token (share) balance held in the Blend pool.
    pub fn total_shares(env: Env) -> i128 {
        let pool_addr: Address = env.storage().instance().get(&DataKey::Pool).unwrap();
        let idx: u32 = env.storage().instance().get(&DataKey::ReserveIndex).unwrap();
        let pool = PoolClient::new(&env, &pool_addr);
        pool.get_positions(&env.current_contract_address())
            .supply
            .get(idx)
            .unwrap_or(0)
    }

    /// Supply USDC (already transferred into this adapter by the vault) into Blend. Returns the
    /// b-tokens minted = the venue "shares" for this deposit (the exact on-chain delta).
    pub fn deposit_credit(env: Env, amount: i128) -> Result<i128, Error> {
        Self::require_vault(&env)?;
        if amount <= 0 {
            return Err(Error::BadAmount);
        }
        let me = env.current_contract_address();
        let token: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let pool_addr: Address = env.storage().instance().get(&DataKey::Pool).unwrap();
        let idx: u32 = env.storage().instance().get(&DataKey::ReserveIndex).unwrap();
        let pool = PoolClient::new(&env, &pool_addr);

        let before = pool.get_positions(&me).supply.get(idx).unwrap_or(0);

        // Pre-authorize the nested USDC transfer (adapter -> pool) the pool performs on Supply.
        let args: Vec<Val> = vec![
            &env,
            me.into_val(&env),
            pool_addr.into_val(&env),
            amount.into_val(&env),
        ];
        env.authorize_as_current_contract(vec![
            &env,
            InvokerContractAuthEntry::Contract(SubContractInvocation {
                context: ContractContext {
                    contract: token.clone(),
                    fn_name: Symbol::new(&env, "transfer"),
                    args,
                },
                sub_invocations: vec![&env],
            }),
        ]);

        let mut requests: Vec<Request> = vec![&env];
        requests.push_back(Request {
            request_type: REQ_SUPPLY,
            address: token,
            amount,
        });
        let positions = pool.submit(&me, &me, &me, &requests);

        let after = positions.supply.get(idx).unwrap_or(0);
        Ok(after - before)
    }

    /// Redeem `shares` b-tokens: withdraw their USDC value from Blend straight to `to`.
    pub fn redeem(env: Env, to: Address, shares: i128) -> Result<i128, Error> {
        Self::require_vault(&env)?;
        if shares <= 0 {
            return Err(Error::BadAmount);
        }
        let me = env.current_contract_address();
        let token: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let pool_addr: Address = env.storage().instance().get(&DataKey::Pool).unwrap();
        let idx: u32 = env.storage().instance().get(&DataKey::ReserveIndex).unwrap();
        let pool = PoolClient::new(&env, &pool_addr);

        let b_rate = Self::b_rate(&env);
        let underlying = underlying_from_shares(shares, b_rate);

        let before = pool.get_positions(&me).supply.get(idx).unwrap_or(0);
        let mut requests: Vec<Request> = vec![&env];
        requests.push_back(Request {
            request_type: REQ_WITHDRAW,
            address: token,
            amount: underlying,
        });
        // Blend sends the withdrawn USDC from the pool directly to `to`.
        let positions = pool.submit(&me, &me, &to, &requests);

        // Return the USDC value actually realized = the b-tokens Blend actually burned * b_rate
        // (Blend caps at balance + rounds), not the requested amount — so the vault's accounting
        // matches the funds that really moved.
        let after = positions.supply.get(idx).unwrap_or(0);
        let burned = if before > after { before - after } else { 0 };
        Ok(underlying_from_shares(burned, b_rate))
    }

    // ----------------------------------------------------------------- internals
    fn b_rate(env: &Env) -> i128 {
        let token: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let pool_addr: Address = env.storage().instance().get(&DataKey::Pool).unwrap();
        let pool = PoolClient::new(env, &pool_addr);
        pool.get_reserve(&token).data.b_rate
    }
}

mod test;

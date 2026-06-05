#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, token, vec, Address, Env, IntoVal, Symbol,
};

/// 1.0 in 1e7 fixed point (matches USDC's 7 decimals and the venue's NAV scale).
const NAV_ONE: i128 = 10_000_000;

pub const MODE_GROW: u32 = 0;
pub const MODE_INCOME: u32 = 1;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Token,    // USDC Stellar Asset Contract address
    Venue,    // yield venue contract (TEST-ONLY mock on testnet; real adapter on mainnet)
    YieldBps, // display-only fallback rate metadata; NOT used to mint payouts anymore
    Pos(Address),
}

/// A user's vault position. The savings principal is deployed into the venue as
/// `shares`; real yield = current share value (shares*nav) minus the `principal`
/// cost basis. `principal` only ever decreases on withdraw — never on claim — which
/// makes principal-preservation provable.
#[contracttype]
#[derive(Clone)]
pub struct Position {
    pub principal: i128,   // USDC cost basis routed into the venue, in stroops
    pub shares: i128,      // venue shares held on the user's behalf (1e7-scaled)
    pub savings_bps: u32,  // e.g. 1500 = 15%
    pub mode: u32,         // 0 = grow, 1 = income
    pub locked_until: u64, // 0 = no lock; unix seconds
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Error {
    NotInit = 1,
    AlreadyInit = 2,
    NoPosition = 3,
    Insufficient = 4,
    Locked = 5,
    BadAmount = 6,
}

#[contract]
pub struct VaultContract;

#[contractimpl]
impl VaultContract {
    /// One-time setup. `venue` is the yield venue the savings slice is deployed into.
    /// `yield_bps` is kept only as display-fallback metadata.
    pub fn init(
        env: Env,
        admin: Address,
        token: Address,
        venue: Address,
        yield_bps: u32,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInit);
        }
        admin.require_auth();
        let i = env.storage().instance();
        i.set(&DataKey::Admin, &admin);
        i.set(&DataKey::Token, &token);
        i.set(&DataKey::Venue, &venue);
        i.set(&DataKey::YieldBps, &yield_bps);
        Ok(())
    }

    /// Display-only fallback rate metadata (admin). Not used to mint yield.
    pub fn set_yield(env: Env, yield_bps: u32) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInit)?;
        admin.require_auth();
        env.storage().instance().set(&DataKey::YieldBps, &yield_bps);
        Ok(())
    }

    /// Configure the user's savings percentage (creates the position if new).
    pub fn set_rate(env: Env, user: Address, savings_bps: u32) -> Result<(), Error> {
        user.require_auth();
        let mut pos = Self::load_or_new(&env, &user);
        pos.savings_bps = savings_bps;
        Self::save(&env, &user, &pos);
        Ok(())
    }

    /// Route an income payment: keep the savings slice (deployed into the venue),
    /// leave the remainder spendable. Returns the spendable amount. Pulls only the
    /// saved slice from the user (they keep the rest).
    pub fn deposit_and_split(env: Env, user: Address, amount: i128) -> Result<i128, Error> {
        if amount <= 0 {
            return Err(Error::BadAmount);
        }
        user.require_auth();
        let mut pos = Self::load_or_new(&env, &user);

        let saved = amount * (pos.savings_bps as i128) / 10_000;
        let spendable = amount - saved;

        if saved > 0 {
            // Move the saved slice straight into the venue, then mint shares for it.
            let venue = Self::venue_addr(&env);
            Self::token(&env).transfer(&user, &venue, &saved);
            let minted = Self::venue_deposit(&env, saved);
            pos.principal += saved;
            pos.shares += minted;
        }
        Self::save(&env, &user, &pos);

        env.events().publish(
            (Symbol::new(&env, "split"), user.clone()),
            (amount, saved, spendable),
        );
        Ok(spendable)
    }

    /// Toggle GROW (0) <-> INCOME (1).
    pub fn set_mode(env: Env, user: Address, mode: u32) -> Result<(), Error> {
        user.require_auth();
        let mut pos = Self::load(&env, &user)?;
        pos.mode = mode;
        Self::save(&env, &user, &pos);
        env.events()
            .publish((Symbol::new(&env, "mode"), user.clone()), mode);
        Ok(())
    }

    /// Claim REAL earned yield: redeem only the venue shares whose value exceeds the
    /// principal cost basis, and pay it to the user. Principal is preserved (never
    /// reduced here). Independent of any lock.
    pub fn claim_yield(env: Env, user: Address) -> Result<i128, Error> {
        user.require_auth();
        let mut pos = Self::load(&env, &user)?;
        let nav = Self::venue_nav(&env);
        let value = pos.shares * nav / NAV_ONE;
        let earned = if value > pos.principal { value - pos.principal } else { 0 };

        let mut paid = 0i128;
        if earned > 0 {
            // floor share redemption so remaining value never drops below principal
            let mut to_redeem = earned * NAV_ONE / nav;
            if to_redeem > pos.shares {
                to_redeem = pos.shares;
            }
            if to_redeem > 0 {
                paid = Self::venue_redeem(&env, &user, to_redeem);
                pos.shares -= to_redeem;
            }
        }
        Self::save(&env, &user, &pos);
        env.events()
            .publish((Symbol::new(&env, "claim"), user.clone()), paid);
        Ok(paid)
    }

    /// Withdraw principal (subject to any lock) by redeeming the corresponding venue
    /// shares; the venue pays the user directly.
    pub fn withdraw(env: Env, user: Address, amount: i128) -> Result<(), Error> {
        if amount <= 0 {
            return Err(Error::BadAmount);
        }
        user.require_auth();
        let mut pos = Self::load(&env, &user)?;

        if pos.locked_until > env.ledger().timestamp() {
            return Err(Error::Locked);
        }
        if amount > pos.principal {
            return Err(Error::Insufficient);
        }

        let nav = Self::venue_nav(&env);
        let mut to_redeem = amount * NAV_ONE / nav; // floor: never over-redeem the vault
        if to_redeem > pos.shares {
            to_redeem = pos.shares;
        }
        Self::venue_redeem(&env, &user, to_redeem);
        pos.principal -= amount;
        pos.shares -= to_redeem;
        Self::save(&env, &user, &pos);
        env.events()
            .publish((Symbol::new(&env, "withdraw"), user.clone()), amount);
        Ok(())
    }

    /// Optional voluntary lock until a unix timestamp.
    pub fn lock(env: Env, user: Address, until: u64) -> Result<(), Error> {
        user.require_auth();
        let mut pos = Self::load(&env, &user)?;
        pos.locked_until = until;
        Self::save(&env, &user, &pos);
        Ok(())
    }

    /// Read a position (stored; no synthetic accrual).
    pub fn position(env: Env, user: Address) -> Result<Position, Error> {
        Self::load(&env, &user)
    }

    /// REAL claimable yield for a user = current venue share value − principal cost basis.
    pub fn claimable_yield(env: Env, user: Address) -> Result<i128, Error> {
        let pos = Self::load(&env, &user)?;
        let nav = Self::venue_nav(&env);
        let value = pos.shares * nav / NAV_ONE;
        Ok(if value > pos.principal { value - pos.principal } else { 0 })
    }

    pub fn yield_bps(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::YieldBps).unwrap_or(450)
    }

    pub fn venue(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Venue).unwrap()
    }

    // ----------------------------------------------------------------- internals
    fn token(env: &Env) -> token::Client {
        let addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        token::Client::new(env, &addr)
    }

    fn venue_addr(env: &Env) -> Address {
        env.storage().instance().get(&DataKey::Venue).unwrap()
    }

    fn venue_nav(env: &Env) -> i128 {
        let venue = Self::venue_addr(env);
        env.invoke_contract(&venue, &Symbol::new(env, "nav_per_share"), vec![env])
    }

    fn venue_deposit(env: &Env, amount: i128) -> i128 {
        let venue = Self::venue_addr(env);
        env.invoke_contract(
            &venue,
            &Symbol::new(env, "deposit_credit"),
            vec![env, amount.into_val(env)],
        )
    }

    fn venue_redeem(env: &Env, to: &Address, shares: i128) -> i128 {
        let venue = Self::venue_addr(env);
        env.invoke_contract(
            &venue,
            &Symbol::new(env, "redeem"),
            vec![env, to.into_val(env), shares.into_val(env)],
        )
    }

    fn load(env: &Env, user: &Address) -> Result<Position, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Pos(user.clone()))
            .ok_or(Error::NoPosition)
    }

    fn load_or_new(env: &Env, user: &Address) -> Position {
        env.storage()
            .persistent()
            .get(&DataKey::Pos(user.clone()))
            .unwrap_or(Position {
                principal: 0,
                shares: 0,
                savings_bps: 1500,
                mode: MODE_GROW,
                locked_until: 0,
            })
    }

    fn save(env: &Env, user: &Address, pos: &Position) {
        env.storage()
            .persistent()
            .set(&DataKey::Pos(user.clone()), pos);
    }
}

mod test;

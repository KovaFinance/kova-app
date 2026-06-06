#![cfg(test)]
use super::*;
use mock_venue::{MockVenue, MockVenueClient};
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token, Address, Env,
};

const YEAR: u64 = 31_536_000;

struct Fixture {
    env: Env,
    user: Address,
    client: VaultContractClient<'static>,
    venue: MockVenueClient<'static>,
    token: token::StellarAssetClient<'static>,
    token_addr: Address,
}

fn setup() -> Fixture {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    // test USDC SAC
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let token_addr = sac.address();
    let ta = token::StellarAssetClient::new(&env, &token_addr);
    ta.mint(&user, &10_000_0000000i128); // 10,000 USDC to the user

    // mock venue @ 4.5%/yr, pre-funded so NAV growth is backed by real tokens
    let venue_id = env.register(MockVenue, ());
    let venue = MockVenueClient::new(&env, &venue_id);
    venue.init(&admin, &token_addr, &450u32);
    let funder = Address::generate(&env);
    ta.mint(&funder, &100_000_0000000i128);
    venue.donate(&funder, &50_000_0000000i128); // backing for yield growth

    // vault, initialized against the venue
    let contract_id = env.register(VaultContract, ());
    let client = VaultContractClient::new(&env, &contract_id);
    client.init(&admin, &token_addr, &venue_id, &450u32);

    Fixture { env, user, client, venue, token: ta, token_addr }
}

#[test]
fn deposit_splits_15_percent_and_routes_to_venue() {
    let f = setup();
    f.client.set_rate(&f.user, &1500u32);
    let spendable = f.client.deposit_and_split(&f.user, &100_0000000i128); // 100 USDC
    assert_eq!(spendable, 85_0000000i128);
    let pos = f.client.position(&f.user);
    assert_eq!(pos.principal, 15_0000000i128); // 15 USDC saved
    assert_eq!(pos.savings_bps, 1500);
    assert!(pos.shares > 0, "savings routed into venue shares");
    // at NAV 1.0 shares ~= principal
    assert_eq!(pos.shares, 15_0000000i128);
    // venue holds the saved USDC (plus its donated backing)
    assert!(f.venue.total_shares() >= 15_0000000i128);
}

#[test]
fn deposit_routes_real_usdc_into_venue() {
    let f = setup();
    let tok = token::Client::new(&f.env, &f.token_addr);
    let venue_addr = f.client.venue();
    let before = tok.balance(&venue_addr);
    f.client.set_rate(&f.user, &2000u32);
    f.client.deposit_and_split(&f.user, &100_0000000i128); // saves 20 USDC
    let after = tok.balance(&venue_addr);
    assert_eq!(after - before, 20_0000000i128); // 20 USDC actually moved into the venue
}

#[test]
fn nav_advance_increases_claimable_and_claim_pays_real_yield() {
    let f = setup();
    f.client.set_rate(&f.user, &10000u32); // save 100%
    f.client.deposit_and_split(&f.user, &1_000_0000000i128); // save 1,000 USDC
    assert_eq!(f.client.claimable_yield(&f.user), 0); // no time elapsed

    f.env.ledger().with_mut(|l| l.timestamp += YEAR);
    let claimable = f.client.claimable_yield(&f.user);
    assert!(claimable > 40_0000000i128 && claimable < 50_0000000i128, "claimable={}", claimable); // ~4.5% of 1000

    let tok = token::Client::new(&f.env, &f.token_addr);
    let bal_before = tok.balance(&f.user);
    let paid = f.client.claim_yield(&f.user);
    assert!(paid > 0 && (paid - claimable).abs() < 1000, "paid={} claimable={}", paid, claimable);
    assert_eq!(tok.balance(&f.user) - bal_before, paid); // user actually received USDC
}

#[test]
fn claim_preserves_principal() {
    let f = setup();
    f.client.set_rate(&f.user, &10000u32);
    f.client.deposit_and_split(&f.user, &1_000_0000000i128);
    let principal = f.client.position(&f.user).principal;

    f.env.ledger().with_mut(|l| l.timestamp += YEAR);
    f.client.claim_yield(&f.user);
    let pos = f.client.position(&f.user);
    // principal unchanged by a claim, and remaining share value still covers principal
    assert_eq!(pos.principal, principal);
    let nav = f.venue.nav_per_share();
    let value = pos.shares * nav / 10_000_000;
    assert!(value >= pos.principal - 100, "value={} principal={}", value, pos.principal);
    // claimable resets to ~0 after claiming
    assert!(f.client.claimable_yield(&f.user) < 1_0000000i128);
}

#[test]
fn keeper_claims_yield_for_user_and_user_receives_it() {
    let f = setup();
    let keeper = Address::generate(&f.env);
    f.client.set_keeper(&keeper);
    f.client.set_rate(&f.user, &10000u32); // save 100%
    f.client.deposit_and_split(&f.user, &1_000_0000000i128); // 1,000 USDC principal
    f.client.set_mode(&f.user, &MODE_INCOME); // user opts into auto-payouts on-chain
    f.env.ledger().with_mut(|l| l.timestamp += YEAR);

    let principal = f.client.position(&f.user).principal;
    let claimable = f.client.claimable_yield(&f.user);
    assert!(claimable > 40_0000000i128, "claimable={}", claimable);

    let tok = token::Client::new(&f.env, &f.token_addr);
    let user_before = tok.balance(&f.user);
    let keeper_before = tok.balance(&keeper);

    // KEEPER triggers the payout (not the user) — income-mode auto-claim.
    let paid = f.client.claim_yield_for(&f.user);

    // the call was authorized by the KEEPER, and the user did NOT have to authorize it.
    let auths = f.env.auths();
    assert!(auths.iter().any(|(a, _)| a == &keeper), "keeper authorized the payout");
    assert!(!auths.iter().any(|(a, _)| a == &f.user), "user did NOT authorize");

    // funds went to the USER, never the keeper (no custody), and principal is preserved.
    assert!(paid > 0 && (paid - claimable).abs() < 1000, "paid={} claimable={}", paid, claimable);
    assert_eq!(tok.balance(&f.user) - user_before, paid, "user received the yield");
    assert_eq!(tok.balance(&keeper) - keeper_before, 0, "keeper received nothing");
    assert_eq!(f.client.position(&f.user).principal, principal, "principal preserved");
    assert!(f.client.claimable_yield(&f.user) < 1_0000000i128, "claimable reset");

    // a second keeper run with no new yield is a safe no-op (pays 0).
    assert_eq!(f.client.claim_yield_for(&f.user), 0);
}

#[test]
fn claim_yield_for_requires_keeper_to_be_set() {
    let f = setup();
    f.client.set_rate(&f.user, &1000u32);
    f.client.deposit_and_split(&f.user, &100_0000000i128);
    // no keeper designated yet
    assert_eq!(
        f.client.try_claim_yield_for(&f.user).err().unwrap().unwrap(),
        Error::NoKeeper
    );
}

#[test]
fn keeper_cannot_force_claim_for_grow_mode_user() {
    let f = setup();
    let keeper = Address::generate(&f.env);
    f.client.set_keeper(&keeper);
    f.client.set_rate(&f.user, &10000u32);
    f.client.deposit_and_split(&f.user, &500_0000000i128); // default GROW mode (no opt-in)
    f.env.ledger().with_mut(|l| l.timestamp += YEAR);
    assert!(f.client.claimable_yield(&f.user) > 0, "yield has accrued");

    // the keeper may NOT force a payout: the user never opted into income mode on-chain.
    assert_eq!(
        f.client.try_claim_yield_for(&f.user).err().unwrap().unwrap(),
        Error::NotIncomeMode
    );
    // the user can still claim their own yield directly whenever they choose.
    assert!(f.client.claim_yield(&f.user) > 0);
}

#[test]
fn withdraw_redeems_principal_from_venue() {
    let f = setup();
    f.client.set_rate(&f.user, &10000u32);
    f.client.deposit_and_split(&f.user, &100_0000000i128); // save 100 USDC
    let tok = token::Client::new(&f.env, &f.token_addr);
    let bal_before = tok.balance(&f.user);
    f.client.withdraw(&f.user, &40_0000000i128);
    let pos = f.client.position(&f.user);
    assert_eq!(pos.principal, 60_0000000i128);
    // user received ~40 USDC back from the venue
    let got = tok.balance(&f.user) - bal_before;
    assert!((got - 40_0000000i128).abs() < 1000, "got={}", got);
}

#[test]
fn lock_blocks_withdraw_but_not_claim() {
    let f = setup();
    f.client.set_rate(&f.user, &10000u32);
    f.client.deposit_and_split(&f.user, &500_0000000i128);
    let until = f.env.ledger().timestamp() + 1000;
    f.client.lock(&f.user, &until);

    // withdraw blocked while locked
    assert_eq!(
        f.client.try_withdraw(&f.user, &10_0000000i128).err().unwrap().unwrap(),
        Error::Locked
    );
    // claim still works while locked
    f.env.ledger().with_mut(|l| l.timestamp += YEAR);
    let paid = f.client.claim_yield(&f.user);
    assert!(paid > 0, "claim works under lock");

    // after lock expires, withdraw works (lock was set to now+1000, year advance passed it)
    f.client.withdraw(&f.user, &10_0000000i128);
    assert_eq!(f.client.position(&f.user).principal, 490_0000000i128);
}

#[test]
fn withdraw_insufficient_and_bad_amounts() {
    let f = setup();
    f.client.set_rate(&f.user, &10000u32);
    f.client.deposit_and_split(&f.user, &50_0000000i128); // 50 USDC principal
    assert_eq!(
        f.client.try_withdraw(&f.user, &60_0000000i128).err().unwrap().unwrap(),
        Error::Insufficient
    );
    assert_eq!(
        f.client.try_withdraw(&f.user, &0).err().unwrap().unwrap(),
        Error::BadAmount
    );
    assert_eq!(
        f.client.try_deposit_and_split(&f.user, &0).err().unwrap().unwrap(),
        Error::BadAmount
    );
}

#[test]
fn no_position_errors() {
    let f = setup();
    let stranger = Address::generate(&f.env);
    assert_eq!(f.client.try_position(&stranger).err().unwrap().unwrap(), Error::NoPosition);
    assert_eq!(f.client.try_claim_yield(&stranger).err().unwrap().unwrap(), Error::NoPosition);
    assert_eq!(f.client.try_withdraw(&stranger, &1_0000000i128).err().unwrap().unwrap(), Error::NoPosition);
    assert_eq!(f.client.try_set_mode(&stranger, &MODE_INCOME).err().unwrap().unwrap(), Error::NoPosition);
}

#[test]
fn mode_toggle_grow_income() {
    let f = setup();
    f.client.set_rate(&f.user, &1000u32);
    f.client.deposit_and_split(&f.user, &10_0000000i128);
    f.client.set_mode(&f.user, &MODE_INCOME);
    assert_eq!(f.client.position(&f.user).mode, MODE_INCOME);
    f.client.set_mode(&f.user, &MODE_GROW);
    assert_eq!(f.client.position(&f.user).mode, MODE_GROW);
}

#[test]
fn already_init_errors() {
    let f = setup();
    let admin = Address::generate(&f.env);
    assert_eq!(
        f.client.try_init(&admin, &f.token_addr, &f.client.venue(), &450u32).err().unwrap().unwrap(),
        Error::AlreadyInit
    );
}

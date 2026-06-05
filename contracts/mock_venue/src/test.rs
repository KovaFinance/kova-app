#![cfg(test)]
use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token, Address, Env,
};

fn setup() -> (
    Env,
    Address,
    MockVenueClient<'static>,
    token::StellarAssetClient<'static>,
    Address,
) {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let token_addr = sac.address();
    let ta = token::StellarAssetClient::new(&env, &token_addr);
    let id = env.register(MockVenue, ());
    let client = MockVenueClient::new(&env, &id);
    client.init(&admin, &token_addr, &450u32); // 4.5%/yr
    (env, id.clone(), client, ta, token_addr)
}

#[test]
fn nav_starts_at_one_and_grows() {
    let (env, _id, client, _ta, _t) = setup();
    assert_eq!(client.nav_per_share(), 10_000_000); // 1.0
    env.ledger().with_mut(|l| l.timestamp += 31_536_000);
    let nav = client.nav_per_share();
    assert!(nav > 10_440_000 && nav < 10_460_000, "nav={}", nav); // ~+4.5%
}

#[test]
fn deposit_credit_mints_then_redeem_pays_grown_value() {
    let (env, id, client, ta, token_addr) = setup();
    let funder = Address::generate(&env);
    ta.mint(&funder, &1_000_0000000i128);
    let tok = token::Client::new(&env, &token_addr);

    // transfer-then-credit: move 100 USDC into the venue, then credit it
    tok.transfer(&funder, &id, &100_0000000i128);
    let shares = client.deposit_credit(&100_0000000i128);
    assert_eq!(shares, 100_0000000i128); // nav 1.0 => 1:1
    assert_eq!(client.total_shares(), 100_0000000i128);

    // pre-fund extra so the +4.5% growth is backed by real tokens
    client.donate(&funder, &100_0000000i128);
    env.ledger().with_mut(|l| l.timestamp += 31_536_000);

    let to = Address::generate(&env);
    let paid = client.redeem(&to, &shares);
    assert!(paid > 104_0000000i128 && paid < 105_0000000i128, "paid={}", paid);
    assert_eq!(tok.balance(&to), paid);
    assert_eq!(client.total_shares(), 0);
}

#[test]
fn bad_amounts_error() {
    let (_env, _id, client, _ta, _t) = setup();
    assert_eq!(client.try_deposit_credit(&0).err().unwrap().unwrap(), Error::BadAmount);
    let to = Address::generate(&_env);
    assert_eq!(client.try_redeem(&to, &0).err().unwrap().unwrap(), Error::BadAmount);
}

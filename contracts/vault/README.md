# Kova Vault — Soroban contract

Non-custodial savings vault with two modes:

- **GROW** — `deposit_and_split` keeps the savings slice in the vault, returns the spendable remainder.
- **INCOME** — `claim_yield` pays out accrued yield while **principal is preserved**.

## Functions

| fn | purpose |
|---|---|
| `init(admin, token, yield_bps)` | one-time setup (USDC SAC + annual rate, e.g. 450 = 4.5%) |
| `set_rate(user, savings_bps)` | set the user's savings % (creates position) |
| `deposit_and_split(user, amount) -> spendable` | route income; vault keeps the slice |
| `set_mode(user, mode)` | 0 = grow, 1 = income |
| `claim_yield(user) -> paid` | withdraw accrued yield, principal intact |
| `withdraw(user, amount)` | withdraw principal (respects optional lock) |
| `lock(user, until)` | voluntary time lock |
| `position(user) -> Position` | read state (yield accrued to now) |

Yield accrues linearly: `principal * yield_bps * elapsed / (10_000 * seconds_per_year)`.

## Build / test / deploy

```bash
# from contracts/vault
rustup target add wasm32-unknown-unknown
cargo test                       # run unit tests
stellar contract build           # produce target/.../kova_vault.wasm

# deploy to testnet (from repo root)
stellar keys generate kova-deployer --network testnet --fund
TOKEN=<testnet_USDC_SAC> ./scripts/deploy-testnet.sh kova-deployer
```

> **Version note:** written against `soroban-sdk = "22"` and the `stellar` CLI.
> If your SDK/CLI minor version differs, a couple of testutils calls
> (`register`, `register_stellar_asset_contract_v2`) may need small tweaks.

## Production notes (mainnet)

- Swap the idle-USDC model for a real yield source: deposit the vault's USDC into
  a tokenized T-bill (Ondo USDY / Spiko) or a conservative Blend pool, and let
  `accrue` reflect realized yield rather than a fixed `yield_bps`.
- Get an independent audit before holding real funds.
- Income payouts (`claim_yield`) can be user-initiated or driven by a scheduled
  keeper; never promise a fixed amount — it is variable with the rate.

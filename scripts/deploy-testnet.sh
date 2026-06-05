#!/usr/bin/env bash
# Deploy the Kova vault + its TEST-ONLY yield venue to Stellar TESTNET.
#
# Prereqs:
#   - stellar-cli v26+ (prebuilt binary recommended — building from source can fail
#     to link wasm-opt on some toolchains).
#   - rustup with the wasm32v1-none target (this script adds it).
#   - a funded testnet identity:  stellar keys generate kova-deployer --network testnet --fund
#
# Usage (TOKEN = the USDC SAC the vault holds):
#   TOKEN=<USDC SAC on testnet> bash scripts/deploy-testnet.sh [identity]
#   # canonical Circle testnet USDC SAC:
#   #   stellar contract id asset --asset USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5 --network testnet
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/.."

NETWORK="testnet"
SOURCE="${1:-kova-deployer}"   # funded testnet identity
YIELD_BPS="${YIELD_BPS:-450}"  # display-only fallback metadata
VENUE_RATE_BPS="${VENUE_RATE_BPS:-450}"  # mock venue's simulated annual rate (4.5%)

: "${TOKEN:?Set TOKEN=<USDC SAC address on testnet> before running}"

echo "▶ Ensuring wasm target (wasm32v1-none)…"
rustup target add wasm32v1-none >/dev/null 2>&1 || true

ADMIN=$(stellar keys address "$SOURCE")

# --optimize=false avoids the wasm-opt dependency (prebuilt CLI may omit it).
# For mainnet, optimize the wasm before deploy to reduce size/fees.

echo "▶ Building + deploying TEST-ONLY mock venue…"
cd "$ROOT/contracts/mock_venue"
stellar contract build --optimize=false
VENUE_ID=$(stellar contract deploy \
  --wasm target/wasm32v1-none/release/mock_venue.wasm \
  --source "$SOURCE" --network "$NETWORK")
echo "   venue: $VENUE_ID"
stellar contract invoke --id "$VENUE_ID" --source "$SOURCE" --network "$NETWORK" -- \
  init --admin "$ADMIN" --token "$TOKEN" --rate_bps "$VENUE_RATE_BPS"

echo "▶ Building + deploying vault…"
cd "$ROOT/contracts/vault"
stellar contract build --optimize=false
VAULT_ID=$(stellar contract deploy \
  --wasm target/wasm32v1-none/release/kova_vault.wasm \
  --source "$SOURCE" --network "$NETWORK")
echo "   vault: $VAULT_ID"
stellar contract invoke --id "$VAULT_ID" --source "$SOURCE" --network "$NETWORK" -- \
  init --admin "$ADMIN" --token "$TOKEN" --venue "$VENUE_ID" --yield_bps "$YIELD_BPS"

echo ""
echo "✅ Done. Put these in .env.local:"
echo "NEXT_PUBLIC_VAULT_CONTRACT_ID=$VAULT_ID"
echo "NEXT_PUBLIC_VENUE_CONTRACT_ID=$VENUE_ID"
echo "NEXT_PUBLIC_USDC_SAC=$TOKEN"
echo ""
echo "Tip: pre-fund the venue so NAV growth is backed:"
echo "  stellar contract invoke --id $VENUE_ID --source $SOURCE --network $NETWORK -- donate --from $ADMIN --amount <stroops>"

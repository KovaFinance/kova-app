-- Kova backend schema (Phase 3+). Apply with: npm run db:migrate
-- Idempotent: safe to run repeatedly.

-- Maps a passkey credential (keyId) to the Stellar smart-wallet contract it controls.
-- Multiple keyIds (devices / recovery passkeys) can map to the same contract_id.
-- This is the own-backend resolver chosen in DECISIONS.md (ADR-0001), replacing Mercury.
create table if not exists wallet_signers (
  key_id      text primary key,
  contract_id text not null,
  created_at  timestamptz not null default now()
);

create index if not exists wallet_signers_contract_id_idx
  on wallet_signers (contract_id);

-- ── User profiles (Phase 7) ────────────────────────────────────────────────
-- Keyed on the smart-wallet contract id (== Signer.publicKey for passkey wallets).
-- Server-side mirror of UI settings so a returning user on a new device is restored.
-- Minimize PII: only a kyc_status string here — never raw KYC documents.
create table if not exists user_profiles (
  contract_id  text primary key,
  display_name text,
  lang         text not null default 'es',
  savings_bps  integer not null default 1500,   -- mirror; chain is source of truth
  mode         text not null default 'grow',     -- mirror
  notif_prefs  jsonb not null default '{}'::jsonb,
  push_tokens  jsonb not null default '[]'::jsonb,
  kyc_status   text not null default 'none',      -- none|pending|verified|rejected
  auto_split   boolean not null default false,    -- opted into autonomous income routing (keeper)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Migration for existing deployments (column added later):
alter table user_profiles add column if not exists auto_split boolean not null default false;

-- ── Vault event history (Phase 7 indexer) ──────────────────────────────────
-- One row per Soroban contract event. Deduped by the RPC event id, so re-polling
-- overlapping ledger ranges is a no-op (own-backend indexer per ADR-0001).
create table if not exists vault_events (
  event_id    text primary key,
  contract_id text not null,                       -- the user Address from the event topic
  kind        text not null,                        -- split | claim | withdraw | mode
  amount      numeric(20,7),                         -- gross (split) / payout (claim) / withdraw amount
  saved       numeric(20,7),                         -- split saved slice
  spendable   numeric(20,7),                         -- split spendable slice
  mode        integer,                               -- for 'mode' events
  tx_hash     text not null,
  ledger      integer not null,
  ts          timestamptz not null,                  -- ledgerClosedAt
  created_at  timestamptz not null default now()
);

create index if not exists vault_events_contract_ts_idx
  on vault_events (contract_id, ts desc);

-- ── Indexer cursor (resume across runs / RPC retention windows) ────────────
create table if not exists indexer_cursor (
  id            text primary key,                    -- 'vault' | 'income'
  last_ledger   integer not null default 0,
  last_event_id text,
  updated_at    timestamptz not null default now()
);

-- ── Pending income (Phase 4 income watcher) ────────────────────────────────
-- Incoming USDC payments to a registered smart wallet (detected from USDC SAC
-- `transfer` events), surfaced for the user to one-tap ROUTE through the vault's
-- deposit_and_split. Non-custodial: the user signs the routing. Deduped by the
-- USDC transfer event id, so re-polling overlapping ledgers is a no-op.
create table if not exists pending_income (
  event_id    text primary key,                      -- USDC SAC transfer event id
  contract_id text not null,                          -- recipient wallet (the user's smart wallet)
  from_addr   text not null,                          -- payer address
  amount      numeric(20,7) not null,                 -- USDC received
  tx_hash     text not null,
  ledger      integer not null,
  ts          timestamptz not null,                   -- ledgerClosedAt
  status      text not null default 'pending',        -- pending | routed | dismissed
  routed_tx   text,                                   -- deposit_and_split tx hash once routed
  created_at  timestamptz not null default now()
);

create index if not exists pending_income_contract_status_idx
  on pending_income (contract_id, status, ts desc);

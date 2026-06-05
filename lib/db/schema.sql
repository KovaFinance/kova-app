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
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

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
  id            text primary key,                    -- 'vault'
  last_ledger   integer not null default 0,
  last_event_id text,
  updated_at    timestamptz not null default now()
);

import { getSql } from "@/lib/db/client";

export interface Profile {
  contract_id: string;
  display_name: string | null;
  lang: string;
  savings_bps: number;
  mode: string;
  notif_prefs: Record<string, unknown>;
  push_tokens: unknown[];
  kyc_status: string;
}

export async function getProfile(contractId: string): Promise<Profile | null> {
  const sql = getSql();
  const rows = await sql<Profile[]>`
    select contract_id, display_name, lang, savings_bps, mode, notif_prefs, push_tokens, kyc_status
    from user_profiles where contract_id = ${contractId}
  `;
  return rows[0] ?? null;
}

/** Wallet contract ids of users currently in INCOME mode (keeper payout targets). */
export async function getIncomeModeContracts(): Promise<string[]> {
  const sql = getSql();
  const rows = await sql<{ contract_id: string }[]>`
    select contract_id from user_profiles where mode = 'income'
  `;
  return rows.map((r) => r.contract_id);
}

export interface ProfilePatch {
  contractId: string;
  lang?: string;
  displayName?: string;
  savingsBps?: number;
  mode?: string;
}

/** Create or update a profile. Only provided fields change (COALESCE on update). */
export async function upsertProfile(p: ProfilePatch): Promise<void> {
  const sql = getSql();
  await sql`
    insert into user_profiles (contract_id, lang, display_name, savings_bps, mode, updated_at)
    values (${p.contractId}, ${p.lang ?? "es"}, ${p.displayName ?? null},
            ${p.savingsBps ?? 1500}, ${p.mode ?? "grow"}, now())
    on conflict (contract_id) do update set
      lang         = coalesce(${p.lang ?? null}, user_profiles.lang),
      display_name = coalesce(${p.displayName ?? null}, user_profiles.display_name),
      savings_bps  = coalesce(${p.savingsBps ?? null}, user_profiles.savings_bps),
      mode         = coalesce(${p.mode ?? null}, user_profiles.mode),
      updated_at   = now()
  `;
}

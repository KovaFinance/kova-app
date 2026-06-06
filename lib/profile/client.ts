export interface ClientProfile {
  contract_id: string;
  display_name: string | null;
  lang: string;
  savings_bps: number;
  mode: string;
  kyc_status: string;
  auto_split?: boolean;
}

export async function fetchProfile(contractId: string): Promise<ClientProfile | null> {
  try {
    const r = await fetch(`/api/profile?contractId=${encodeURIComponent(contractId)}`);
    if (!r.ok) return null;
    return (await r.json()) as ClientProfile;
  } catch {
    return null;
  }
}

export async function saveProfile(patch: {
  contractId: string;
  lang?: string;
  savingsBps?: number;
  mode?: string;
  displayName?: string;
  autoSplit?: boolean;
}): Promise<boolean> {
  try {
    const r = await fetch(`/api/profile`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    return r.ok;
  } catch {
    return false;
  }
}

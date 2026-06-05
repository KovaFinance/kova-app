/** Vault phase: accumulate vs. live off the yield. */
export type VaultMode = "grow" | "income";

/** Authentication method used to create/connect the active account. */
export type AuthMethod = "passkey" | "wallet" | "imported";

/** A thing that can sign a Soroban transaction XDR for `source`. */
export interface Signer {
  publicKey: string;
  method: AuthMethod;
  label?: string;
  /** Returns signed transaction XDR (base64). */
  sign: (xdrBase64: string) => Promise<string>;
  /**
   * Optional gasless submission path (passkey smart wallets): submits the signed XDR
   * via the server relayer instead of the keypair RPC path. Present only for passkeys.
   */
  submit?: (signedXdr: string) => Promise<unknown>;
}

/** On-chain vault position for a user (mirrors the Soroban contract). */
export interface VaultPosition {
  principal: number; // USD held in the vault (yield-bearing)
  savingsBps: number; // e.g. 1500 = 15%
  mode: VaultMode;
  accruedYield: number; // USD of yield available to claim (income mode)
  lockedUntil: number | null; // unix seconds, optional lock
}

/** A single income event shown in the activity feed. */
export interface IncomeEvent {
  id: string;
  source: string;
  kind: "freelance" | "contrato" | "remesa" | "consultoría" | string;
  ts: number;
  amount: number; // gross USD received
  saved: number; // USD auto-saved
}

/** Streak / gamification level. */
export interface Level {
  key: "semilla" | "brote" | "arbol" | "bosque" | "legado";
  label: string;
  minWeeks: number;
}

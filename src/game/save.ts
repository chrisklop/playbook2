import LZString from 'lz-string';

export const CURRENT_SAVE_VERSION = 3;

export type BulkBuyMultiplier = 1 | 10 | 100 | 'max';

export interface SaveState {
  version: number;
  current_era: string;
  rumor: number;
  lifetime_rumor: number;
  memetic_inheritance: number;
  owned_by_generator: Record<string, number>;
  unlocked_codex: string[];
  saved_at_ms: number;
  // v2 additions
  prestige_count: number;
  seen_toast_events: string[];
  bulk_buy_multiplier: BulkBuyMultiplier;
  show_best_buy_hint: boolean;
  // v3 additions (cycles + managers + upgrades)
  cycle_progress: Record<string, number>;
  managers_hired: string[];
  upgrades_purchased: string[];
}

const V2_DEFAULTS = {
  prestige_count: 0,
  seen_toast_events: [] as string[],
  bulk_buy_multiplier: 1 as BulkBuyMultiplier,
  show_best_buy_hint: true,
};

const V3_DEFAULTS = {
  cycle_progress: {} as Record<string, number>,
  managers_hired: [] as string[],
  upgrades_purchased: [] as string[],
};

/**
 * Migrate a save object of any prior version to the current shape.
 * Idempotent — calling on an already-current save returns it structurally unchanged.
 */
export function migrateSave(raw: unknown): SaveState {
  let s = { ...(raw as Record<string, unknown>) };
  const version = (s.version as number | undefined) ?? 1;

  // v1 → v2: add prestige/toast/bulk-buy/hint defaults
  if (version < 2) {
    s = {
      ...s,
      prestige_count: (s.prestige_count as number | undefined) ?? V2_DEFAULTS.prestige_count,
      seen_toast_events: (s.seen_toast_events as string[] | undefined) ?? V2_DEFAULTS.seen_toast_events,
      bulk_buy_multiplier: (s.bulk_buy_multiplier as BulkBuyMultiplier | undefined) ?? V2_DEFAULTS.bulk_buy_multiplier,
      show_best_buy_hint: (s.show_best_buy_hint as boolean | undefined) ?? V2_DEFAULTS.show_best_buy_hint,
      version: 2,
    };
  }

  // v2 → v3: add cycle_progress + managers_hired defaults
  if (((s.version as number | undefined) ?? 1) < 3) {
    s = {
      ...s,
      cycle_progress: (s.cycle_progress as Record<string, number> | undefined) ?? V3_DEFAULTS.cycle_progress,
      managers_hired: (s.managers_hired as string[] | undefined) ?? V3_DEFAULTS.managers_hired,
      upgrades_purchased: (s.upgrades_purchased as string[] | undefined) ?? V3_DEFAULTS.upgrades_purchased,
      version: 3,
    };
  }

  return s as unknown as SaveState;
}

export function serializeSave(state: SaveState): string {
  const json = JSON.stringify(state);
  return LZString.compressToUTF16(json);
}

export function deserializeSave(encoded: string): SaveState {
  const json = LZString.decompressFromUTF16(encoded);
  if (!json) throw new Error('Failed to decompress save');
  const parsed = JSON.parse(json);
  if (typeof parsed !== 'object' || !parsed.version) {
    throw new Error('Save missing version field');
  }
  return migrateSave(parsed);
}

const STORAGE_KEY = 'playbook.save';

export function writeLocalSave(state: SaveState): void {
  localStorage.setItem(STORAGE_KEY, serializeSave(state));
}

export function readLocalSave(): SaveState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return deserializeSave(raw);
  } catch (err) {
    console.error('Save corrupted, ignoring:', err);
    return null;
  }
}

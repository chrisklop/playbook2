import LZString from 'lz-string';

export const CURRENT_SAVE_VERSION = 2;

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
}

const V2_DEFAULTS = {
  prestige_count: 0,
  seen_toast_events: [] as string[],
  bulk_buy_multiplier: 1 as BulkBuyMultiplier,
  show_best_buy_hint: true,
};

/**
 * Migrate a save object of any prior version to the current shape.
 * Idempotent — calling on an already-v2 save returns it structurally unchanged.
 */
export function migrateSave(raw: unknown): SaveState {
  const s = { ...(raw as Record<string, unknown>) };
  const version = (s.version as number | undefined) ?? 1;
  if (version < 2) {
    return {
      ...s,
      prestige_count: (s.prestige_count as number | undefined) ?? V2_DEFAULTS.prestige_count,
      seen_toast_events: (s.seen_toast_events as string[] | undefined) ?? V2_DEFAULTS.seen_toast_events,
      bulk_buy_multiplier: (s.bulk_buy_multiplier as BulkBuyMultiplier | undefined) ?? V2_DEFAULTS.bulk_buy_multiplier,
      show_best_buy_hint: (s.show_best_buy_hint as boolean | undefined) ?? V2_DEFAULTS.show_best_buy_hint,
      version: 2,
    } as SaveState;
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

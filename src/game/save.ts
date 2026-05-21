import LZString from 'lz-string';

export const CURRENT_SAVE_VERSION = 1;

export interface SaveState {
  version: number;
  current_era: string;
  rumor: number;
  lifetime_rumor: number;
  memetic_inheritance: number;
  owned_by_generator: Record<string, number>;
  unlocked_codex: string[];
  saved_at_ms: number;
}

export function serializeSave(state: SaveState): string {
  const json = JSON.stringify(state);
  return LZString.compressToUTF16(json);
}

export function deserializeSave(encoded: string): SaveState {
  const json = LZString.decompressFromUTF16(encoded);
  if (!json) throw new Error('Failed to decompress save');
  const parsed = JSON.parse(json) as SaveState;
  if (typeof parsed !== 'object' || !parsed.version) {
    throw new Error('Save missing version field');
  }
  // Future: schema migrations live here based on parsed.version
  return parsed;
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

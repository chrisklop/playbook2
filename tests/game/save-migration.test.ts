import { describe, it, expect } from 'vitest';
import LZString from 'lz-string';
import {
  migrateSave,
  serializeSave,
  deserializeSave,
  CURRENT_SAVE_VERSION,
  type SaveState,
} from '../../src/game/save';

const v1Sample = {
  version: 1,
  current_era: 'antiquity',
  rumor: 1234.5,
  lifetime_rumor: 9999,
  memetic_inheritance: 0,
  owned_by_generator: { 'spread-rumor': 12 },
  unlocked_codex: ['octavian-vs-antony'],
  saved_at_ms: 1700000000000,
};

describe('save migration v1 -> v2', () => {
  it('CURRENT_SAVE_VERSION is 2', () => {
    expect(CURRENT_SAVE_VERSION).toBe(2);
  });

  it('migrateSave adds v2 defaults to a v1 object', () => {
    const migrated = migrateSave(v1Sample);
    expect(migrated.version).toBe(2);
    expect(migrated.prestige_count).toBe(0);
    expect(migrated.seen_toast_events).toEqual([]);
    expect(migrated.bulk_buy_multiplier).toBe(1);
    expect(migrated.show_best_buy_hint).toBe(true);
  });

  it('migrateSave preserves all v1 fields verbatim', () => {
    const migrated = migrateSave(v1Sample);
    expect(migrated.rumor).toBe(1234.5);
    expect(migrated.lifetime_rumor).toBe(9999);
    expect(migrated.owned_by_generator).toEqual({ 'spread-rumor': 12 });
    expect(migrated.unlocked_codex).toEqual(['octavian-vs-antony']);
    expect(migrated.current_era).toBe('antiquity');
  });

  it('migrateSave is a no-op on already-v2 saves', () => {
    const v2 = migrateSave(v1Sample);
    const v2Again = migrateSave(v2);
    expect(v2Again).toEqual(v2);
  });

  it('deserializeSave runs migration automatically on a v1 compressed payload', () => {
    const json = JSON.stringify(v1Sample);
    const v1String = LZString.compressToUTF16(json);

    const restored = deserializeSave(v1String);
    expect(restored.version).toBe(2);
    expect(restored.prestige_count).toBe(0);
    expect(restored.rumor).toBe(1234.5);
  });

  it('round-trip serialize/deserialize on a v2 payload preserves everything', () => {
    const v2: SaveState = {
      version: 2,
      current_era: 'printing-press',
      rumor: 50,
      lifetime_rumor: 1e8,
      memetic_inheritance: 7.5,
      owned_by_generator: { 'compose-broadside': 30, 'print-pamphlet': 5 },
      unlocked_codex: ['luther-pamphlet-war', 'donation-of-constantine'],
      saved_at_ms: 1700100000000,
      prestige_count: 3,
      seen_toast_events: ['auto-unlock:antiquity:spread-rumor', 'bulk-unlock:10'],
      bulk_buy_multiplier: 10,
      show_best_buy_hint: false,
    };
    const back = deserializeSave(serializeSave(v2));
    expect(back).toEqual(v2);
  });
});

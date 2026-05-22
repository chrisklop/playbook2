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

describe('save migration v1 -> v3', () => {
  it('CURRENT_SAVE_VERSION is 3', () => {
    expect(CURRENT_SAVE_VERSION).toBe(3);
  });

  it('migrateSave from v1 adds v2 AND v3 defaults', () => {
    const migrated = migrateSave(v1Sample);
    expect(migrated.version).toBe(3);
    // v2 defaults
    expect(migrated.prestige_count).toBe(0);
    expect(migrated.seen_toast_events).toEqual([]);
    expect(migrated.bulk_buy_multiplier).toBe(1);
    expect(migrated.show_best_buy_hint).toBe(true);
    // v3 defaults
    expect(migrated.cycle_progress).toEqual({});
    expect(migrated.managers_hired).toEqual([]);
    expect(migrated.upgrades_purchased).toEqual([]);
  });

  it('migrateSave preserves all v1 fields verbatim', () => {
    const migrated = migrateSave(v1Sample);
    expect(migrated.rumor).toBe(1234.5);
    expect(migrated.lifetime_rumor).toBe(9999);
    expect(migrated.owned_by_generator).toEqual({ 'spread-rumor': 12 });
    expect(migrated.unlocked_codex).toEqual(['octavian-vs-antony']);
    expect(migrated.current_era).toBe('antiquity');
  });

  it('migrateSave is a no-op on already-v3 saves', () => {
    const v3 = migrateSave(v1Sample);
    const v3Again = migrateSave(v3);
    expect(v3Again).toEqual(v3);
  });

  it('deserializeSave runs full migration automatically on a v1 compressed payload', () => {
    const json = JSON.stringify(v1Sample);
    const v1String = LZString.compressToUTF16(json);

    const restored = deserializeSave(v1String);
    expect(restored.version).toBe(3);
    expect(restored.prestige_count).toBe(0);
    expect(restored.cycle_progress).toEqual({});
    expect(restored.managers_hired).toEqual([]);
    expect(restored.upgrades_purchased).toEqual([]);
    expect(restored.rumor).toBe(1234.5);
  });

  it('round-trip serialize/deserialize on a v3 payload preserves everything', () => {
    const v3: SaveState = {
      version: 3,
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
      cycle_progress: { 'compose-broadside': 0.7, 'print-pamphlet': 0.2 },
      managers_hired: ['compose-broadside'],
      upgrades_purchased: ['compose-broadside-up1', 'print-pamphlet-up1'],
    };
    const back = deserializeSave(serializeSave(v3));
    expect(back).toEqual(v3);
  });

  it('migrating from v2 directly adds only v3 defaults', () => {
    const v2Sample = {
      ...v1Sample,
      version: 2,
      prestige_count: 5,
      seen_toast_events: ['x'],
      bulk_buy_multiplier: 10,
      show_best_buy_hint: false,
    };
    const migrated = migrateSave(v2Sample);
    expect(migrated.version).toBe(3);
    // v2 fields preserved
    expect(migrated.prestige_count).toBe(5);
    expect(migrated.bulk_buy_multiplier).toBe(10);
    // v3 defaults added
    expect(migrated.cycle_progress).toEqual({});
    expect(migrated.managers_hired).toEqual([]);
    expect(migrated.upgrades_purchased).toEqual([]);
  });
});

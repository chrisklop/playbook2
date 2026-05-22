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
  it('CURRENT_SAVE_VERSION is 5', () => {
    expect(CURRENT_SAVE_VERSION).toBe(5);
  });

  it('migrateSave from v1 adds v2, v3 AND v4 defaults', () => {
    const migrated = migrateSave(v1Sample);
    expect(migrated.version).toBe(5);
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
    expect(restored.version).toBe(5);
    expect(restored.prestige_count).toBe(0);
    expect(restored.cycle_progress).toEqual({});
    expect(restored.managers_hired).toEqual([]);
    expect(restored.upgrades_purchased).toEqual([]);
    expect(restored.active_offer).toBe(null);
    expect(restored.active_bonus).toBe(null);
    expect(restored.next_event_spawn_at).toBe(0);
    expect(restored.rumor).toBe(1234.5);
  });

  it('round-trip serialize/deserialize on a v5 payload preserves everything', () => {
    const v5: SaveState = {
      version: 5,
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
      active_offer: null,
      active_bonus: null,
      next_event_spawn_at: 0,
      technique_mastery: { trolling: 2, emotion: 1 },
      codex_mastered: ['athenian-sykophants', 'bryce-report'],
    };
    const back = deserializeSave(serializeSave(v5));
    expect(back).toEqual(v5);
  });

  it('migrating from v4 adds only v5 defaults', () => {
    const v4Sample = {
      ...v1Sample,
      version: 4,
      cycle_progress: {},
      managers_hired: [],
      upgrades_purchased: [],
      active_offer: null,
      active_bonus: null,
      next_event_spawn_at: 0,
    };
    const migrated = migrateSave(v4Sample);
    expect(migrated.version).toBe(5);
    expect(migrated.technique_mastery).toEqual({});
    expect(migrated.codex_mastered).toEqual([]);
  });

  it('migrating from v2 directly adds v3 + v4 defaults', () => {
    const v2Sample = {
      ...v1Sample,
      version: 2,
      prestige_count: 5,
      seen_toast_events: ['x'],
      bulk_buy_multiplier: 10,
      show_best_buy_hint: false,
    };
    const migrated = migrateSave(v2Sample);
    expect(migrated.version).toBe(5);
    expect(migrated.prestige_count).toBe(5);
    expect(migrated.bulk_buy_multiplier).toBe(10);
    expect(migrated.cycle_progress).toEqual({});
    expect(migrated.managers_hired).toEqual([]);
    expect(migrated.upgrades_purchased).toEqual([]);
    expect(migrated.active_offer).toBe(null);
    expect(migrated.active_bonus).toBe(null);
    expect(migrated.next_event_spawn_at).toBe(0);
  });

  it('migrating from v3 adds only v4 defaults', () => {
    const v3Sample = {
      ...v1Sample,
      version: 3,
      prestige_count: 1,
      cycle_progress: { x: 0.5 },
      managers_hired: ['x'],
      upgrades_purchased: ['y'],
    };
    const migrated = migrateSave(v3Sample);
    expect(migrated.version).toBe(5);
    expect(migrated.cycle_progress).toEqual({ x: 0.5 });
    expect(migrated.managers_hired).toEqual(['x']);
    expect(migrated.active_offer).toBe(null);
    expect(migrated.active_bonus).toBe(null);
    expect(migrated.next_event_spawn_at).toBe(0);
  });
});

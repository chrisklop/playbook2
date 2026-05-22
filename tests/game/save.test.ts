import { describe, it, expect } from 'vitest';
import { serializeSave, deserializeSave, type SaveState } from '../../src/game/save';

const SAMPLE: SaveState = {
  version: 5,
  current_era: 'antiquity',
  rumor: 12345.678,
  lifetime_rumor: 999999.99,
  memetic_inheritance: 0,
  owned_by_generator: { 'spread-rumor': 10, 'forge-naru-tablet': 3 },
  unlocked_codex: ['octavian-vs-antony'],
  saved_at_ms: 1700000000000,
  prestige_count: 0,
  seen_toast_events: [],
  bulk_buy_multiplier: 1,
  show_best_buy_hint: true,
  cycle_progress: {},
  managers_hired: [],
  upgrades_purchased: [],
  active_offer: null,
  active_bonus: null,
  next_event_spawn_at: 0,
  technique_mastery: {},
  codex_mastered: [],
};

describe('save round-trip', () => {
  it('serialize then deserialize returns the original', () => {
    const str = serializeSave(SAMPLE);
    const back = deserializeSave(str);
    expect(back).toEqual(SAMPLE);
  });

  it('compressed save is smaller than JSON.stringify', () => {
    const compressed = serializeSave(SAMPLE);
    const raw = JSON.stringify(SAMPLE);
    expect(compressed.length).toBeLessThan(raw.length);
  });

  it('throws on corrupted input', () => {
    expect(() => deserializeSave('totally-not-a-save')).toThrow();
  });
});

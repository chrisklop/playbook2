import { describe, it, expect } from 'vitest';
import {
  pickRandomEvent,
  pickNextSpawnAt,
  spawnOffer,
  claimOffer,
  bonusMultiplier,
  bonusFractionRemaining,
  offerFractionRemaining,
  SPAWN_MIN_S,
  SPAWN_MAX_S,
} from '../../src/game/ticker-events';
import type { EventDefinition } from '../../src/content/schema';

function fixture(overrides: Partial<EventDefinition> = {}): EventDefinition {
  return {
    id: 'evt-a',
    headline: 'Test headline',
    claim_verb: 'TAP',
    claim_window_s: 20,
    effect: { type: 'rumor_mult', value: 3.0, duration_s: 30 },
    weight: 1,
    ...overrides,
  };
}

describe('ticker-events', () => {
  it('pickRandomEvent returns null on empty pool', () => {
    expect(pickRandomEvent([], () => 0.5)).toBe(null);
  });

  it('pickRandomEvent honours weights', () => {
    // Two events: weight 1 vs weight 99. r ≈ 0.02 selects first (1/100 boundary).
    const a = fixture({ id: 'rare', weight: 1 });
    const b = fixture({ id: 'common', weight: 99 });
    expect(pickRandomEvent([a, b], () => 0.005)?.id).toBe('rare');
    expect(pickRandomEvent([a, b], () => 0.5)?.id).toBe('common');
  });

  it('pickNextSpawnAt stays in [MIN, MAX] window', () => {
    const now = 1_000_000;
    expect(pickNextSpawnAt(now, () => 0)).toBe(now + SPAWN_MIN_S * 1000);
    expect(pickNextSpawnAt(now, () => 0.9999)).toBeGreaterThanOrEqual(now + (SPAWN_MAX_S - 1) * 1000);
    expect(pickNextSpawnAt(now, () => 0.9999)).toBeLessThanOrEqual(now + SPAWN_MAX_S * 1000);
  });

  it('spawnOffer carries claim window into expires_at_ms', () => {
    const now = 1_000_000;
    const offer = spawnOffer(fixture({ claim_window_s: 25 }), now);
    expect(offer.expires_at_ms - now).toBe(25_000);
    expect(offer.effect_value).toBe(3);
  });

  it('claimOffer creates a bonus that expires duration_s later', () => {
    const now = 1_000_000;
    const offer = spawnOffer(fixture(), now);
    const bonus = claimOffer(offer, now + 5000);
    expect(bonus.expires_at_ms).toBe(now + 5000 + 30_000);
    expect(bonus.value).toBe(3);
  });

  it('bonusMultiplier returns 1 when no bonus or expired', () => {
    expect(bonusMultiplier(null, 0)).toBe(1);
    const bonus = claimOffer(spawnOffer(fixture(), 1000), 1000);
    expect(bonusMultiplier(bonus, 999_999_999)).toBe(1);
    expect(bonusMultiplier(bonus, 1000)).toBe(3);
  });

  it('bonusFractionRemaining is 1 at claim time and 0 at expiry', () => {
    const t0 = 1_000_000;
    const bonus = claimOffer(spawnOffer(fixture({ effect: { type: 'rumor_mult', value: 2, duration_s: 10 } }), t0), t0);
    expect(bonusFractionRemaining(bonus, t0)).toBe(1);
    expect(bonusFractionRemaining(bonus, t0 + 5000)).toBeCloseTo(0.5, 5);
    expect(bonusFractionRemaining(bonus, t0 + 10_000)).toBe(0);
    expect(bonusFractionRemaining(bonus, t0 + 99_999)).toBe(0);
  });

  it('offerFractionRemaining is 1 at spawn and 0 at window expiry', () => {
    const t0 = 1_000_000;
    const offer = spawnOffer(fixture({ claim_window_s: 20 }), t0);
    expect(offerFractionRemaining(offer, t0)).toBe(1);
    expect(offerFractionRemaining(offer, t0 + 10_000)).toBeCloseTo(0.5, 5);
    expect(offerFractionRemaining(offer, t0 + 20_000)).toBe(0);
  });
});

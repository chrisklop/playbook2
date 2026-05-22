import type { EventDefinition } from '../content/schema';

/**
 * Random ticker-event scheduler + bonus tracker.
 *
 * Two lifecycle objects:
 *
 *   - ActiveOffer  — a freshly-spawned event displayed to the player. They have
 *                    until `expires_at_ms` to tap and claim it; if they miss
 *                    the window it scrolls away and is gone.
 *
 *   - ActiveBonus  — what's currently buffing production after a successful
 *                    claim. Lives `duration_s` seconds. A new claim replaces
 *                    any active bonus (no stacking) to keep math predictable.
 *
 * Spawn cadence: when there's no active offer and no active bonus, the next
 * spawn is scheduled SPAWN_MIN_S..SPAWN_MAX_S seconds out. Random uniform.
 *
 * Engine is era-agnostic — it operates on a pool of EventDefinition rows
 * supplied by the caller (currentEra.events from the registry).
 */

export const SPAWN_MIN_S = 60;   // shortest wait between events
export const SPAWN_MAX_S = 180;  // longest wait between events

export interface ActiveOffer {
  event_id: string;
  headline: string;
  claim_verb: string;
  spawned_at_ms: number;
  expires_at_ms: number;
  effect_type: 'rumor_mult';
  effect_value: number;
  effect_duration_s: number;
  is_frenzy: boolean;
}

export interface ActiveBonus {
  source_event_id: string;
  type: 'rumor_mult';
  value: number;
  duration_s: number;
  expires_at_ms: number;
  is_frenzy: boolean;
}

/** Weighted-random pick from the event pool. Returns null if pool is empty. */
export function pickRandomEvent(
  pool: EventDefinition[],
  rand: () => number = Math.random,
): EventDefinition | null {
  if (pool.length === 0) return null;
  const totalWeight = pool.reduce((s, e) => s + e.weight, 0);
  let r = rand() * totalWeight;
  for (const e of pool) {
    r -= e.weight;
    if (r <= 0) return e;
  }
  return pool[pool.length - 1];
}

/** Schedule the next spawn time relative to nowMs. */
export function pickNextSpawnAt(nowMs: number, rand: () => number = Math.random): number {
  const range = SPAWN_MAX_S - SPAWN_MIN_S;
  const delaySec = SPAWN_MIN_S + rand() * range;
  return nowMs + delaySec * 1000;
}

/** Build an ActiveOffer from an EventDefinition at a given moment. */
export function spawnOffer(def: EventDefinition, nowMs: number): ActiveOffer {
  return {
    event_id: def.id,
    headline: def.headline,
    claim_verb: def.claim_verb,
    spawned_at_ms: nowMs,
    expires_at_ms: nowMs + def.claim_window_s * 1000,
    effect_type: def.effect.type,
    effect_value: def.effect.value,
    effect_duration_s: def.effect.duration_s,
    is_frenzy: def.is_frenzy,
  };
}

/** Convert a claimed offer into the active bonus that buffs production. */
export function claimOffer(offer: ActiveOffer, nowMs: number): ActiveBonus {
  return {
    source_event_id: offer.event_id,
    type: offer.effect_type,
    value: offer.effect_value,
    duration_s: offer.effect_duration_s,
    expires_at_ms: nowMs + offer.effect_duration_s * 1000,
    is_frenzy: offer.is_frenzy,
  };
}

/** Current multiplier applied to all production. Returns 1.0 when no bonus. */
export function bonusMultiplier(bonus: ActiveBonus | null, nowMs: number): number {
  if (!bonus) return 1;
  if (nowMs >= bonus.expires_at_ms) return 1;
  return bonus.value;
}

/** UI helper: 0..1 fraction of bonus duration remaining. */
export function bonusFractionRemaining(bonus: ActiveBonus | null, nowMs: number): number {
  if (!bonus) return 0;
  const totalMs = bonus.duration_s * 1000;
  if (totalMs <= 0) return 0;
  const remainingMs = bonus.expires_at_ms - nowMs;
  return Math.max(0, Math.min(1, remainingMs / totalMs));
}

/** UI helper: 0..1 fraction of claim window remaining. */
export function offerFractionRemaining(offer: ActiveOffer | null, nowMs: number): number {
  if (!offer) return 0;
  const totalMs = offer.expires_at_ms - offer.spawned_at_ms;
  if (totalMs <= 0) return 0;
  const remainingMs = offer.expires_at_ms - nowMs;
  return Math.max(0, Math.min(1, remainingMs / totalMs));
}

const COEFFICIENT = 150;

/** Default pivot for eras that don't specify one. Sized for Era-1-class production scale. */
export const DEFAULT_PRESTIGE_PIVOT = 1e12;

/**
 * AdCap-derived formula: MI = 150 × sqrt(lifetime_rumor / pivot).
 *
 * Per-era pivot is the key calibration knob. With sqrt, doubling MI requires 4×
 * more lifetime resource — so the pivot encodes "how much lifetime do you need
 * to earn 1 MI." Tuned per era so first prestige lands in 30–60 min of fresh play.
 */
export function computeMemeticInheritance(lifetimeRumor: number, pivot: number = DEFAULT_PRESTIGE_PIVOT): number {
  if (lifetimeRumor <= 0) return 0;
  return COEFFICIENT * Math.sqrt(lifetimeRumor / pivot);
}

/** Carryover multiplier applied to next era's production: 1 + MI × 0.02. */
export function carryoverMultiplier(mi: number): number {
  return 1 + mi * 0.02;
}

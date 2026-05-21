const PIVOT = 1e15; // AdCap pivot — first prestige reachable in 30–60 min of fresh play
const COEFFICIENT = 150;

/** AdCap formula: MI = 150 × sqrt(lifetime_rumor / 10^15). */
export function computeMemeticInheritance(lifetimeRumor: number): number {
  if (lifetimeRumor <= 0) return 0;
  return COEFFICIENT * Math.sqrt(lifetimeRumor / PIVOT);
}

/** Carryover multiplier applied to next era's production: 1 + MI × 0.02. */
export function carryoverMultiplier(mi: number): number {
  return 1 + mi * 0.02;
}

import type { GeneratorTier } from '../content/schema';

/** cost(n) = base × growth^n — Pecorella canonical formula */
export function computeCost(base: number, growth: number, owned: number): number {
  return base * Math.pow(growth, owned);
}

/** Closed-form bulk cost from level k, buying n more (geometric series). */
export function computeBulkCost(base: number, growth: number, owned: number, n: number): number {
  if (n === 0) return 0;
  return base * (Math.pow(growth, owned) * (Math.pow(growth, n) - 1)) / (growth - 1);
}

/** Compute the milestone multiplier for a given owned count. */
export function milestoneMultiplier(owned: number, milestones: readonly number[]): number {
  let mult = 1;
  for (const m of milestones) if (owned >= m) mult *= 2;
  return mult;
}

/** Per-tick production for one generator (linear in owned × multipliers). */
export function generatorProduction(
  gen: GeneratorTier,
  owned: number,
  globalMultiplier: number,
): number {
  if (gen.is_click_driven) return 0;
  return gen.base_production * owned * milestoneMultiplier(owned, gen.milestones) * globalMultiplier;
}

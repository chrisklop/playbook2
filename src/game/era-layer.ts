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

/**
 * Per-tick production for one generator (linear in owned × multipliers).
 *
 * For click-driven Tier-1 generators, idle production is 0 until the player has
 * purchased `auto_unlock_at` of them — that's the "manager hired" moment.
 * Once unlocked, Tier-1 produces idle just like any other generator.
 */
export function generatorProduction(
  gen: GeneratorTier,
  owned: number,
  globalMultiplier: number,
): number {
  if (owned <= 0) return 0;
  if (gen.is_click_driven && owned < gen.auto_unlock_at) return 0;
  return gen.base_production * owned * milestoneMultiplier(owned, gen.milestones) * globalMultiplier;
}

/**
 * Largest N such that computeBulkCost(base, growth, owned, N) <= available.
 *
 * Closed-form via inverse of the geometric-series formula:
 *   cost(N) = base × growth^owned × (growth^N - 1) / (growth - 1) ≤ available
 *   → N ≤ log( 1 + available × (growth - 1) / (base × growth^owned) ) / log(growth)
 *
 * Floating-point in the log step can land us one off in either direction, so we
 * bump up then back off using the exact forward formula until we land at the
 * largest N that actually fits.
 *
 * Returns 0 when the player can't even afford one.
 */
export function maxAffordableBulk(
  base: number,
  growth: number,
  owned: number,
  available: number,
): number {
  if (available <= 0) return 0;
  const costOfNext = base * Math.pow(growth, owned);
  if (available < costOfNext) return 0;
  const numerator = Math.log(1 + (available * (growth - 1)) / costOfNext);
  const denominator = Math.log(growth);
  let n = Math.floor(numerator / denominator);
  const tol = Math.max(1e-9, Math.abs(available) * 1e-12);
  // Bump up while n+1 still fits (handles exact-match cases the log may round down)
  while (computeBulkCost(base, growth, owned, n + 1) <= available + tol) {
    n += 1;
  }
  // Back off while n overshoots (handles log rounding up)
  while (n > 0 && computeBulkCost(base, growth, owned, n) > available + tol) {
    n -= 1;
  }
  return n;
}

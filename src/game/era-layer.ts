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
 * Passive production is gated by whether the engine treats this generator as
 * "producing" (manager hired or a cycle in flight) — see the willProduce check
 * in productionPerSecond and the tick loop. There is no extra owned-count gate
 * for click-driven generators: hiring the manager is what starts the income.
 * `auto_unlock_at` only describes when the Hire pill appears on the tile.
 */
export function generatorProduction(
  gen: GeneratorTier,
  owned: number,
  globalMultiplier: number,
): number {
  if (owned <= 0) return 0;
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

/**
 * AdCap cycle-payout — what a single cycle of this generator pays out.
 *
 * payout_per_cycle = base_production × cycle_seconds × owned × milestoneMult × globalMult × upgradeMult
 *
 * Mathematical equivalence to v0.2's continuous rate:
 *   rate_per_second = payout_per_cycle / cycle_seconds
 *                   = base_production × owned × milestoneMult × globalMult × upgradeMult
 * → identical to v0.2's generatorProduction (when upgradeMult defaults to 1).
 *
 * The cycle model just discretizes the same math for visual presentation.
 */
export function payoutPerCycle(
  gen: GeneratorTier,
  owned: number,
  globalMultiplier: number,
  upgradeMultiplier: number = 1,
): number {
  if (owned <= 0) return 0;
  return (
    gen.base_production *
    gen.cycle_seconds *
    owned *
    milestoneMultiplier(owned, gen.milestones) *
    globalMultiplier *
    upgradeMultiplier
  );
}

/**
 * Steady-state rate-per-second under the cycle model — equals payoutPerCycle / cycle_seconds.
 * Used by the simulator (which stays on continuous-tick) and any UI that displays a rate.
 */
export function cycleRatePerSecond(
  gen: GeneratorTier,
  owned: number,
  globalMultiplier: number,
  upgradeMultiplier: number = 1,
): number {
  if (owned <= 0 || gen.cycle_seconds <= 0) return 0;
  return payoutPerCycle(gen, owned, globalMultiplier, upgradeMultiplier) / gen.cycle_seconds;
}

/**
 * Pecorella overtake heuristic — picks the generator with the lowest
 *   cost / nps + cost / (nps + delta_rate_from_buying_one)
 * score. Lower score = faster total-time to afford this purchase AND the next
 * opportunity it unlocks.
 *
 * Click-driven generators below their auto_unlock_at contribute 0 delta, so
 * they only become attractive once close to unlock.
 *
 * When nps is 0 (bootstrap phase), rank by cost-per-rate-gained instead — a
 * zero-delta buy (e.g. click-driven below threshold) is Infinity and won't win.
 */
export function pickOptimalGenerator(
  candidates: readonly GeneratorTier[],
  state: { rumor: number; ownedByGenerator: Record<string, number> },
  globalMultiplier: number,
): string | null {
  if (candidates.length === 0) return null;

  let nps = 0;
  for (const g of candidates) {
    const owned = state.ownedByGenerator[g.id] ?? 0;
    nps += generatorProduction(g, owned, globalMultiplier);
  }

  let bestId: string | null = null;
  let bestScore = Infinity;

  for (const g of candidates) {
    const owned = state.ownedByGenerator[g.id] ?? 0;
    const cost = computeCost(g.base_cost, g.cost_growth, owned);
    const before = generatorProduction(g, owned, globalMultiplier);
    const after = generatorProduction(g, owned + 1, globalMultiplier);
    const delta = Math.max(0, after - before);

    let score: number;
    if (nps <= 0) {
      // Bootstrap: rank by cost-per-delta. Zero-delta buys (click-driven below
      // threshold) score Infinity, never optimal.
      score = delta > 0 ? cost / delta : Number.POSITIVE_INFINITY;
    } else {
      const denom2 = nps + delta;
      const term2 = denom2 > 0 ? cost / denom2 : Number.POSITIVE_INFINITY;
      score = cost / nps + term2;
    }

    if (score < bestScore) {
      bestScore = score;
      bestId = g.id;
    }
  }

  return bestId;
}

import type { EraDefinition, GeneratorTier } from '../content/schema';
import { computeCost, generatorProduction, milestoneMultiplier } from './era-layer';
import { carryoverMultiplier, computeMemeticInheritance } from './prestige';
import type { EraLayerState } from './build-era-layer';

export type SimEvent =
  | { t_sec: number; type: 'click'; rumor: number }
  | { t_sec: number; type: 'purchase'; gen_id: string; cost: number; owned_after: number }
  | { t_sec: number; type: 'auto_unlock'; gen_id: string; operative: string }
  | { t_sec: number; type: 'milestone'; gen_id: string; owned: number; multiplier: number }
  | { t_sec: number; type: 'prestige_available'; projected_mi: number }
  | { t_sec: number; type: 'stop'; reason: 'horizon' | 'prestige_reached' | 'stalled' };

export interface SimulationResult {
  era_id: string;
  horizon_sec: number;
  reached_horizon: boolean;
  events: SimEvent[];
  final_state: EraLayerState;
  time_to_first_auto_unlock_sec: number | null;
  time_to_each_generator_purchase_sec: Record<string, number | null>;
  time_to_first_prestige_sec: number | null;
  lifetime_rumor_at_horizon: number;
  projected_mi_at_horizon: number;
  times_each_gen_was_best_buy: Record<string, number>;
}

export interface SimulationOptions {
  horizon_sec: number;
  clicks_per_sec?: number;
  initial_mi?: number;
  stop_on_first_prestige?: boolean;
}

function totalNps(era: EraDefinition, state: EraLayerState, globalMult: number): number {
  let nps = 0;
  for (const gen of era.generators) {
    const owned = state.ownedByGenerator[gen.id] ?? 0;
    nps += generatorProduction(gen, owned, globalMult);
  }
  return nps;
}

function isVisible(gen: GeneratorTier, state: EraLayerState): boolean {
  return state.lifetimeRumor >= gen.reveal_at_lifetime;
}

function productionAtOwned(gen: GeneratorTier, owned: number, globalMult: number): number {
  // Same as generatorProduction but force the "auto active" path so we can
  // measure the *post-buy* rate even if the current owned < auto_unlock_at.
  if (owned <= 0) return 0;
  return gen.base_production * owned * milestoneMultiplier(owned, gen.milestones) * globalMult;
}

/** The crossed milestones for a given owned. */
function milestonesCrossed(gen: GeneratorTier, before: number, after: number): number[] {
  return gen.milestones.filter(m => before < m && after >= m);
}

export function simulateEra(
  era: EraDefinition,
  options: SimulationOptions,
): SimulationResult {
  const clicksPerSec = options.clicks_per_sec ?? 5;
  const initialMI = options.initial_mi ?? 0;
  const stopOnFirstPrestige = options.stop_on_first_prestige ?? false;
  const horizonSec = options.horizon_sec;

  const globalMult = carryoverMultiplier(initialMI);

  const state: EraLayerState = {
    ownedByGenerator: Object.fromEntries(era.generators.map(g => [g.id, 0])),
    lifetimeRumor: 0,
    rumor: 0,
    globalMultiplier: globalMult,
  };

  const events: SimEvent[] = [];
  let t = 0;

  const purchaseTimes: Record<string, number | null> = Object.fromEntries(
    era.generators.map(g => [g.id, null]),
  );
  let firstAutoUnlock: number | null = null;
  let firstPrestige: number | null = null;
  const bestBuyCounts: Record<string, number> = Object.fromEntries(
    era.generators.map(g => [g.id, 0]),
  );

  const MAX_ITER = 100000;
  let iter = 0;
  let prestigeRecorded = false;

  while (t < horizonSec && iter < MAX_ITER) {
    iter++;

    // 1. Compute current NPS.
    const nps = totalNps(era, state, globalMult);

    // 2. Find visible generators we could buy.
    const visible = era.generators.filter(g => isVisible(g, state));
    if (visible.length === 0) {
      // shouldn't happen — Tier-1 is always visible (reveal_at_lifetime=0). Safety.
      break;
    }

    // 3. Score each candidate via overtake metric.
    // Keep the heuristic here in sync with src/game/era-layer.ts: pickOptimalGenerator
    let best: { gen: GeneratorTier; cost: number; metric: number } | null = null;
    for (const gen of visible) {
      const owned = state.ownedByGenerator[gen.id] ?? 0;
      const cost = computeCost(gen.base_cost, gen.cost_growth, owned);
      const rateBefore = generatorProduction(gen, owned, globalMult);
      // After buying, the gen will have owned+1. For click-driven gens that haven't
      // hit auto_unlock_at, generatorProduction still returns 0 until threshold.
      const rateAfter = generatorProduction(gen, owned + 1, globalMult);
      const delta = rateAfter - rateBefore;
      let metric: number;
      if (nps <= 0) {
        // Only income is clicks; buying purely improves long-term but we pick by cost (cheapest gets us moving).
        metric = cost / Math.max(clicksPerSec, 1e-9);
      } else {
        const denom2 = nps + delta;
        const term2 = denom2 > 0 ? cost / denom2 : Number.POSITIVE_INFINITY;
        metric = cost / nps + term2;
      }
      if (best === null || metric < best.metric) {
        best = { gen, cost, metric };
      }
    }

    if (!best) break;
    bestBuyCounts[best.gen.id]++;

    // 4. Time-jump until rumor reaches cost.
    const need = best.cost - state.rumor;
    let dt: number;
    if (need <= 0) {
      dt = 0;
    } else if (nps > 0) {
      dt = need / nps;
    } else {
      // Click bootstrap phase
      dt = need / Math.max(clicksPerSec, 1e-9);
    }

    // Don't blow past horizon.
    if (t + dt > horizonSec) {
      // Advance to horizon, accumulate rumor, then stop.
      const remaining = horizonSec - t;
      const incomeRate = nps > 0 ? nps : clicksPerSec;
      state.rumor += incomeRate * remaining;
      state.lifetimeRumor += incomeRate * remaining;
      t = horizonSec;
      break;
    }

    // 5. Advance.
    const incomeRate = nps > 0 ? nps : clicksPerSec;
    const gain = incomeRate * dt;
    state.rumor += gain;
    state.lifetimeRumor += gain;
    t += dt;

    // 6. Buy.
    state.rumor -= best.cost;
    const before = state.ownedByGenerator[best.gen.id] ?? 0;
    const after = before + 1;
    state.ownedByGenerator[best.gen.id] = after;

    events.push({
      t_sec: t,
      type: 'purchase',
      gen_id: best.gen.id,
      cost: best.cost,
      owned_after: after,
    });
    if (purchaseTimes[best.gen.id] === null) {
      purchaseTimes[best.gen.id] = t;
    }

    // 7. Auto-unlock check.
    if (best.gen.is_click_driven && before < best.gen.auto_unlock_at && after >= best.gen.auto_unlock_at) {
      events.push({
        t_sec: t,
        type: 'auto_unlock',
        gen_id: best.gen.id,
        operative: best.gen.auto_operative_name,
      });
      if (firstAutoUnlock === null) firstAutoUnlock = t;
    }

    // 8. Milestone crossings.
    for (const m of milestonesCrossed(best.gen, before, after)) {
      const mult = milestoneMultiplier(after, best.gen.milestones);
      events.push({
        t_sec: t,
        type: 'milestone',
        gen_id: best.gen.id,
        owned: m,
        multiplier: mult,
      });
    }

    // 9. Prestige check.
    const projMI = computeMemeticInheritance(state.lifetimeRumor, era.prestige_pivot);
    if (!prestigeRecorded && projMI >= 1) {
      events.push({ t_sec: t, type: 'prestige_available', projected_mi: projMI });
      firstPrestige = t;
      prestigeRecorded = true;
      if (stopOnFirstPrestige) {
        events.push({ t_sec: t, type: 'stop', reason: 'prestige_reached' });
        return finalize();
      }
    }
  }

  if (iter >= MAX_ITER) {
    events.push({ t_sec: t, type: 'stop', reason: 'stalled' });
  } else if (t >= horizonSec) {
    events.push({ t_sec: horizonSec, type: 'stop', reason: 'horizon' });
    t = horizonSec;
  }

  return finalize();

  function finalize(): SimulationResult {
    return {
      era_id: era.id,
      horizon_sec: horizonSec,
      reached_horizon: t >= horizonSec,
      events,
      final_state: state,
      time_to_first_auto_unlock_sec: firstAutoUnlock,
      time_to_each_generator_purchase_sec: purchaseTimes,
      time_to_first_prestige_sec: firstPrestige,
      lifetime_rumor_at_horizon: state.lifetimeRumor,
      projected_mi_at_horizon: computeMemeticInheritance(state.lifetimeRumor, era.prestige_pivot),
      times_each_gen_was_best_buy: bestBuyCounts,
    };
  }
}

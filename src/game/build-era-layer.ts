import type { EraDefinition } from '../content/schema';
import { computeCost, generatorProduction } from './era-layer';
import { computeMemeticInheritance, carryoverMultiplier } from './prestige';

export interface EraLayerState {
  ownedByGenerator: Record<string, number>;
  lifetimeRumor: number;
  rumor: number;
  globalMultiplier: number;
}

export function buildEraLayer(era: EraDefinition, mi: number) {
  const globalMultiplier = carryoverMultiplier(mi);

  const generators = era.generators.map(gen => ({
    def: gen,
    cost: (owned: number) => computeCost(gen.base_cost, gen.cost_growth, owned),
    productionPerSec: (owned: number) =>
      generatorProduction(gen, owned, globalMultiplier),
  }));

  // The tier-1 generator is click-driven AND auto-unlocks at `auto_unlock_at`.
  const tier1 = generators.find(g => g.def.is_click_driven);
  if (!tier1) throw new Error(`Era ${era.id} has no click-driven Tier-1 generator`);

  const onClick = (state: EraLayerState) => {
    state.rumor += 1;
    state.lifetimeRumor += 1;
  };

  const onTick = (state: EraLayerState, dtSeconds: number) => {
    let gained = 0;
    for (const g of generators) {
      const owned = state.ownedByGenerator[g.def.id] ?? 0;
      const autoActive = g.def.is_click_driven
        ? owned >= g.def.auto_unlock_at
        : true;
      if (autoActive) gained += g.productionPerSec(owned) * dtSeconds;
    }
    state.rumor += gained;
    state.lifetimeRumor += gained;
  };

  const performPrestige = (state: EraLayerState): number => {
    return computeMemeticInheritance(state.lifetimeRumor, era.prestige_pivot);
  };

  return {
    era,
    generators,
    onClick,
    onTick,
    performPrestige,
    globalMultiplier,
  };
}

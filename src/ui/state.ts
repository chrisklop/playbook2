import { reactive, computed } from 'vue';
import { getEra, registry } from '../content/registry';
import { computeCost, generatorProduction } from '../game/era-layer';
import { computeMemeticInheritance, carryoverMultiplier } from '../game/prestige';
import { applyTheme } from './theme';

type EraId = 'antiquity' | 'printing-press' | 'penny-press';

export const state = reactive({
  currentEraId: 'antiquity' as EraId,
  rumor: 0,
  lifetimeRumor: 0,
  memeticInheritance: 0,
  ownedByGenerator: {} as Record<string, number>,
});

export const currentBundle = computed(() => getEra(state.currentEraId));
export const currentEra = computed(() => currentBundle.value.era);
export const currentTheme = computed(() => currentBundle.value.theme);
export const currentTicker = computed(() => currentBundle.value.ticker);
export const currentCopy = computed(() => currentBundle.value.copy);

export function click(): void {
  state.rumor += 1;
  state.lifetimeRumor += 1;
}

export function buyGenerator(genId: string): boolean {
  const gen = currentEra.value.generators.find(g => g.id === genId);
  if (!gen) return false;
  const owned = state.ownedByGenerator[genId] ?? 0;
  const cost = computeCost(gen.base_cost, gen.cost_growth, owned);
  if (state.rumor < cost) return false;
  state.rumor -= cost;
  state.ownedByGenerator[genId] = owned + 1;
  return true;
}

export const productionPerSecond = computed(() => {
  const globalMult = carryoverMultiplier(state.memeticInheritance);
  let total = 0;
  for (const gen of currentEra.value.generators) {
    const owned = state.ownedByGenerator[gen.id] ?? 0;
    total += generatorProduction(gen, owned, globalMult);
  }
  return total;
});

export const projectedMI = computed(() =>
  computeMemeticInheritance(state.lifetimeRumor, currentEra.value.prestige_pivot)
);
export const canPrestige = computed(() => projectedMI.value >= 1);

export const visibleGenerators = computed(() =>
  currentEra.value.generators.filter(g => state.lifetimeRumor >= g.reveal_at_lifetime)
);

/** Prestige into the next era. Carryover MI persists; rumor/owned reset; theme swaps. */
export function performPrestige(): void {
  const newMI = projectedMI.value;
  state.memeticInheritance += newMI;
  state.rumor = 0;
  state.lifetimeRumor = 0;
  state.ownedByGenerator = {};

  const nextEraId = currentEra.value.prestige_into;
  if (nextEraId === null) {
    // Final era — stay put (Phase 1 has only 3 eras; penny-press is terminal).
    return;
  }
  if (!registry.eraIds.includes(nextEraId)) {
    throw new Error(`Cannot prestige into unknown era: '${nextEraId}'`);
  }
  state.currentEraId = nextEraId as EraId;
  if (typeof document !== 'undefined') {
    applyTheme(currentTheme.value);
  }
}

// Initial theme application at boot.
if (typeof document !== 'undefined') {
  applyTheme(currentTheme.value);
}

// Tick loop — temporary self-contained interval.
const TICK_MS = 100;
if (typeof window !== 'undefined') {
  setInterval(() => {
    const gained = productionPerSecond.value * (TICK_MS / 1000);
    if (gained > 0) {
      state.rumor += gained;
      state.lifetimeRumor += gained;
    }
  }, TICK_MS);
}

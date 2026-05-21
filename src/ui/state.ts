import { reactive, computed } from 'vue';
import { getEra } from '../content/registry';
import { computeCost, generatorProduction } from '../game/era-layer';
import { computeMemeticInheritance, carryoverMultiplier } from '../game/prestige';
import { applyTheme } from './theme';

// Phase 1 ships with Era 1 only; multi-era prestige comes in Phase 6 (Task 28).
const bundle = getEra('antiquity');

export const currentEra = bundle.era;
export const currentTheme = bundle.theme;
export const currentTicker = bundle.ticker;
export const currentCopy = bundle.copy;

// Guard against SSR/test environments without document
if (typeof document !== 'undefined') {
  applyTheme(currentTheme);
}

export const state = reactive({
  rumor: 0,
  lifetimeRumor: 0,
  memeticInheritance: 0,
  ownedByGenerator: {} as Record<string, number>,
});

export function click(): void {
  state.rumor += 1;
  state.lifetimeRumor += 1;
}

export function buyGenerator(genId: string): boolean {
  const gen = currentEra.generators.find(g => g.id === genId);
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
  for (const gen of currentEra.generators) {
    const owned = state.ownedByGenerator[gen.id] ?? 0;
    total += generatorProduction(gen, owned, globalMult);
  }
  return total;
});

export const projectedMI = computed(() => computeMemeticInheritance(state.lifetimeRumor));

/** Progressive-reveal filter — AdCap pattern. Hide generators whose lifetime threshold hasn't been met. */
export const visibleGenerators = computed(() =>
  currentEra.generators.filter(g => state.lifetimeRumor >= g.reveal_at_lifetime)
);

// Tick loop — temporary self-contained interval. Phase 2 polish will bridge into Profectus's tick system.
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

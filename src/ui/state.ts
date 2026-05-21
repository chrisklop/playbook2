import { reactive, computed } from 'vue';
import { getEra, registry } from '../content/registry';
import {
  computeCost,
  generatorProduction,
  pickOptimalGenerator,
} from '../game/era-layer';
import { computeMemeticInheritance, carryoverMultiplier } from '../game/prestige';
import {
  readLocalSave,
  type SaveState,
  type BulkBuyMultiplier,
} from '../game/save';
import { applyTheme } from './theme';

type EraId = 'antiquity' | 'printing-press' | 'penny-press';

export const state = reactive({
  currentEraId: 'antiquity' as EraId,
  rumor: 0,
  lifetimeRumor: 0,
  memeticInheritance: 0,
  ownedByGenerator: {} as Record<string, number>,
  // v2 additions
  prestigeCount: 0,
  seenToastEvents: new Set<string>(),
  bulkBuyMultiplier: 1 as BulkBuyMultiplier,
  showBestBuyHint: true,
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

/**
 * Generator id currently identified as the optimal next purchase by the
 * Pecorella overtake heuristic. Null when:
 *   - The "best-buy hint" setting is off
 *   - No visible generators
 *   - The heuristic can't decide
 */
export const recommendedGenId = computed<string | null>(() => {
  if (!state.showBestBuyHint) return null;
  const visible = visibleGenerators.value;
  if (visible.length === 0) return null;
  return pickOptimalGenerator(
    visible,
    { rumor: state.rumor, ownedByGenerator: state.ownedByGenerator },
    carryoverMultiplier(state.memeticInheritance),
  );
});

/** Prestige into the next era. Carryover MI persists; rumor/owned reset; theme swaps. */
export function performPrestige(): void {
  const newMI = projectedMI.value;
  state.memeticInheritance += newMI;
  state.prestigeCount += 1;
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

/** Apply a loaded SaveState to live reactive state. Called once at boot. */
export function applyLoadedSave(save: SaveState): void {
  state.currentEraId = save.current_era as EraId;
  state.rumor = save.rumor;
  state.lifetimeRumor = save.lifetime_rumor;
  state.memeticInheritance = save.memetic_inheritance;
  state.ownedByGenerator = { ...save.owned_by_generator };
  state.prestigeCount = save.prestige_count;
  state.seenToastEvents = new Set(save.seen_toast_events);
  state.bulkBuyMultiplier = save.bulk_buy_multiplier;
  state.showBestBuyHint = save.show_best_buy_hint;
}

/** Snapshot live state into a SaveState. Used by autosave + export. */
export function snapshotSave(): SaveState {
  return {
    version: 2,
    current_era: state.currentEraId,
    rumor: state.rumor,
    lifetime_rumor: state.lifetimeRumor,
    memetic_inheritance: state.memeticInheritance,
    owned_by_generator: { ...state.ownedByGenerator },
    unlocked_codex: [],
    saved_at_ms: Date.now(),
    prestige_count: state.prestigeCount,
    seen_toast_events: Array.from(state.seenToastEvents),
    bulk_buy_multiplier: state.bulkBuyMultiplier,
    show_best_buy_hint: state.showBestBuyHint,
  };
}

// Boot-time save load — only when running in a browser
if (typeof window !== 'undefined') {
  const loaded = readLocalSave();
  if (loaded) applyLoadedSave(loaded);
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

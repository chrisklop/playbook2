import { reactive, computed, watch } from 'vue';
import { getEra, registry } from '../content/registry';
import {
  computeCost,
  computeBulkCost,
  generatorProduction,
  maxAffordableBulk,
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

/**
 * Buy N units of a generator. Returns the number actually purchased
 * (may be less than `n` for a partial-affordable buy).
 *
 * When `n === 'max'`, buys the maximum the player can afford via
 * maxAffordableBulk. When `n` is a number, attempts to buy that many;
 * falls back to a partial buy if the full bulk cost can't be covered.
 */
export function buyGenerator(genId: string, n: number | 'max' = 1): number {
  const gen = currentEra.value.generators.find(g => g.id === genId);
  if (!gen) return 0;
  const owned = state.ownedByGenerator[genId] ?? 0;

  let buyN: number;
  if (n === 'max') {
    buyN = maxAffordableBulk(gen.base_cost, gen.cost_growth, owned, state.rumor);
  } else {
    const fullCost = computeBulkCost(gen.base_cost, gen.cost_growth, owned, n);
    if (state.rumor >= fullCost) {
      buyN = n;
    } else {
      buyN = maxAffordableBulk(gen.base_cost, gen.cost_growth, owned, state.rumor);
    }
  }

  if (buyN <= 0) return 0;
  const totalCost = computeBulkCost(gen.base_cost, gen.cost_growth, owned, buyN);
  state.rumor -= totalCost;
  state.ownedByGenerator[genId] = owned + buyN;
  return buyN;
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

/** Lowest-threshold currently-locked generator, or null when all are revealed. */
export const nextHiddenGenerator = computed(() => {
  const hidden = currentEra.value.generators
    .filter(g => state.lifetimeRumor < g.reveal_at_lifetime)
    .sort((a, b) => a.reveal_at_lifetime - b.reveal_at_lifetime);
  return hidden[0] ?? null;
});

/** True when the next hidden gen is at least 80% of its threshold. */
export const showRevealPlaceholder = computed(() => {
  const g = nextHiddenGenerator.value;
  if (!g) return false;
  return state.lifetimeRumor >= g.reveal_at_lifetime * 0.8;
});

/** Progress 0..1 toward the next hidden generator's reveal. */
export const nextRevealProgress = computed(() => {
  const g = nextHiddenGenerator.value;
  if (!g) return 0;
  return Math.min(1, state.lifetimeRumor / g.reveal_at_lifetime);
});

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

// Toast triggers — fire once per condition per era, deduped via seenToastEvents.
if (typeof window !== 'undefined') {
  // Lazy import to avoid circular: toast-state imports state, state imports toast-state.
  // The dynamic import resolves at module load.
  import('./toast-state').then(({ fireToast }) => {
    // Trigger 1: First Sycophant auto-unlock (per era + per click-driven generator).
    watch(
      () => {
        const tier1 = currentEra.value.generators.find(g => g.is_click_driven);
        if (!tier1) return null;
        const owned = state.ownedByGenerator[tier1.id] ?? 0;
        return owned >= tier1.auto_unlock_at ? tier1.id : null;
      },
      (nowUnlocked, before) => {
        if (nowUnlocked && !before) {
          const tier1 = currentEra.value.generators.find(g => g.id === nowUnlocked);
          if (tier1) {
            fireToast({
              id: `auto-unlock:${currentEra.value.id}:${tier1.id}`,
              message: `${tier1.auto_operative_name} hired — idle Rumor flowing.`,
              era_id: currentEra.value.id,
            });
          }
        }
      },
    );

    // Trigger 2: A non-click-driven generator first becomes revealed.
    let lastRevealedSet = new Set<string>();
    watch(
      () =>
        currentEra.value.generators
          .filter(g => state.lifetimeRumor >= g.reveal_at_lifetime)
          .map(g => g.id),
      newlyRevealed => {
        for (const id of newlyRevealed) {
          if (!lastRevealedSet.has(id)) {
            lastRevealedSet.add(id);
            const gen = currentEra.value.generators.find(g => g.id === id);
            // Skip click-driven Tier 1 — it's always visible from session start; reveal toast would be silly.
            if (gen && !gen.is_click_driven) {
              fireToast({
                id: `reveal:${currentEra.value.id}:${id}`,
                message: `${gen.display_name} appears.`,
                era_id: currentEra.value.id,
              });
            }
          }
        }
      },
      { immediate: true },
    );

    // Reset the revealed-set tracker on era change so a new era's reveal toasts fire fresh.
    watch(
      () => state.currentEraId,
      () => {
        lastRevealedSet = new Set();
      },
    );

    // Trigger 3: Prestige threshold reached.
    watch(
      () => canPrestige.value,
      (now, before) => {
        if (now && !before) {
          fireToast({
            id: `prestige-ready:${currentEra.value.id}`,
            message:
              currentCopy.value.prestige_ready_toast ??
              "The threshold calls. Ascend whenever you're ready.",
            era_id: currentEra.value.id,
          });
        }
      },
    );

    // Trigger 4: Bulk-buy tier unlocks (×10 at 1+ prestige, ×100 at 5+, max at 25+).
    watch(
      () => state.prestigeCount,
      count => {
        if (count >= 1) {
          fireToast({ id: 'bulk-unlock:10', message: '×10 buy unlocked.', era_id: currentEra.value.id });
        }
        if (count >= 5) {
          fireToast({ id: 'bulk-unlock:100', message: '×100 buy unlocked.', era_id: currentEra.value.id });
        }
        if (count >= 25) {
          fireToast({ id: 'bulk-unlock:max', message: 'Max buy unlocked.', era_id: currentEra.value.id });
        }
      },
    );
  });
}

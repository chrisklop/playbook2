import { reactive, computed, watch } from 'vue';
import { getEra, registry } from '../content/registry';
import {
  computeCost,
  computeBulkCost,
  generatorProduction,
  maxAffordableBulk,
  payoutPerCycle,
  pickOptimalGenerator,
} from '../game/era-layer';
import { computeMemeticInheritance, carryoverMultiplier } from '../game/prestige';
import {
  readLocalSave,
  writeLocalSave,
  type SaveState,
  type BulkBuyMultiplier,
} from '../game/save';
import { applyTheme } from './theme';

type EraId = 'antiquity' | 'printing-press' | 'penny-press';

export interface LastPayout {
  amount: number;
  ts: number; // Date.now() at payout — UI watches this for popper animations
}

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
  // v3 additions — cycles + managers
  cycleProgress: {} as Record<string, number>, // gen.id → 0..1
  managersHired: new Set<string>(),
  upgradeMultByGenerator: {} as Record<string, number>, // Phase 2 prep; defaults to 1.0
  lastPayout: {} as Record<string, LastPayout>, // ephemeral, drives popper animations
});

export const currentBundle = computed(() => getEra(state.currentEraId));
export const currentEra = computed(() => currentBundle.value.era);
export const currentTheme = computed(() => currentBundle.value.theme);
export const currentTicker = computed(() => currentBundle.value.ticker);
export const currentCopy = computed(() => currentBundle.value.copy);

/** Convenience: is the player's manager hired for this generator? */
export function isManagerHired(genId: string): boolean {
  return state.managersHired.has(genId);
}

/** Click on Tier-1 click-driven card: +1 Rumor, kick its cycle, auto-buy if affordable. */
export function click(): void {
  state.rumor += 1;
  state.lifetimeRumor += 1;
  // Also kick the Tier 1 cycle if it isn't already in flight or manager-hired.
  const tier1 = currentEra.value.generators.find(g => g.is_click_driven);
  if (tier1) tapCycle(tier1.id);
}

/**
 * Tap a non-manager-hired generator's card to kick off one cycle.
 * Sets cycleProgress to a small epsilon so the tick loop picks it up.
 * If manager already hired, this is a no-op (cycle is already auto-running).
 */
export function tapCycle(genId: string): void {
  if (state.managersHired.has(genId)) return;
  const owned = state.ownedByGenerator[genId] ?? 0;
  if (owned <= 0) return;
  if ((state.cycleProgress[genId] ?? 0) === 0) {
    state.cycleProgress[genId] = 0.0001;
  }
}

/**
 * Buy N units of a generator. Returns the number actually purchased.
 * (Unchanged from v0.2 — bulk-buy semantics intact.)
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

/**
 * Hire the manager for a generator. Costs `manager_cost` Rumor; once hired, the
 * generator's cycle auto-runs continuously. Returns true on success.
 */
export function hireManager(genId: string): boolean {
  const gen = currentEra.value.generators.find(g => g.id === genId);
  if (!gen) return false;
  if (state.managersHired.has(genId)) return false; // already hired
  if (state.rumor < gen.manager_cost) return false;
  state.rumor -= gen.manager_cost;
  state.managersHired.add(genId);
  return true;
}

/**
 * Production-per-second computed (used by the rate display + simulator).
 * Steady-state equivalent to summing cycleRatePerSecond across owned generators.
 * Note: only counts generators that will actually be producing (manager hired,
 * or cycle currently in flight). Idle untapped generators contribute 0.
 */
export const productionPerSecond = computed(() => {
  const globalMult = carryoverMultiplier(state.memeticInheritance);
  let total = 0;
  for (const gen of currentEra.value.generators) {
    const owned = state.ownedByGenerator[gen.id] ?? 0;
    if (owned <= 0) continue;
    const willProduce =
      state.managersHired.has(gen.id) || (state.cycleProgress[gen.id] ?? 0) > 0;
    if (!willProduce) continue;
    const upgradeMult = state.upgradeMultByGenerator[gen.id] ?? 1;
    // Steady-state rate = payout / cycle_seconds = base × owned × milestone × global × upgrade
    total += generatorProduction(gen, owned, globalMult) * upgradeMult;
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

export const nextHiddenGenerator = computed(() => {
  const hidden = currentEra.value.generators
    .filter(g => state.lifetimeRumor < g.reveal_at_lifetime)
    .sort((a, b) => a.reveal_at_lifetime - b.reveal_at_lifetime);
  return hidden[0] ?? null;
});

export const showRevealPlaceholder = computed(() => {
  const g = nextHiddenGenerator.value;
  if (!g) return false;
  return state.lifetimeRumor >= g.reveal_at_lifetime * 0.8;
});

export const nextRevealProgress = computed(() => {
  const g = nextHiddenGenerator.value;
  if (!g) return 0;
  return Math.min(1, state.lifetimeRumor / g.reveal_at_lifetime);
});

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

/** Prestige into the next era. Carryover MI persists; rumor/owned/cycles reset; managers reset. */
export function performPrestige(): void {
  const newMI = projectedMI.value;
  state.memeticInheritance += newMI;
  state.prestigeCount += 1;
  state.rumor = 0;
  state.lifetimeRumor = 0;
  state.ownedByGenerator = {};
  state.cycleProgress = {};
  state.managersHired = new Set();
  state.upgradeMultByGenerator = {};
  state.lastPayout = {};

  const nextEraId = currentEra.value.prestige_into;
  if (nextEraId === null) return;
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
  state.cycleProgress = { ...save.cycle_progress };
  state.managersHired = new Set(save.managers_hired);

  // Backward compatibility: pre-v3 players who reached auto_unlock_at on a
  // click-driven generator deserve the manager free (we changed the mechanic).
  // Inspect the current era's generators and auto-hire eligible managers.
  try {
    const era = getEra(state.currentEraId);
    for (const gen of era.era.generators) {
      if (
        gen.is_click_driven &&
        (state.ownedByGenerator[gen.id] ?? 0) >= gen.auto_unlock_at &&
        !state.managersHired.has(gen.id)
      ) {
        state.managersHired.add(gen.id);
      }
    }
  } catch {
    /* ignore — getEra may fail at boot in unusual configs */
  }
}

export function snapshotSave(): SaveState {
  return {
    version: 3,
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
    cycle_progress: { ...state.cycleProgress },
    managers_hired: Array.from(state.managersHired),
  };
}

if (typeof window !== 'undefined') {
  const loaded = readLocalSave();
  if (loaded) applyLoadedSave(loaded);
}

if (typeof document !== 'undefined') {
  applyTheme(currentTheme.value);
}

// === Cycle-based tick loop (replaces v0.2 rate-tick) ===
const TICK_MS = 100;
if (typeof window !== 'undefined') {
  setInterval(() => {
    const dt = TICK_MS / 1000;
    const globalMult = carryoverMultiplier(state.memeticInheritance);
    const era = currentEra.value;

    for (const gen of era.generators) {
      const owned = state.ownedByGenerator[gen.id] ?? 0;
      if (owned <= 0) continue;

      const managerHired = state.managersHired.has(gen.id);
      const cycleInFlight = (state.cycleProgress[gen.id] ?? 0) > 0;

      // Cycle advances only when manager hired OR a tap has kicked it off.
      if (!managerHired && !cycleInFlight) continue;

      const oldProgress = state.cycleProgress[gen.id] ?? 0;
      let newProgress = oldProgress + dt / gen.cycle_seconds;

      // May fire multiple payouts per tick if cycle_seconds is very short and tick is slow.
      while (newProgress >= 1) {
        const upgradeMult = state.upgradeMultByGenerator[gen.id] ?? 1;
        const payout = payoutPerCycle(gen, owned, globalMult, upgradeMult);
        state.rumor += payout;
        state.lifetimeRumor += payout;
        state.lastPayout[gen.id] = { amount: payout, ts: Date.now() };
        newProgress -= 1;
        if (!managerHired) {
          // Without manager, cycle stops after one payout — player must tap to start next.
          newProgress = 0;
          break;
        }
      }
      state.cycleProgress[gen.id] = newProgress;
    }
  }, TICK_MS);

  // Autosave every 10 seconds and on visibility change.
  const autosave = () => {
    try {
      writeLocalSave(snapshotSave());
    } catch (err) {
      console.error('Autosave failed:', err);
    }
  };
  window.setInterval(autosave, 10_000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') autosave();
  });
}

// === Toast triggers ===
if (typeof window !== 'undefined') {
  import('./toast-state').then(({ fireToast }) => {
    // Trigger: Manager hired (per era + per generator) — fires when hireManager succeeds.
    // We observe managersHired set membership changes.
    let lastManagersHired = new Set<string>();
    watch(
      () => Array.from(state.managersHired).sort().join(','),
      () => {
        const era = currentEra.value;
        for (const id of state.managersHired) {
          if (!lastManagersHired.has(id)) {
            const gen = era.generators.find(g => g.id === id);
            if (gen) {
              fireToast({
                id: `manager-hired:${era.id}:${id}`,
                message: `${gen.manager_name} hired — ${gen.display_name} now auto-cycling.`,
                era_id: era.id,
              });
            }
          }
        }
        lastManagersHired = new Set(state.managersHired);
      },
      { immediate: true },
    );

    // Reset manager tracker on era change so manager hires in a new era re-fire.
    watch(
      () => state.currentEraId,
      () => {
        lastManagersHired = new Set();
      },
    );

    // Trigger: Generator first becomes revealed (skip click-driven Tier 1).
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

    watch(
      () => state.currentEraId,
      () => {
        lastRevealedSet = new Set();
      },
    );

    // Trigger: Prestige threshold reached.
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

    // Trigger: Bulk-buy tier unlocks.
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

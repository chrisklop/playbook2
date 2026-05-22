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
import { multiplierForTechnique } from '../game/mastery';
import type { TechniqueId } from '../content/types';
import {
  pickRandomEvent,
  pickNextSpawnAt,
  spawnOffer,
  claimOffer,
  bonusMultiplier,
  type ActiveOffer,
  type ActiveBonus,
} from '../game/ticker-events';
import {
  readLocalSave,
  writeLocalSave,
  type SaveState,
  type BulkBuyMultiplier,
} from '../game/save';
import { applyTheme } from './theme';
import {
  playClick,
  playBuy,
  playManagerHired,
  playUpgrade,
  playMilestone,
  playPrestige,
  setMuted,
  setMusicMuted,
  setMusicVolume,
  loadMusic,
  startMusic,
  loadCue,
  playCue,
} from './audio';

type EraId = 'antiquity' | 'printing-press' | 'penny-press' | 'propaganda-state';

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
  // v3 additions — cycles + managers + upgrades
  cycleProgress: {} as Record<string, number>, // gen.id → 0..1
  managersHired: new Set<string>(),
  upgradesPurchased: new Set<string>(), // upgrade.id set
  audioMuted: false,
  musicMuted: false,
  musicVolume: 0.20, // 0..1 — default 20%, user-adjustable via Settings slider
  lastPayout: {} as Record<string, LastPayout>, // ephemeral, drives popper animations
  // v4 — ticker events
  activeOffer: null as ActiveOffer | null,
  activeBonus: null as ActiveBonus | null,
  nextEventSpawnAt: 0, // ms epoch; 0 means "schedule on first tick"
  nowMs: Date.now(), // bumped each tick so countdown UIs stay reactive
  // v5 — Technique Mastery (persists across prestige)
  techniqueMastery: {} as Record<string, number>,
  codexMastered: new Set<string>(),
  // v6 — Loops completed (each time prestige carries you back to an earlier era)
  loopsCompleted: 0,
});

/**
 * Player "claims" a codex entry once they've read it — bumps mastery by
 * +1 for each technique tag in the entry's frontmatter, marks the entry
 * as mastered (one-time), and chimes. Returns true on success.
 */
export function claimCodexMastery(codexId: string, techniqueTags: string[]): boolean {
  if (state.codexMastered.has(codexId)) return false;
  if (techniqueTags.length === 0) return false;
  state.codexMastered.add(codexId);
  for (const tag of techniqueTags) {
    state.techniqueMastery[tag] = (state.techniqueMastery[tag] ?? 0) + 1;
  }
  playUpgrade();
  return true;
}

// Keep the audio module's local mute flags in sync with reactive state.
watch(
  () => state.audioMuted,
  v => setMuted(v),
  { immediate: true },
);

// Frenzy music swap — fire the cue the moment an is_frenzy bonus goes active,
// not on every state.activeBonus mutation (otherwise the watcher would also
// trip on regular bonuses or on tick-time field updates). We compare the
// source_event_id of frenzy bonuses so each new burst plays exactly once.
let lastFrenzyEventId: string | null = null;
watch(
  () => (state.activeBonus?.is_frenzy ? state.activeBonus.source_event_id : null),
  id => {
    if (id && id !== lastFrenzyEventId) {
      lastFrenzyEventId = id;
      playCue('frenzy');
    } else if (!id) {
      lastFrenzyEventId = null;
    }
  },
);
watch(
  () => state.musicMuted,
  v => setMusicMuted(v),
  { immediate: true },
);
watch(
  () => state.musicVolume,
  v => setMusicVolume(v),
  { immediate: true },
);

// Boot the background-music loop. URL resolves against Vite's BASE_URL so
// it works both at the local dev origin and at the /playbook2/ GH Pages
// path. The file lives in public/music/ (see README of that folder).
if (typeof window !== 'undefined') {
  const base = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '/');
  loadMusic(base + 'music/playbook-loop.mp3');
  loadCue('frenzy', base + 'music/playbook-frenzy.mp3');
  loadCue('prestige', base + 'music/playbook-prestige.mp3');
  loadCue('bridge', base + 'music/playbook-bridge.mp3');
  // Browsers block autoplay until first user gesture — re-attempt on the
  // first interaction so playback starts as soon as the player taps.
  const kickstart = () => {
    startMusic();
    window.removeEventListener('pointerdown', kickstart);
    window.removeEventListener('keydown', kickstart);
  };
  window.addEventListener('pointerdown', kickstart, { once: true });
  window.addEventListener('keydown', kickstart, { once: true });
}

export const currentBundle = computed(() => getEra(state.currentEraId));
export const currentEra = computed(() => currentBundle.value.era);
export const currentTheme = computed(() => currentBundle.value.theme);
export const currentTicker = computed(() => currentBundle.value.ticker);
export const currentCopy = computed(() => currentBundle.value.copy);

/** Convenience: is the player's manager hired for this generator? */
export function isManagerHired(genId: string): boolean {
  return state.managersHired.has(genId);
}

/**
 * Derived multiplier for a generator — product of all purchased upgrades' multipliers.
 * Defaults to 1.0 (no purchased upgrades).
 */
export function upgradeMultFor(genId: string): number {
  const gen = currentEra.value.generators.find(g => g.id === genId);
  if (!gen) return 1;
  let mult = 1;
  for (const up of gen.upgrades) {
    if (state.upgradesPurchased.has(up.id)) mult *= up.multiplier;
  }
  return mult;
}

/**
 * Next-available upgrade for a generator — the lowest-unlock-at upgrade that is
 * (a) not yet purchased AND (b) has owned >= unlock_at_owned. Returns null if
 * all are purchased or none are unlocked yet.
 */
export function nextUpgradeFor(genId: string) {
  const gen = currentEra.value.generators.find(g => g.id === genId);
  if (!gen) return null;
  const owned = state.ownedByGenerator[genId] ?? 0;
  const available = gen.upgrades
    .filter(u => owned >= u.unlock_at_owned && !state.upgradesPurchased.has(u.id))
    .sort((a, b) => a.unlock_at_owned - b.unlock_at_owned);
  return available[0] ?? null;
}

/** Spend Rumor to purchase an upgrade. Returns true on success. */
export function buyUpgrade(upgradeId: string): boolean {
  const gen = currentEra.value.generators.find(g =>
    g.upgrades.some(u => u.id === upgradeId),
  );
  if (!gen) return false;
  const up = gen.upgrades.find(u => u.id === upgradeId);
  if (!up) return false;
  if (state.upgradesPurchased.has(upgradeId)) return false;
  const owned = state.ownedByGenerator[gen.id] ?? 0;
  if (owned < up.unlock_at_owned) return false;
  if (state.rumor < up.cost) return false;
  state.rumor -= up.cost;
  state.upgradesPurchased.add(upgradeId);
  playUpgrade();
  return true;
}

/** Click on Tier-1 click-driven card: +1 Rumor, kick its cycle, auto-buy if affordable. */
export function click(): void {
  state.rumor += 1;
  state.lifetimeRumor += 1;
  playClick();
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
  playBuy();
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
  playManagerHired();
  return true;
}

/**
 * Production-per-second computed (used by the rate display + simulator).
 * Steady-state equivalent to summing cycleRatePerSecond across owned generators.
 * Note: only counts generators that will actually be producing (manager hired,
 * or cycle currently in flight). Idle untapped generators contribute 0.
 *
 * Multiplies in the active ticker-event bonus (1.0 when no claim is active).
 */
export const productionPerSecond = computed(() => {
  const globalMult = carryoverMultiplier(state.memeticInheritance);
  const eventMult = bonusMultiplier(state.activeBonus, state.nowMs);
  let total = 0;
  for (const gen of currentEra.value.generators) {
    const owned = state.ownedByGenerator[gen.id] ?? 0;
    if (owned <= 0) continue;
    // Only count generators that are actually producing right now: manager
    // hired (continuous), or a cycle currently in flight (will complete and
    // pay out). Idle owned-but-untapped generators contribute 0 — the rate
    // display is "what you're earning passively," not "what these tiles
    // could earn if you kept tapping them."
    const willProduce =
      state.managersHired.has(gen.id) || (state.cycleProgress[gen.id] ?? 0) > 0;
    if (!willProduce) continue;
    const upgradeMult = upgradeMultFor(gen.id);
    const masteryMult = multiplierForTechnique(
      state.techniqueMastery,
      gen.technique_tag as TechniqueId,
    );
    total += generatorProduction(gen, owned, globalMult) * upgradeMult * eventMult * masteryMult;
  }
  return total;
});

/** Mastery multiplier for one generator — used by tile UIs that need to
 *  preview the bonus alongside upgrades/milestones. */
export function masteryMultFor(genId: string): number {
  const gen = currentEra.value.generators.find(g => g.id === genId);
  if (!gen) return 1;
  return multiplierForTechnique(state.techniqueMastery, gen.technique_tag as TechniqueId);
}

/** Claim the currently-displayed offer. Replaces any active bonus. */
export function claimActiveOffer(): boolean {
  const offer = state.activeOffer;
  if (!offer) return false;
  if (Date.now() >= offer.expires_at_ms) {
    state.activeOffer = null;
    return false;
  }
  state.activeBonus = claimOffer(offer, Date.now());
  state.activeOffer = null;
  state.nextEventSpawnAt = pickNextSpawnAt(Date.now() + state.activeBonus.duration_s * 1000);
  playUpgrade(); // re-use the upgrade chime for now — distinct + celebratory
  return true;
}

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

/**
 * True iff at least one visible generator has a *genuine* next-milestone buy
 * that the player can currently afford. Drives the NEXT button's pulse on
 * the bulk bar — AdCap-style "buy exactly to reach the next x2/x4/x8 etc."
 *
 * Only owned >= 1 tiles count here. Unowned tiles in NEXT mode resolve to
 * "buy 1" as a seed purchase (see GeneratorCard's bulkN computed), which
 * shouldn't trigger the pulse -- otherwise the bar would fire any time the
 * cheapest unlocked tile was within budget, diluting the "you can hit a
 * real milestone right now" signal.
 */
export const anyNextMilestoneAffordable = computed<boolean>(() => {
  for (const gen of visibleGenerators.value) {
    const owned = state.ownedByGenerator[gen.id] ?? 0;
    if (owned < 1) continue; // unowned tiles aren't milestone targets
    let target: number | null = null;
    for (const ms of gen.milestones) {
      if (owned < ms) { target = ms; break; }
    }
    if (target === null) continue; // past all milestones for this tier
    const need = Math.max(1, target - owned);
    const cost = computeBulkCost(gen.base_cost, gen.cost_growth, owned, need);
    if (state.rumor >= cost) return true;
  }
  return false;
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
  playPrestige();
  // Swap to the prestige cue. The loop returns automatically on cue end.
  playCue('prestige');
  state.memeticInheritance += newMI;
  state.prestigeCount += 1;
  state.rumor = 0;
  state.lifetimeRumor = 0;
  state.ownedByGenerator = {};
  state.cycleProgress = {};
  state.managersHired = new Set();
  state.upgradesPurchased = new Set();
  state.lastPayout = {};
  state.activeOffer = null;
  state.activeBonus = null;
  state.nextEventSpawnAt = 0;

  const nextEraId = currentEra.value.prestige_into;
  if (nextEraId === null) return;
  if (!registry.eraIds.includes(nextEraId)) {
    throw new Error(`Cannot prestige into unknown era: '${nextEraId}'`);
  }

  // Detect a loop-back: when the next era's ordinal is lower than the era
  // we're leaving, the player has completed a full historical lap (Era 4
  // -> Era 1, or whatever the last-built era is at the time).
  const fromOrdinal = currentEra.value.ordinal;
  const toOrdinal = getEra(nextEraId).era.ordinal;
  const isLoopBack = toOrdinal < fromOrdinal;
  if (isLoopBack) state.loopsCompleted += 1;

  state.currentEraId = nextEraId as EraId;
  if (typeof document !== 'undefined') {
    applyTheme(currentTheme.value);
  }

  // Special celebratory toast when a loop completes. Fires after the era
  // switch so currentEra reads as the destination (Antiquity).
  if (isLoopBack && typeof window !== 'undefined') {
    import('./toast-state').then(({ fireToast }) => {
      fireToast({
        id: `loop-completed:${state.loopsCompleted}`,
        message: `Loop ${state.loopsCompleted} begins. Welcome back to ${currentEra.value.display_name}.`,
        era_id: currentEra.value.id,
      });
    });
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
  state.upgradesPurchased = new Set(save.upgrades_purchased ?? []);
  state.audioMuted = save.audio_muted ?? false;
  state.musicMuted = save.music_muted ?? false;
  state.musicVolume = save.music_volume ?? 0.20;
  state.activeOffer = save.active_offer
    ? { ...save.active_offer, is_frenzy: save.active_offer.is_frenzy ?? false }
    : null;
  state.activeBonus = save.active_bonus
    ? { ...save.active_bonus, is_frenzy: save.active_bonus.is_frenzy ?? false }
    : null;
  state.nextEventSpawnAt = save.next_event_spawn_at ?? 0;
  state.nowMs = Date.now();
  state.techniqueMastery = { ...(save.technique_mastery ?? {}) };
  state.codexMastered = new Set(save.codex_mastered ?? []);
  state.loopsCompleted = save.loops_completed ?? 0;

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
    version: 5,
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
    upgrades_purchased: Array.from(state.upgradesPurchased),
    audio_muted: state.audioMuted,
    music_muted: state.musicMuted,
    music_volume: state.musicVolume,
    active_offer: state.activeOffer,
    active_bonus: state.activeBonus,
    next_event_spawn_at: state.nextEventSpawnAt,
    technique_mastery: { ...state.techniqueMastery },
    codex_mastered: Array.from(state.codexMastered),
    loops_completed: state.loopsCompleted,
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
    const now = Date.now();
    state.nowMs = now;
    const globalMult = carryoverMultiplier(state.memeticInheritance);
    const eventMult = bonusMultiplier(state.activeBonus, now);
    const era = currentEra.value;

    // --- Ticker events lifecycle ---
    // Expire stale active bonus.
    if (state.activeBonus && now >= state.activeBonus.expires_at_ms) {
      state.activeBonus = null;
    }
    // Expire stale unclaimed offer.
    if (state.activeOffer && now >= state.activeOffer.expires_at_ms) {
      state.activeOffer = null;
      state.nextEventSpawnAt = pickNextSpawnAt(now);
    }
    // Initialise first spawn time (post-load or first boot).
    if (state.nextEventSpawnAt === 0) {
      state.nextEventSpawnAt = pickNextSpawnAt(now);
    }
    // Spawn a new offer when due and no offer/bonus is currently in flight.
    if (
      !state.activeOffer &&
      !state.activeBonus &&
      now >= state.nextEventSpawnAt
    ) {
      const pool = currentBundle.value.events;
      const pick = pickRandomEvent(pool);
      if (pick) state.activeOffer = spawnOffer(pick, now);
    }

    // --- Generator payouts (with event multiplier baked in) ---
    for (const gen of era.generators) {
      const owned = state.ownedByGenerator[gen.id] ?? 0;
      if (owned <= 0) continue;

      const managerHired = state.managersHired.has(gen.id);
      const cycleInFlight = (state.cycleProgress[gen.id] ?? 0) > 0;

      if (!managerHired && !cycleInFlight) continue;

      const oldProgress = state.cycleProgress[gen.id] ?? 0;
      let newProgress = oldProgress + dt / gen.cycle_seconds;

      while (newProgress >= 1) {
        const upgradeMult = upgradeMultFor(gen.id);
        const masteryMult = multiplierForTechnique(
          state.techniqueMastery,
          gen.technique_tag as TechniqueId,
        );
        const payout = payoutPerCycle(gen, owned, globalMult, upgradeMult) * eventMult * masteryMult;
        state.rumor += payout;
        state.lifetimeRumor += payout;
        state.lastPayout[gen.id] = { amount: payout, ts: now };
        newProgress -= 1;
        if (!managerHired) {
          newProgress = 0;
          break;
        }
      }
      state.cycleProgress[gen.id] = newProgress;
    }
  }, TICK_MS);

  // Autosave every 10 seconds and on visibility change.
  // The hard-reset sentinel (set in SettingsPage.hardReset before reload)
  // tells us to skip writing -- without this, the visibilitychange handler
  // would re-save the in-memory state right after we cleared localStorage,
  // and the reload would restore everything.
  const autosave = () => {
    try {
      if (localStorage.getItem('playbook.hard-reset') === '1') return;
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

// Clear the hard-reset sentinel on app boot — we've already started fresh.
if (typeof window !== 'undefined') {
  if (localStorage.getItem('playbook.hard-reset') === '1') {
    localStorage.removeItem('playbook.hard-reset');
  }
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

    // Trigger: Upgrade purchased — fires when state.upgradesPurchased grows.
    let lastUpgrades = new Set<string>();
    watch(
      () => Array.from(state.upgradesPurchased).sort().join(','),
      () => {
        const era = currentEra.value;
        for (const upgradeId of state.upgradesPurchased) {
          if (!lastUpgrades.has(upgradeId)) {
            const gen = era.generators.find(g =>
              g.upgrades.some(u => u.id === upgradeId),
            );
            const up = gen?.upgrades.find(u => u.id === upgradeId);
            if (gen && up) {
              fireToast({
                id: `upgrade:${era.id}:${upgradeId}`,
                message: `${up.name} — ${gen.display_name} ×${up.multiplier}.`,
                era_id: era.id,
              });
            }
          }
        }
        lastUpgrades = new Set(state.upgradesPurchased);
      },
      { immediate: true },
    );
    watch(
      () => state.currentEraId,
      () => { lastUpgrades = new Set(); },
    );

    // Bulk-buy tiers are now all available from the start, so the old
    // prestige-gated unlock toasts no longer apply. Intentionally removed.
  });
}

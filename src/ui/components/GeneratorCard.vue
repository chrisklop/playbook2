<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  state,
  buyGenerator,
  click,
  hireManager,
  tapCycle,
  isManagerHired,
  nextUpgradeFor,
  buyUpgrade,
  upgradeMultFor,
} from '../state';
import { computeBulkCost, maxAffordableBulk, payoutPerCycle } from '../../game/era-layer';
import { carryoverMultiplier } from '../../game/prestige';
import type { GeneratorTier } from '../../content/schema';
import { formatCost, formatResource } from '../format';
import { playMilestone } from '../audio';
import { currentCopy } from '../state';

// Resource name pulled from the era's copy.json so labels stay era-appropriate
// (Era 1 says "Rumor", Era 2 says "Rumour", Era 4 says "Rumor", etc.).
const resourceName = computed(() => currentCopy.value.resource_labels.rumor ?? 'Rumor');

const props = defineProps<{ gen: GeneratorTier }>();

const flashing = ref(false);
const milestonePopText = ref<string | null>(null);
const payoutPopText = ref<string | null>(null);

const owned = computed(() => state.ownedByGenerator[props.gen.id] ?? 0);

// Bulk multiplier applies uniformly to every generator (click-driven or not).
// The bulk bar's visibility rules already gate when bulk is even on screen.
//
// Resolves the user-selected bulk mode to a concrete integer N for THIS tile:
//   'max'  -> as many as the player can currently afford
//   'next' -> exactly enough to cross this tile's next milestone (AdCap-style).
//             If no remaining milestone, falls back to 1.
//   1/10/100 -> the literal value
const bulkN = computed<number>(() => {
  const m = state.bulkBuyMultiplier;
  if (m === 'max') {
    return maxAffordableBulk(props.gen.base_cost, props.gen.cost_growth, owned.value, state.rumor) || 1;
  }
  if (m === 'next') {
    // Owned 0: NEXT means "seed purchase" — just buy 1 so the player can
    // start the cycle without having to switch back to x1. Milestones only
    // start mattering once you own at least one of the generator.
    if (owned.value === 0) return 1;
    // First milestone past current owned; null if past all of them.
    let target: number | null = null;
    for (const ms of props.gen.milestones) {
      if (owned.value < ms) { target = ms; break; }
    }
    if (target === null) return 1;
    return Math.max(1, target - owned.value);
  }
  return m;
});

const buyCost = computed(() =>
  computeBulkCost(props.gen.base_cost, props.gen.cost_growth, owned.value, bulkN.value),
);
const canAffordBuy = computed(() => state.rumor >= buyCost.value);
const shortfall = computed<number>(() => Math.max(0, buyCost.value - state.rumor));

// Per-cycle income preview for this tile.
// When owned > 0: real production (owned * base * milestones * globals * upgrades * cycle_seconds).
// When owned == 0: shows what ONE unit would produce on its own, so the player
// can read the "starts at" rate before buying.
const incomePerCycle = computed<number>(() => {
  const globalMult = carryoverMultiplier(state.memeticInheritance);
  const upgradeMult = upgradeMultFor(props.gen.id);
  if (owned.value > 0) {
    return payoutPerCycle(props.gen, owned.value, globalMult, upgradeMult);
  }
  return props.gen.base_production * props.gen.cycle_seconds * globalMult * upgradeMult;
});
const cycleSecondsLabel = computed<string>(() => {
  const s = props.gen.cycle_seconds;
  if (s >= 10) return s.toFixed(0) + 's';
  if (s >= 1) return s.toFixed(1) + 's';
  return (s * 1000).toFixed(0) + 'ms';
});
// Per-second rate, normalised across tiles regardless of cycle length.
// "Earns 12.5 Rumor / sec" reads more naturally than per-cycle math.
const incomePerSecond = computed<number>(() =>
  incomePerCycle.value / props.gen.cycle_seconds
);

const managerHired = computed(() => isManagerHired(props.gen.id));
const managerCost = computed(() => props.gen.manager_cost);
const canAffordManager = computed(() => state.rumor >= managerCost.value);

const nextUpgrade = computed(() => nextUpgradeFor(props.gen.id));
const canAffordUpgrade = computed(() => {
  const u = nextUpgrade.value;
  return u !== null && state.rumor >= u.cost;
});

const cycleProgress = computed(() => state.cycleProgress[props.gen.id] ?? 0);
const cycleInFlight = computed(() => cycleProgress.value > 0 || managerHired.value);

// "Needs your tap" indicator. True when the tile is owned but isn't
// auto-producing — i.e. the player has to keep tapping to earn anything.
// Click-driven tiles always need taps until a manager is hired; auto-cycle
// tiles only need a tap when the cycle has lapsed to zero. owned == 0
// tiles get the natural "Buy" affordance instead, no pulse needed.
const needsTap = computed(() => {
  if (managerHired.value) return false;
  if (props.gen.is_click_driven) return owned.value > 0;
  return owned.value > 0 && cycleProgress.value === 0;
});

const nextMilestone = computed<number | null>(() => {
  for (const m of props.gen.milestones) {
    if (owned.value < m) return m;
  }
  return null;
});

const prevMilestone = computed<number>(() => {
  let prev = 0;
  for (const m of props.gen.milestones) {
    if (owned.value >= m) prev = m;
    else break;
  }
  return prev;
});

const currentMilestoneMult = computed<number>(() => {
  let mult = 1;
  for (const m of props.gen.milestones) {
    if (owned.value >= m) mult *= 2;
  }
  return mult;
});
const nextMilestoneMult = computed<number>(() => currentMilestoneMult.value * 2);

const milestoneProgress = computed<number>(() => {
  if (nextMilestone.value === null) return 1;
  const span = nextMilestone.value - prevMilestone.value;
  if (span <= 0) return 0;
  return Math.max(0, Math.min(1, (owned.value - prevMilestone.value) / span));
});

// Segmented "fuel gauge" across the bottom edge of the tile — one slice per
// milestone, scaled to the size of its span. Crossed slices fill solid, the
// current slice fills proportionally, future slices stay dim. Lets the player
// see the whole milestone ladder at a glance, not just the next rung.
type MilestoneSegment = {
  idx: number;
  widthPct: number;
  filled: boolean;
  current: boolean;
  progress: number;
  threshold: number;
};
const milestoneSegments = computed<MilestoneSegment[]>(() => {
  const ms = props.gen.milestones;
  if (ms.length === 0) return [];
  const last = ms[ms.length - 1];
  const segs: MilestoneSegment[] = [];
  let prev = 0;
  for (let i = 0; i < ms.length; i++) {
    const m = ms[i];
    const span = m - prev;
    const widthPct = (span / last) * 100;
    const crossed = owned.value >= m;
    const inSeg = owned.value >= prev && owned.value < m;
    const progress = inSeg && span > 0 ? (owned.value - prev) / span : 0;
    segs.push({ idx: i, widthPct, filled: crossed, current: inSeg, progress, threshold: m });
    prev = m;
  }
  return segs;
});

watch(owned, (newVal, oldVal) => {
  for (const m of props.gen.milestones) {
    if (oldVal < m && newVal >= m) {
      flashing.value = true;
      milestonePopText.value = `+×${currentMilestoneMult.value}`;
      playMilestone();
      setTimeout(() => { flashing.value = false; }, 400);
      setTimeout(() => { milestonePopText.value = null; }, 800);
      break;
    }
  }
});

const lastPayout = computed(() => state.lastPayout[props.gen.id]);
watch(lastPayout, newPayout => {
  if (!newPayout) return;
  payoutPopText.value = `+${formatResource(newPayout.amount)}`;
  setTimeout(() => { payoutPopText.value = null; }, 800);
});

// Body tap = "do the work" on this tile. Purchasing is a SEPARATE action
// via the inline BUY pill below — body tap never auto-buys an owned tile.
//
// Behavior matrix:
//   click-driven (any owned count): body tap = +1 Rumor (the manual work).
//                 This includes owned == 0 -- click-driven Tier 1 is the
//                 game's initial Rumor source; new-era players start with
//                 zero of everything and need to tap to earn the first 4-10
//                 Rumor to afford anything.
//   non-click-driven, owned == 0: body tap buys one (the "I see it, I want
//                 it" gesture; only sensible action when nothing's owned).
//   non-click-driven, owned >= 1, no manager: body tap = kick cycle.
//   non-click-driven, owned >= 1, manager hired: body tap = no-op
//                 (cycle already auto-runs).
function tapBody() {
  if (props.gen.is_click_driven) {
    click();
    return;
  }
  const ownedNow = state.ownedByGenerator[props.gen.id] ?? 0;
  if (ownedNow === 0) {
    if (canAffordBuy.value) buyGenerator(props.gen.id, bulkN.value);
    return;
  }
  if (!managerHired.value) {
    tapCycle(props.gen.id);
  }
}

// Explicit purchase action — invoked by the inline BUY pill in the cost row.
function tapBuy(e: Event) {
  e.stopPropagation();
  if (!canAffordBuy.value) return;
  buyGenerator(props.gen.id, bulkN.value);
}

function tapHireManager(e: Event) {
  e.stopPropagation();
  if (!canAffordManager.value) return;
  hireManager(props.gen.id);
}

function tapBuyUpgrade(e: Event) {
  e.stopPropagation();
  const u = nextUpgrade.value;
  if (!u || !canAffordUpgrade.value) return;
  buyUpgrade(u.id);
}
</script>

<template>
  <button
    type="button"
    class="card"
    :class="{ flashing, unaffordable: !canAffordBuy, 'needs-tap': needsTap }"
    @click="tapBody"
  >
    <!-- Cycle progress: background fill behind everything, left-to-right. -->
    <div
      class="cycle-bg"
      :class="{ idle: !cycleInFlight }"
      :style="{ width: cycleProgress * 100 + '%' }"
    ></div>

    <div class="content">
      <!-- Left side (~75%): title, owned, cost. Right side (~25%): big icon. -->
      <!-- Top: name + how many you own + the big era-themed icon. -->
      <div class="row top">
        <div class="info">
          <div class="title-line">
            <span class="title">{{ gen.display_name }}</span>
            <span class="owned-pill" v-if="owned > 0">Owned: {{ owned }}</span>
          </div>
          <div class="rate-line">
            <span class="rate-verb">Earns</span>
            <span class="rate-num">{{ formatResource(incomePerSecond) }}</span>
            <span class="rate-unit">{{ resourceName }} / sec</span>
          </div>
        </div>
        <div class="icon-slot">
          <span class="icon-big">{{ gen.icon }}</span>
          <Transition name="mile-pop">
            <span v-if="milestonePopText" :key="milestonePopText" class="pop-mile">{{ milestonePopText }}</span>
          </Transition>
          <Transition name="payout-pop">
            <span v-if="payoutPopText" :key="payoutPopText" class="pop-payout">{{ payoutPopText }}</span>
          </Transition>
        </div>
      </div>

      <!-- Action row: buy more + (hire manager OR upgrade OR managed-status). -->
      <div class="row actions">
        <button
          type="button"
          class="btn-riso btn-riso-sm buy-pill"
          :class="{ disabled: !canAffordBuy }"
          :disabled="!canAffordBuy"
          @click="tapBuy"
        >
          <span class="buy-action">Buy <template v-if="bulkN > 1">{{ bulkN }}</template></span>
          <span class="buy-cost">{{ formatCost(buyCost) }} {{ resourceName }}</span>
        </button>
        <span v-if="!canAffordBuy" class="cost-short">need {{ formatCost(shortfall) }} more</span>

        <div class="mgr">
          <button
            v-if="owned >= gen.auto_unlock_at && !managerHired"
            type="button"
            class="btn-riso btn-riso-sm btn-riso-secondary"
            :class="{ disabled: !canAffordManager }"
            @click="tapHireManager"
            :disabled="!canAffordManager"
          >
            <span class="hire-action">Hire {{ gen.manager_name }}</span>
            <span class="hire-cost">{{ formatCost(managerCost) }} {{ resourceName }}</span>
          </button>
          <span
            v-else-if="owned > 0 && !managerHired"
            class="mgr-pending"
          >Hire available at {{ gen.auto_unlock_at }} owned</span>
          <button
            v-else-if="managerHired && nextUpgrade"
            type="button"
            class="btn-riso btn-riso-sm btn-riso-upgrade"
            :class="{ disabled: !canAffordUpgrade }"
            @click="tapBuyUpgrade"
            :disabled="!canAffordUpgrade"
            :title="nextUpgrade.description"
          >
            <span class="hire-action">★ Boost ×{{ nextUpgrade.multiplier }}</span>
            <span class="hire-cost">{{ formatCost(nextUpgrade.cost) }} {{ resourceName }}</span>
          </button>
          <span v-else-if="managerHired" class="mgr-on">✓ {{ gen.manager_name }} running</span>
        </div>
      </div>

      <!-- Boost-ladder hint row — only meaningful once you own at least one. -->
      <div class="row hint" v-if="owned > 0">
        <span class="hint-text">
          <template v-if="nextMilestone !== null">
            Production boost ×{{ currentMilestoneMult }} now → ×{{ nextMilestoneMult }} at {{ nextMilestone }} owned
          </template>
          <template v-else>
            Production boost ×{{ currentMilestoneMult }} — max boosts reached
          </template>
        </span>
      </div>
      <div v-else class="row hint">
        <span class="hint-text"><em>Technique: {{ gen.technique_tag }}</em></span>
      </div>
    </div>

    <!-- Segmented milestone meter pinned to the bottom edge.
         One slice per milestone, sized by its span. Crossed = solid,
         current = partial fill, future = dim. Tooltip shows threshold. -->
    <div v-if="milestoneSegments.length" class="ms-meter">
      <div
        v-for="seg in milestoneSegments"
        :key="seg.idx"
        class="ms-seg"
        :class="{ filled: seg.filled, current: seg.current }"
        :style="{ width: seg.widthPct + '%' }"
        :title="'milestone at ' + seg.threshold"
      >
        <div
          v-if="seg.current"
          class="ms-fill"
          :style="{ width: seg.progress * 100 + '%' }"
        ></div>
      </div>
    </div>
  </button>
</template>

<style scoped>
.card {
  position: relative;
  display: block;
  width: 100%;
  margin: 0 0 4px 0;
  padding: 0;
  background: var(--theme-surface, #ebe2c4);
  border: 1px solid var(--theme-border, #2a2218);
  font-family: inherit;
  color: var(--theme-text, #2a2218);
  cursor: pointer;
  box-sizing: border-box;
  overflow: hidden;
  min-height: 56px;
  text-align: left;
  /* Soft beveled look — a touch of depth without being skeuomorphic. */
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.35),
    inset 0 -1px 0 rgba(0, 0, 0, 0.18),
    0 1px 0 rgba(0, 0, 0, 0.18);
  transition: transform 60ms ease-out, box-shadow 60ms ease-out, filter 120ms;
}
.card:hover {
  filter: brightness(1.04);
}
.card:active {
  transform: translateY(1px);
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.22),
    0 0 0 rgba(0, 0, 0, 0);
}
/* Note: the whole tile no longer grays when "unaffordable" -- the BUY pill
   carries its own disabled state. Body-tap = do work, which is always
   available; greying the whole card would misrepresent that. */
/* Idle / needs-tap state — soft 1.6s breathing pulse on the border so the
   player notices that a tile is waiting on them. Vanishes the moment a
   cycle resumes or a manager is hired. Kept subtle to avoid distraction
   when many tiles share the state late-game. */
.card.needs-tap {
  animation: tap-pulse 1.6s ease-in-out infinite;
}
@keyframes tap-pulse {
  0%, 100% {
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.35),
      inset 0 -1px 0 rgba(0, 0, 0, 0.18),
      0 0 0 0 rgba(232, 142, 56, 0);
  }
  50% {
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.35),
      inset 0 -1px 0 rgba(0, 0, 0, 0.18),
      0 0 8px 1px rgba(232, 142, 56, 0.55);
  }
}

.card.flashing { animation: mile-flash 400ms ease-out; }
@keyframes mile-flash {
  0%   { background: var(--theme-surface, #ebe2c4); }
  50%  { background: #fff5d4; }
  100% { background: var(--theme-surface, #ebe2c4); }
}

/* Cycle progress lives on the TOP edge of the tile as a thin glowing bar.
   Previously this was a full-card sliding gray fill, but the dark wash
   made any non-bold text underneath unreadable as it passed. Moving it
   to a dedicated edge strip frees the content area to stay legible. */
.cycle-bg {
  position: absolute;
  top: 0;
  left: 0;
  height: 4px;
  background: linear-gradient(90deg,
    rgba(120, 180, 230, 0.55) 0%,
    rgba(80, 160, 220, 0.95) 70%,
    rgba(180, 220, 250, 1) 100%);
  box-shadow: 0 0 6px rgba(80, 160, 220, 0.55);
  transition: width 80ms linear;
  z-index: 3;
  pointer-events: none;
}
.cycle-bg.idle {
  background: rgba(80, 160, 220, 0.18);
  box-shadow: none;
}

.content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  padding: 6px 12px 11px;
  gap: 2px;
  box-sizing: border-box;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 18px;
}

.top {
  align-items: center;
}

.info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  min-width: 0;
}
.title-line {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}
.title {
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 1px;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
  min-width: 0;
}
/* "Owned: N" pill -- explicit label, not the ambiguous "xN" shorthand. */
.owned-pill {
  font-family: var(--riso-font, monospace);
  font-weight: 700;
  font-size: 10px;
  letter-spacing: 0.5px;
  padding: 1px 6px;
  background: rgba(0,0,0,0.08);
  border: 1px solid rgba(0,0,0,0.18);
  border-radius: 2px;
  flex-shrink: 0;
}
/* "Earns N Rumor / sec" line — every number labeled. */
.rate-line {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-top: 2px;
  flex-wrap: wrap;
}
.rate-verb {
  font-size: 10px;
  font-weight: 600;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}
.rate-num {
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-size: 14px;
  font-weight: 900;
  color: #2a6b35;
  letter-spacing: 0.3px;
}
.rate-unit {
  font-size: 10px;
  font-weight: 600;
  opacity: 0.75;
}

/* Action row — Buy + Hire/Upgrade buttons side by side. */
.actions {
  margin-top: 5px;
  flex-wrap: wrap;
  row-gap: 4px;
}
.buy-pill {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  line-height: 1.15;
  padding: 4px 10px 5px;
  --riso-shadow-offset: 3px;
}
.buy-pill .buy-action {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.8px;
}
.buy-pill .buy-cost {
  font-size: 10px;
  font-weight: 600;
  opacity: 0.85;
  letter-spacing: 0.3px;
}
.mgr .btn-riso {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  line-height: 1.15;
  padding: 4px 10px 5px;
}
.hire-action {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.8px;
}
.hire-cost {
  font-size: 10px;
  font-weight: 600;
  opacity: 0.85;
  letter-spacing: 0.3px;
}

/* Boost-ladder hint row — explains what the milestone meter at the
   bottom edge represents in plain English. */
.hint {
  margin-top: 3px;
  min-height: 14px;
}
.hint-text {
  font-family: var(--theme-font-body, -apple-system, sans-serif);
  font-size: 10px;
  font-style: italic;
  opacity: 0.78;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hint-text em {
  font-style: normal;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.75;
}
.cost-short {
  font-size: 10px;
  font-weight: 700;
  color: #b3261e;
  opacity: 0.9;
}
.icon-slot {
  position: relative;
  width: 25%;
  min-width: 56px;
  max-width: 84px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.icon-big {
  font-size: 34px;
  line-height: 1;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.25));
  transition: transform 80ms ease-out;
}
.card:active .icon-big { transform: scale(0.92); }

/* margin-left: auto pins the Hire/Boost slot to the right edge even when
   the actions row wraps to a second line — without it, a wrapped .mgr
   ends up justified left and visibly "pops" position when the row
   overflows or the "need X more" span appears. */
.mgr { flex-shrink: 0; position: relative; z-index: 1; margin-left: auto; }
.mgr-on {
  font-family: var(--theme-font-body, -apple-system, sans-serif);
  font-style: italic;
  font-size: 10px;
  opacity: 0.65;
}
/* Shown when the player owns at least one but hasn't crossed the
   auto_unlock_at threshold yet — tells them when Hire will appear so
   they don't sit there wondering why there's no manager button. */
.mgr-pending {
  font-family: var(--theme-font-body, -apple-system, sans-serif);
  font-style: italic;
  font-size: 10px;
  opacity: 0.6;
  white-space: nowrap;
}

/* Popper animations — anchored above the icon. */
.pop-mile, .pop-payout {
  position: absolute;
  right: 4px;
  top: -6px;
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-weight: 900;
  font-size: 13px;
  color: var(--theme-accent, #2a2218);
  pointer-events: none;
  white-space: nowrap;
}
.mile-pop-enter-active, .payout-pop-enter-active { transition: all 800ms ease-out; }
.mile-pop-enter-from, .payout-pop-enter-from { opacity: 1; transform: translateY(0); }
.mile-pop-enter-to, .payout-pop-enter-to { opacity: 0; transform: translateY(-22px); }
.mile-pop-leave-active, .payout-pop-leave-active { transition: opacity 200ms; }
.mile-pop-leave-to, .payout-pop-leave-to { opacity: 0; }

/* Segmented milestone "fuel gauge" along the bottom edge of the tile.
   Sits above the content so it's always visible. Each notch is a
   milestone; the player can read the whole ladder in one glance. */
.ms-meter {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 7px;
  display: flex;
  background: rgba(42, 34, 24, 0.22);
  z-index: 3;
  pointer-events: none;
  border-top: 1px solid rgba(42, 34, 24, 0.55);
}
.ms-seg {
  position: relative;
  height: 100%;
  border-right: 1px solid rgba(42, 34, 24, 0.7);
  box-sizing: border-box;
  overflow: hidden;
}
.ms-seg:last-child { border-right: 0; }
.ms-seg.filled {
  background: linear-gradient(180deg, rgba(232, 142, 56, 1), rgba(178, 78, 22, 1));
  box-shadow:
    inset 0 1px 0 rgba(255, 230, 180, 0.7),
    inset 0 -1px 0 rgba(0, 0, 0, 0.25);
}
.ms-fill {
  position: absolute;
  top: 0; bottom: 0; left: 0;
  background: linear-gradient(180deg, rgba(250, 195, 110, 1), rgba(220, 130, 50, 1));
  transition: width 200ms ease-out;
  box-shadow:
    inset 0 1px 0 rgba(255, 235, 190, 0.7),
    inset 0 -1px 0 rgba(0, 0, 0, 0.18);
}
/* The current segment glows softly so the eye finds the "next rung". */
.ms-seg.current {
  background: rgba(120, 70, 30, 0.35);
}
.ms-seg.current::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 215, 140, 0.0), rgba(255, 195, 100, 0.3));
  animation: ms-pulse 1.6s ease-in-out infinite;
  pointer-events: none;
  mix-blend-mode: screen;
}
@keyframes ms-pulse {
  0%, 100% { opacity: 0.2; }
  50%      { opacity: 0.85; }
}
</style>

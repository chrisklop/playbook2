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

const props = defineProps<{ gen: GeneratorTier }>();

const flashing = ref(false);
const milestonePopText = ref<string | null>(null);
const payoutPopText = ref<string | null>(null);

const owned = computed(() => state.ownedByGenerator[props.gen.id] ?? 0);

// Bulk multiplier applies uniformly to every generator (click-driven or not).
// The bulk bar's visibility rules already gate when bulk is even on screen.
const bulkN = computed<number>(() => {
  const m = state.bulkBuyMultiplier;
  if (m === 'max') {
    return maxAffordableBulk(props.gen.base_cost, props.gen.cost_growth, owned.value, state.rumor) || 1;
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
//   owned == 0  : body tap buys one (only sensible gesture — you can't
//                 kick a cycle on a tile you don't own yet).
//   click-driven, owned >= 1: body tap = +1 rumor (the manual work).
//   non-click-driven, owned >= 1, no manager: body tap = kick cycle.
//   non-click-driven, owned >= 1, manager hired: body tap is a no-op
//                 (the cycle already auto-runs).
function tapBody() {
  const ownedNow = state.ownedByGenerator[props.gen.id] ?? 0;
  if (ownedNow === 0) {
    if (canAffordBuy.value) buyGenerator(props.gen.id, state.bulkBuyMultiplier);
    return;
  }
  if (props.gen.is_click_driven) {
    click();
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
  buyGenerator(props.gen.id, state.bulkBuyMultiplier);
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
    :class="{ flashing, unaffordable: !canAffordBuy }"
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
      <div class="row top">
        <div class="info">
          <div class="title-line">
            <span class="title">{{ gen.display_name }}</span>
            <span class="owned" v-if="owned > 0">×{{ owned }}</span>
          </div>
          <div class="cost-line">
            <button
              type="button"
              class="btn-riso btn-riso-sm buy-pill"
              :class="{ disabled: !canAffordBuy }"
              :disabled="!canAffordBuy"
              @click="tapBuy"
            >
              <span class="buy-label">BUY<span v-if="bulkN > 1">×{{ bulkN }}</span></span>
              <span class="buy-cost">{{ formatCost(buyCost) }}</span>
            </button>
            <span v-if="!canAffordBuy" class="cost-short">need +{{ formatCost(shortfall) }}</span>
            <template v-else>
              <span class="earn-label">+{{ formatResource(incomePerCycle) }} / {{ cycleSecondsLabel }}</span>
            </template>
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

      <div class="row bottom" v-if="owned > 0 || managerCost > 0">
        <div class="mile-hint">
          <template v-if="nextMilestone !== null">
            ×{{ currentMilestoneMult }} → ×{{ nextMilestoneMult }} at {{ nextMilestone }}
          </template>
          <template v-else>
            <em>{{ gen.technique_tag }}</em>
          </template>
        </div>
        <div class="mgr">
          <button
            v-if="owned > 0 && !managerHired"
            type="button"
            class="btn-riso btn-riso-sm btn-riso-secondary"
            :class="{ disabled: !canAffordManager }"
            @click="tapHireManager"
            :disabled="!canAffordManager"
          >
            HIRE {{ gen.manager_name.toUpperCase() }} · {{ formatCost(managerCost) }}
          </button>
          <button
            v-else-if="managerHired && nextUpgrade"
            type="button"
            class="btn-riso btn-riso-sm btn-riso-upgrade"
            :class="{ disabled: !canAffordUpgrade }"
            @click="tapBuyUpgrade"
            :disabled="!canAffordUpgrade"
            :title="nextUpgrade.description"
          >
            ★ ×{{ nextUpgrade.multiplier }} · {{ formatCost(nextUpgrade.cost) }}
          </button>
          <span v-else-if="managerHired" class="mgr-on">✓ {{ gen.manager_name }}</span>
        </div>
      </div>

      <div v-if="owned === 0 && managerCost === 0" class="row bottom">
        <div class="mile-hint"><em>{{ gen.technique_tag }}</em></div>
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
.card.unaffordable {
  filter: grayscale(0.45) brightness(0.92);
  opacity: 0.78;
}
.card.unaffordable:hover { filter: grayscale(0.4) brightness(0.95); }
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
.owned {
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-weight: 700;
  font-size: 12px;
  opacity: 0.7;
  flex-shrink: 0;
}
.cost-line {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  flex-wrap: wrap;
  row-gap: 4px;
  margin-top: 3px;
}
/* Inline BUY pill — riso style, compact, holds label + cost stacked. */
.buy-pill {
  display: inline-flex;
  flex-direction: row;
  align-items: baseline;
  gap: 6px;
  padding: 4px 10px 5px;
  --riso-shadow-offset: 3px;
}
.buy-pill .buy-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1px;
  opacity: 0.85;
}
.buy-pill .buy-cost {
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.3px;
}
.cost-short {
  font-size: 10px;
  font-weight: 700;
  color: #b3261e;
  opacity: 0.9;
}
.earn-label {
  font-size: 11px;
  font-weight: 700;
  color: #2a6b35;
  letter-spacing: 0.3px;
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

.bottom {
  position: relative;
  font-size: 9px;
  letter-spacing: 0.5px;
  opacity: 0.9;
}
.mile-hint, .mgr { position: relative; z-index: 1; }
.mile-hint {
  font-family: var(--theme-font-body, -apple-system, sans-serif);
  font-size: 11px;
  font-style: italic;
  font-weight: 600;
  opacity: 0.92;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 1;
  min-width: 0;
}
.mile-hint em {
  font-style: normal;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.mgr { flex-shrink: 0; }
.mgr-on {
  font-family: var(--theme-font-body, -apple-system, sans-serif);
  font-style: italic;
  font-size: 10px;
  opacity: 0.65;
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

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
} from '../state';
import { computeBulkCost, maxAffordableBulk } from '../../game/era-layer';
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

// Single unified tap handler — the entire tile is the button.
// Priority: click-driven +1 rumor → buy at bulk multiplier if affordable →
// otherwise kick the cycle (cheap fallback action, no-op if irrelevant).
function tapBody() {
  if (props.gen.is_click_driven) {
    click();
  }
  if (canAffordBuy.value) {
    buyGenerator(props.gen.id, state.bulkBuyMultiplier);
    return;
  }
  const ownedNow = state.ownedByGenerator[props.gen.id] ?? 0;
  if (ownedNow > 0 && !managerHired.value && !props.gen.is_click_driven) {
    tapCycle(props.gen.id);
  }
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
            <span class="cost-num">{{ formatCost(buyCost) }}</span>
            <span class="cost-mult" v-if="bulkN > 1">buys ×{{ bulkN }}</span>
            <span class="cost-mult" v-else-if="gen.is_click_driven">+1 / buy</span>
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
        <!-- Milestone progress fills this row's background. -->
        <div
          v-if="nextMilestone !== null"
          class="mile-bg"
          :style="{ width: milestoneProgress * 100 + '%' }"
        ></div>
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
            class="hire"
            :class="{ disabled: !canAffordManager }"
            @click="tapHireManager"
            :disabled="!canAffordManager"
          >
            HIRE {{ gen.manager_name.toUpperCase() }} {{ formatCost(managerCost) }}
          </button>
          <button
            v-else-if="managerHired && nextUpgrade"
            type="button"
            class="hire upgrade-btn"
            :class="{ disabled: !canAffordUpgrade }"
            @click="tapBuyUpgrade"
            :disabled="!canAffordUpgrade"
            :title="nextUpgrade.description"
          >
            ★ ×{{ nextUpgrade.multiplier }} {{ formatCost(nextUpgrade.cost) }}
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
  margin: 0 0 6px 0;
  padding: 0;
  background: var(--theme-surface, #ebe2c4);
  border: 1px solid var(--theme-border, #2a2218);
  font-family: inherit;
  color: var(--theme-text, #2a2218);
  cursor: pointer;
  box-sizing: border-box;
  overflow: hidden;
  min-height: 64px;
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

.cycle-bg {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  background: rgba(42, 34, 24, 0.18);
  transition: width 80ms linear;
  z-index: 0;
  pointer-events: none;
}
.cycle-bg.idle {
  background: rgba(42, 34, 24, 0.06);
}

.content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  padding: 8px 12px 11px;
  gap: 4px;
  box-sizing: border-box;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 22px;
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
  align-items: baseline;
  gap: 6px;
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
}
.cost-num {
  font-size: 16px;
  font-weight: 900;
  color: var(--theme-accent, #2a2218);
  line-height: 1;
}
.cost-mult {
  font-size: 9px;
  font-weight: 700;
  opacity: 0.6;
  text-transform: uppercase;
  letter-spacing: 1px;
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
  font-size: 40px;
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
.mile-bg {
  position: absolute;
  top: -2px;
  bottom: -2px;
  left: -6px;
  background: linear-gradient(90deg, rgba(240, 160, 96, 0.22) 0%, rgba(240, 160, 96, 0.42) 100%);
  border-right: 2px solid rgba(214, 120, 48, 0.85);
  transition: width 250ms ease-out;
  z-index: 0;
  pointer-events: none;
}
.mile-hint, .mgr { position: relative; z-index: 1; }
.mile-hint {
  font-family: var(--theme-font-body, -apple-system, sans-serif);
  font-size: 10px;
  font-style: italic;
  opacity: 0.75;
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
.hire {
  margin: 0;
  padding: 4px 10px;
  border: 1px solid var(--theme-border, #2a2218);
  background: rgba(255, 255, 255, 0.25);
  color: var(--theme-text, #2a2218);
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-weight: 700;
  font-size: 9px;
  letter-spacing: 0.5px;
  cursor: pointer;
  text-transform: uppercase;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5), inset 0 -1px 0 rgba(0, 0, 0, 0.15);
}
.hire:active { transform: translateY(1px); box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2); }
.hire.disabled, .hire:disabled { opacity: 0.4; cursor: not-allowed; }
.upgrade-btn {
  background: rgba(240, 160, 96, 0.32);
  border-color: var(--theme-accent, #2a2218);
}
.upgrade-btn:not(.disabled):hover {
  background: rgba(240, 160, 96, 0.45);
}
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
   Sits above the cycle-bg/content layers so it's always visible. */
.ms-meter {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 5px;
  display: flex;
  background: rgba(42, 34, 24, 0.08);
  z-index: 2;
  pointer-events: none;
  border-top: 1px solid rgba(42, 34, 24, 0.15);
}
.ms-seg {
  position: relative;
  height: 100%;
  border-right: 1px solid rgba(42, 34, 24, 0.45);
  box-sizing: border-box;
  overflow: hidden;
}
.ms-seg:last-child { border-right: 0; }
.ms-seg.filled {
  background: linear-gradient(180deg, rgba(214, 120, 48, 0.92), rgba(170, 80, 30, 0.95));
  box-shadow: inset 0 1px 0 rgba(255, 220, 180, 0.5);
}
.ms-fill {
  position: absolute;
  top: 0; bottom: 0; left: 0;
  background: linear-gradient(180deg, rgba(240, 170, 90, 0.95), rgba(214, 120, 48, 0.95));
  transition: width 200ms ease-out;
  box-shadow: inset 0 1px 0 rgba(255, 220, 180, 0.55);
}
/* Pulse the current segment subtly so the eye finds the "next rung". */
.ms-seg.current::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(240, 170, 90, 0.18);
  animation: ms-pulse 1.6s ease-in-out infinite;
  pointer-events: none;
}
@keyframes ms-pulse {
  0%, 100% { opacity: 0; }
  50%      { opacity: 1; }
}
</style>

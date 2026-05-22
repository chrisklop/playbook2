<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { state, buyGenerator, click, hireManager, tapCycle, isManagerHired } from '../state';
import { computeCost, computeBulkCost, maxAffordableBulk } from '../../game/era-layer';
import type { GeneratorTier } from '../../content/schema';
import { formatCost, formatResource } from '../format';

const props = defineProps<{ gen: GeneratorTier }>();

const flashing = ref(false);
const milestonePopText = ref<string | null>(null);
const payoutPopText = ref<string | null>(null);

const owned = computed(() => state.ownedByGenerator[props.gen.id] ?? 0);

const bulkN = computed<number>(() => {
  if (props.gen.is_click_driven) return 1;
  const m = state.bulkBuyMultiplier;
  if (m === 'max') {
    return maxAffordableBulk(props.gen.base_cost, props.gen.cost_growth, owned.value, state.rumor) || 1;
  }
  return m;
});

const buyCost = computed(() => {
  if (props.gen.is_click_driven) {
    return computeCost(props.gen.base_cost, props.gen.cost_growth, owned.value);
  }
  return computeBulkCost(props.gen.base_cost, props.gen.cost_growth, owned.value, bulkN.value);
});
const canAffordBuy = computed(() => state.rumor >= buyCost.value);

const managerHired = computed(() => isManagerHired(props.gen.id));
const managerCost = computed(() => props.gen.manager_cost);
const canAffordManager = computed(() => state.rumor >= managerCost.value);

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
  const into = owned.value - prevMilestone.value;
  return span > 0 ? Math.min(1, Math.max(0, into / span)) : 0;
});

// Watch owned for milestone crossings.
watch(owned, (newVal, oldVal) => {
  for (const m of props.gen.milestones) {
    if (oldVal < m && newVal >= m) {
      flashing.value = true;
      milestonePopText.value = `+×${currentMilestoneMult.value}`;
      setTimeout(() => { flashing.value = false; }, 400);
      setTimeout(() => { milestonePopText.value = null; }, 800);
      break;
    }
  }
});

// Watch lastPayout for this generator → fire popper animation
const lastPayout = computed(() => state.lastPayout[props.gen.id]);
watch(lastPayout, newPayout => {
  if (!newPayout) return;
  payoutPopText.value = `+${formatResource(newPayout.amount)}`;
  setTimeout(() => { payoutPopText.value = null; }, 800);
});

/**
 * Card body tap:
 *  - Tier 1 click-driven: +1 Rumor (free) + advance cycle + auto-buy
 *  - Other tiers: advance cycle if not auto
 *  - When manager hired: cycle auto-runs, body tap is informational only
 */
function tapBody() {
  if (props.gen.is_click_driven) {
    click();
    if (state.rumor >= buyCost.value) {
      buyGenerator(props.gen.id, 1);
    }
  } else {
    tapCycle(props.gen.id);
  }
}

function tapBuy(e: Event) {
  e.stopPropagation(); // don't double-trigger body tap
  if (!canAffordBuy.value && !props.gen.is_click_driven) return;
  if (props.gen.is_click_driven) {
    // Click-driven only buys via body tap (free Rumor pattern); the Buy button is hidden for it.
    return;
  }
  buyGenerator(props.gen.id, state.bulkBuyMultiplier);
}

function tapHireManager(e: Event) {
  e.stopPropagation();
  hireManager(props.gen.id);
}
</script>

<template>
  <div class="card" :class="{ flashing }" @click="tapBody">
    <div class="row-main">
      <div class="icon-block">
        <div class="icon">{{ gen.icon }}</div>
        <div class="icon-count">×{{ owned }}</div>
      </div>
      <div class="info">
        <div class="title">{{ gen.display_name }}</div>
        <div v-if="owned < 5" class="desc">{{ gen.description }}</div>
      </div>
    </div>

    <div v-if="owned > 0" class="cycle-bar-wrap">
      <div class="cycle-bar">
        <div class="cycle-fill" :class="{ idle: !cycleInFlight }" :style="{ width: cycleProgress * 100 + '%' }"></div>
      </div>
      <Transition name="payout-pop">
        <span v-if="payoutPopText" :key="payoutPopText" class="payout-pop-label">{{ payoutPopText }}</span>
      </Transition>
    </div>

    <div v-if="nextMilestone !== null && owned > 0" class="mile-row">
      <div class="mile-bar">
        <div class="mile-fill" :style="{ width: milestoneProgress * 100 + '%' }"></div>
      </div>
      <div class="mile-hint">
        ×{{ currentMilestoneMult }} / next ×{{ nextMilestoneMult }} at {{ nextMilestone }}
      </div>
    </div>

    <div class="action-row">
      <!-- Hire Manager button (when owned ≥ 1 and not yet hired) -->
      <button
        v-if="owned > 0 && !managerHired"
        class="action-btn manager-btn"
        :class="{ disabled: !canAffordManager }"
        @click="tapHireManager"
        :disabled="!canAffordManager"
      >
        Hire {{ gen.manager_name }} — {{ formatCost(managerCost) }}
      </button>
      <div v-else-if="managerHired" class="manager-status">
        ✓ {{ gen.manager_name }} auto-cycling
      </div>
      <div v-else class="manager-status"></div>

      <!-- Buy button (non-click-driven) -->
      <button
        v-if="!gen.is_click_driven"
        class="action-btn buy-btn"
        :class="{ disabled: !canAffordBuy }"
        @click="tapBuy"
        :disabled="!canAffordBuy"
      >
        <span>BUY <span v-if="bulkN > 1">×{{ bulkN }}</span></span>
        <span class="buy-cost">{{ formatCost(buyCost) }}</span>
        <Transition name="mile-pop">
          <span v-if="milestonePopText" :key="milestonePopText" class="mile-pop-label">{{ milestonePopText }}</span>
        </Transition>
      </button>
      <!-- Tier 1 click-driven: cost shown inline; body tap handles +1 and auto-buy -->
      <div v-else class="action-btn buy-btn click-hint" :class="{ ready: canAffordBuy }">
        <span>+1 / Buy at</span>
        <span class="buy-cost">{{ formatCost(buyCost) }}</span>
        <Transition name="mile-pop">
          <span v-if="milestonePopText" :key="milestonePopText" class="mile-pop-label">{{ milestonePopText }}</span>
        </Transition>
      </div>
    </div>

    <div class="tag-row">
      <span class="tag">{{ gen.technique_tag }}</span>
    </div>
  </div>
</template>

<style scoped>
.card {
  position: relative;
  display: block;
  width: 100%;
  margin: 0 0 8px 0;
  padding: 10px 12px 8px;
  background: var(--theme-surface, #ebe2c4);
  border: 1px solid var(--theme-border, #2a2218);
  font-family: inherit;
  color: var(--theme-text, #2a2218);
  cursor: pointer;
  box-sizing: border-box;
  transition: background 0.15s;
}
.card:active { transform: scale(0.997); }
.card.flashing {
  animation: mile-flash 400ms ease-out;
}
@keyframes mile-flash {
  0%   { background: var(--theme-surface, #ebe2c4); }
  50%  { background: #fff5d4; }
  100% { background: var(--theme-surface, #ebe2c4); }
}

.row-main {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}
.icon-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}
.icon {
  font-size: 28px;
  line-height: 1;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(42, 34, 24, 0.06);
  border: 1px solid var(--theme-border, #2a2218);
  box-sizing: border-box;
}
.icon-count {
  margin-top: 2px;
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-weight: 700;
  font-size: 12px;
  color: var(--theme-text, #2a2218);
}
.info { flex: 1; min-width: 0; padding-top: 2px; }
.title {
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.desc {
  font-size: 10px;
  opacity: 0.7;
  margin-top: 2px;
  font-style: italic;
  font-family: var(--theme-font-body, -apple-system, sans-serif);
  line-height: 1.3;
}

.cycle-bar-wrap {
  position: relative;
  margin-top: 8px;
}
.cycle-bar {
  width: 100%;
  height: 8px;
  background: rgba(42, 34, 24, 0.12);
  border: 1px solid var(--theme-border, #2a2218);
  box-sizing: border-box;
  overflow: hidden;
}
.cycle-fill {
  height: 100%;
  background: var(--theme-accent, #2a2218);
  transition: width 80ms linear;
}
.cycle-fill.idle {
  background: rgba(42, 34, 24, 0.3);
}
.payout-pop-label {
  position: absolute;
  right: 4px;
  top: -2px;
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-size: 11px;
  font-weight: 900;
  color: var(--theme-accent, #2a2218);
  pointer-events: none;
}
.payout-pop-enter-active { transition: all 800ms ease-out; }
.payout-pop-enter-from { opacity: 1; transform: translateY(0); }
.payout-pop-enter-to { opacity: 0; transform: translateY(-18px); }
.payout-pop-leave-active { transition: opacity 200ms; }
.payout-pop-leave-to { opacity: 0; }

.mile-row { margin-top: 6px; }
.mile-bar {
  width: 100%;
  height: 3px;
  background: rgba(42, 34, 24, 0.15);
  border: 1px solid var(--theme-border, #2a2218);
  box-sizing: border-box;
}
.mile-fill {
  height: 100%;
  background: var(--theme-accent, #2a2218);
  transition: width 200ms ease-out;
}
.mile-hint {
  font-size: 9px;
  opacity: 0.55;
  margin-top: 2px;
  font-style: italic;
}

.action-row {
  display: flex;
  gap: 8px;
  align-items: stretch;
  margin-top: 8px;
}
.action-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  margin: 0;
  padding: 8px 6px;
  border: 1px solid var(--theme-border, #2a2218);
  background: transparent;
  color: var(--theme-text, #2a2218);
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-weight: 700;
  font-size: 10px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  cursor: pointer;
  box-sizing: border-box;
  position: relative;
}
.action-btn.disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.buy-btn {
  background: rgba(42, 34, 24, 0.05);
}
.buy-btn:hover:not(.disabled),
.manager-btn:hover:not(.disabled) {
  background: rgba(42, 34, 24, 0.12);
}
.buy-cost {
  font-size: 13px;
  font-weight: 900;
  color: var(--theme-accent, #2a2218);
}
.click-hint {
  cursor: default;
  background: transparent;
}
.click-hint.ready .buy-cost { text-decoration: underline; }
.manager-status {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--theme-font-body, -apple-system, sans-serif);
  font-size: 10px;
  font-style: italic;
  opacity: 0.65;
}

.mile-pop-label {
  position: absolute;
  top: -14px;
  right: 4px;
  color: var(--theme-accent, #2a2218);
  font-weight: 900;
  font-size: 13px;
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
}
.mile-pop-enter-active { transition: all 800ms ease-out; }
.mile-pop-enter-from { opacity: 1; transform: translateY(0); }
.mile-pop-enter-to { opacity: 0; transform: translateY(-16px); }
.mile-pop-leave-active { transition: opacity 200ms; }
.mile-pop-leave-to { opacity: 0; }

.tag-row {
  margin-top: 6px;
  display: flex;
  justify-content: flex-end;
}
.tag {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.5;
}
</style>

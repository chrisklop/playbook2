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

// Next upgrade to surface inline (null if none unlocked-and-unpurchased)
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

// Watch lastPayout → fire popper animation.
const lastPayout = computed(() => state.lastPayout[props.gen.id]);
watch(lastPayout, newPayout => {
  if (!newPayout) return;
  payoutPopText.value = `+${formatResource(newPayout.amount)}`;
  setTimeout(() => { payoutPopText.value = null; }, 800);
});

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
  e.stopPropagation();
  if (props.gen.is_click_driven) return;
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
  <div class="card" :class="{ flashing }" @click="tapBody">
    <!-- Cycle progress lives as a background fill behind the content. -->
    <div
      class="cycle-bg"
      :class="{ idle: !cycleInFlight }"
      :style="{ width: cycleProgress * 100 + '%' }"
    ></div>

    <div class="content">
      <div class="row top">
        <div class="left">
          <span class="icon">{{ gen.icon }}</span>
          <span class="title">{{ gen.display_name }}</span>
          <span class="owned" v-if="owned > 0">×{{ owned }}</span>
        </div>
        <div class="right">
          <button
            v-if="!gen.is_click_driven"
            class="buy"
            :class="{ disabled: !canAffordBuy }"
            @click="tapBuy"
            :disabled="!canAffordBuy"
          >
            <span class="buy-label">BUY<span v-if="bulkN > 1">×{{ bulkN }}</span></span>
            <span class="buy-cost">{{ formatCost(buyCost) }}</span>
          </button>
          <div v-else class="buy click-hint" :class="{ ready: canAffordBuy }">
            <span class="buy-label">+1 / Buy</span>
            <span class="buy-cost">{{ formatCost(buyCost) }}</span>
          </div>
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
          <!-- Manager hire takes precedence; once hired, show next upgrade if available. -->
          <button
            v-if="owned > 0 && !managerHired"
            class="hire"
            :class="{ disabled: !canAffordManager }"
            @click="tapHireManager"
            :disabled="!canAffordManager"
          >
            HIRE {{ gen.manager_name.toUpperCase() }} {{ formatCost(managerCost) }}
          </button>
          <button
            v-else-if="managerHired && nextUpgrade"
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
  </div>
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
  min-height: 56px;
}
.card:active { transform: scale(0.997); }
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
  padding: 8px 12px;
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

.left {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  flex: 1;
}
.icon {
  font-size: 18px;
  line-height: 1;
  flex-shrink: 0;
}
.title {
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-weight: 700;
  font-size: 13px;
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

.right {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.buy {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  margin: 0;
  padding: 4px 10px;
  border: 1px solid var(--theme-border, #2a2218);
  background: rgba(42, 34, 24, 0.06);
  color: var(--theme-text, #2a2218);
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-weight: 700;
  font-size: 9px;
  letter-spacing: 0.5px;
  cursor: pointer;
  text-transform: uppercase;
  line-height: 1.15;
  min-width: 64px;
}
.buy.disabled, .buy:disabled { opacity: 0.45; cursor: not-allowed; }
.buy-label { font-size: 9px; opacity: 0.75; }
.buy-cost {
  font-size: 13px;
  font-weight: 900;
  color: var(--theme-accent, #2a2218);
}
.click-hint {
  background: transparent;
  cursor: default;
}
.click-hint.ready .buy-cost { text-decoration: underline; }

.bottom {
  font-size: 9px;
  letter-spacing: 0.5px;
  opacity: 0.85;
}
.mile-hint {
  font-family: var(--theme-font-body, -apple-system, sans-serif);
  font-size: 10px;
  font-style: italic;
  opacity: 0.7;
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
  padding: 3px 8px;
  border: 1px solid var(--theme-border, #2a2218);
  background: transparent;
  color: var(--theme-text, #2a2218);
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-weight: 700;
  font-size: 9px;
  letter-spacing: 0.5px;
  cursor: pointer;
  text-transform: uppercase;
}
.hire.disabled, .hire:disabled { opacity: 0.4; cursor: not-allowed; }
.upgrade-btn {
  background: rgba(240, 160, 96, 0.18);
  border-color: var(--theme-accent, #2a2218);
}
.upgrade-btn:not(.disabled):hover {
  background: rgba(240, 160, 96, 0.32);
}
.mgr-on {
  font-family: var(--theme-font-body, -apple-system, sans-serif);
  font-style: italic;
  font-size: 10px;
  opacity: 0.65;
}

/* Popper animations — anchored above the action area */
.pop-mile, .pop-payout {
  position: absolute;
  right: 4px;
  top: -2px;
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-weight: 900;
  font-size: 12px;
  color: var(--theme-accent, #2a2218);
  pointer-events: none;
  white-space: nowrap;
}
.mile-pop-enter-active, .payout-pop-enter-active { transition: all 800ms ease-out; }
.mile-pop-enter-from, .payout-pop-enter-from { opacity: 1; transform: translateY(0); }
.mile-pop-enter-to, .payout-pop-enter-to { opacity: 0; transform: translateY(-18px); }
.mile-pop-leave-active, .payout-pop-leave-active { transition: opacity 200ms; }
.mile-pop-leave-to, .payout-pop-leave-to { opacity: 0; }
</style>

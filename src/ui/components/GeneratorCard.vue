<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { state, buyGenerator, click, recommendedGenId } from '../state';
import { computeCost, computeBulkCost, maxAffordableBulk } from '../../game/era-layer';
import type { GeneratorTier } from '../../content/schema';

const props = defineProps<{ gen: GeneratorTier }>();

const flashing = ref(false);
const milestonePopText = ref<string | null>(null);

const owned = computed(() => state.ownedByGenerator[props.gen.id] ?? 0);

// Bulk multiplier — click-driven cards always buy singles. Non-click cards use the global setting.
const bulkN = computed<number>(() => {
  if (props.gen.is_click_driven) return 1;
  const m = state.bulkBuyMultiplier;
  if (m === 'max') {
    return maxAffordableBulk(props.gen.base_cost, props.gen.cost_growth, owned.value, state.rumor) || 1;
  }
  return m;
});

const cost = computed(() => {
  if (props.gen.is_click_driven) {
    return computeCost(props.gen.base_cost, props.gen.cost_growth, owned.value);
  }
  return computeBulkCost(props.gen.base_cost, props.gen.cost_growth, owned.value, bulkN.value);
});

const canAfford = computed(() => state.rumor >= cost.value);

/** The next-milestone owned threshold, or null if past the final milestone. */
const nextMilestone = computed<number | null>(() => {
  for (const m of props.gen.milestones) {
    if (owned.value < m) return m;
  }
  return null;
});

/** The previous milestone passed (0 if none). */
const prevMilestone = computed<number>(() => {
  let prev = 0;
  for (const m of props.gen.milestones) {
    if (owned.value >= m) prev = m;
    else break;
  }
  return prev;
});

/** Current accumulated milestone multiplier (×2 per crossed milestone). */
const currentMilestoneMult = computed<number>(() => {
  let mult = 1;
  for (const m of props.gen.milestones) {
    if (owned.value >= m) mult *= 2;
  }
  return mult;
});

const nextMilestoneMult = computed<number>(() => currentMilestoneMult.value * 2);

/** Progress from previous milestone to next, 0..1. */
const milestoneProgress = computed<number>(() => {
  if (nextMilestone.value === null) return 1;
  const span = nextMilestone.value - prevMilestone.value;
  const into = owned.value - prevMilestone.value;
  return span > 0 ? Math.min(1, Math.max(0, into / span)) : 0;
});

const isRecommended = computed(() => recommendedGenId.value === props.gen.id);

// Watch owned for milestone crossings — fire the inline flash + +×N label.
watch(owned, (newVal, oldVal) => {
  for (const m of props.gen.milestones) {
    if (oldVal < m && newVal >= m) {
      // Crossed milestone m. currentMilestoneMult already reflects newVal.
      flashing.value = true;
      milestonePopText.value = `+×${currentMilestoneMult.value}`;
      setTimeout(() => { flashing.value = false; }, 400);
      setTimeout(() => { milestonePopText.value = null; }, 800);
      break; // single animation even if N>1 milestones crossed in one buy
    }
  }
});

function tap() {
  if (props.gen.is_click_driven) {
    click();
    if (state.rumor >= cost.value) {
      buyGenerator(props.gen.id, 1);
    }
  } else {
    buyGenerator(props.gen.id, state.bulkBuyMultiplier);
  }
}

function formatCost(n: number): string {
  if (n < 1000) return n.toFixed(0);
  if (n < 1e6) return (n / 1000).toFixed(1) + 'K';
  if (n < 1e9) return (n / 1e6).toFixed(1) + 'M';
  return n.toExponential(1);
}
</script>

<template>
  <button
    class="card"
    :class="{ disabled: !gen.is_click_driven && !canAfford, flashing, recommended: isRecommended }"
    @click="tap"
  >
    <div v-if="isRecommended" class="recommend-pill">RECOMMENDED</div>
    <div class="head">
      <div class="title">{{ gen.display_name }}</div>
      <div class="cost" v-if="gen.is_click_driven">
        <span class="cost-tap">+1</span>
        <span class="cost-next">{{ formatCost(cost) }}</span>
        <Transition name="mile-pop">
          <span v-if="milestonePopText" :key="milestonePopText" class="mile-pop-label">{{ milestonePopText }}</span>
        </Transition>
      </div>
      <div class="cost" v-else>
        {{ formatCost(cost) }}
        <span v-if="bulkN > 1" class="bulk-hint">×{{ bulkN }}</span>
        <Transition name="mile-pop">
          <span v-if="milestonePopText" :key="milestonePopText" class="mile-pop-label">{{ milestonePopText }}</span>
        </Transition>
      </div>
    </div>
    <div class="desc">{{ gen.description }}</div>
    <div v-if="nextMilestone !== null" class="mile-bar">
      <div class="mile-fill" :style="{ width: (milestoneProgress * 100) + '%' }"></div>
    </div>
    <div v-if="nextMilestone !== null" class="mile-hint">
      ×{{ currentMilestoneMult }} / next ×{{ nextMilestoneMult }} at {{ nextMilestone }}
    </div>
    <div class="meta">
      <span class="tag">{{ gen.technique_tag }}</span>
      <span class="owned">×{{ owned }} owned</span>
    </div>
  </button>
</template>

<style scoped>
.card {
  position: relative;
  display: block;
  width: 100%;
  margin: 0 0 8px 0;
  padding: 12px 14px;
  text-align: left;
  background: var(--theme-surface, #ebe2c4);
  border: 1px solid var(--theme-border, #2a2218);
  font-family: inherit;
  color: var(--theme-text, #2a2218);
  cursor: pointer;
  transition: opacity 0.1s, transform 0.05s;
  box-sizing: border-box;
}
.card:active { transform: scale(0.985); }
.card.disabled { opacity: 0.45; cursor: not-allowed; }
.card.recommended {
  border-color: var(--theme-accent, #2a2218);
  box-shadow: 0 0 0 1px var(--theme-accent, #2a2218);
}
.recommend-pill {
  position: absolute;
  top: -8px;
  right: 10px;
  background: var(--theme-accent, #2a2218);
  color: var(--theme-background, #f2ecd9);
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-size: 7px;
  font-weight: 900;
  padding: 2px 6px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}
.card.flashing {
  animation: mile-flash 400ms ease-out;
}
@keyframes mile-flash {
  0%   { background: var(--theme-surface, #ebe2c4); }
  50%  { background: #fff5d4; }
  100% { background: var(--theme-surface, #ebe2c4); }
}
.bulk-hint {
  font-size: 9px;
  margin-left: 4px;
  opacity: 0.6;
  font-weight: 400;
}
.mile-pop-label {
  margin-left: 6px;
  color: var(--theme-accent, #2a2218);
  font-weight: 900;
  font-size: 13px;
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  display: inline-block;
}
.mile-pop-enter-active {
  transition: all 800ms ease-out;
}
.mile-pop-enter-from {
  opacity: 1;
  transform: translateY(0);
}
.mile-pop-enter-to {
  opacity: 0;
  transform: translateY(-16px);
}
.mile-pop-leave-active { transition: opacity 200ms; }
.mile-pop-leave-to { opacity: 0; }
.head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}
.title {
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.cost {
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-weight: 700;
  font-size: 14px;
  color: var(--theme-accent, #2a2218);
  flex-shrink: 0;
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.cost-tap {
  font-size: 12px;
  opacity: 0.55;
  font-weight: 700;
}
.cost-next {
  font-size: 14px;
  font-weight: 700;
}
.desc {
  font-size: 11px;
  opacity: 0.75;
  margin-top: 4px;
  font-style: italic;
  font-family: var(--theme-font-body, -apple-system, sans-serif);
}
.mile-bar {
  margin: 6px 0 2px;
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
  font-family: var(--theme-font-body, -apple-system, sans-serif);
  font-style: italic;
}
.meta {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.6;
}
</style>

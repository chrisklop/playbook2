<script setup lang="ts">
import { computed } from 'vue';
import { state, buyGenerator, click } from '../state';
import { computeCost } from '../../game/era-layer';
import type { GeneratorTier } from '../../content/schema';

const props = defineProps<{ gen: GeneratorTier }>();

const owned = computed(() => state.ownedByGenerator[props.gen.id] ?? 0);
const cost = computed(() => computeCost(props.gen.base_cost, props.gen.cost_growth, owned.value));
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

function tap() {
  if (props.gen.is_click_driven) {
    click();
    if (state.rumor >= cost.value) {
      buyGenerator(props.gen.id);
    }
  } else {
    buyGenerator(props.gen.id);
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
  <button class="card" :class="{ disabled: !gen.is_click_driven && !canAfford }" @click="tap">
    <div class="head">
      <div class="title">{{ gen.display_name }}</div>
      <div class="cost" v-if="gen.is_click_driven">
        <span class="cost-tap">+1</span>
        <span class="cost-next">{{ formatCost(cost) }}</span>
      </div>
      <div class="cost" v-else>{{ formatCost(cost) }}</div>
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

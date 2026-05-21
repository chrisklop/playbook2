<script setup lang="ts">
import { computed } from 'vue';
import { state, buyGenerator, click } from '../state';
import { computeCost } from '../../game/era-layer';
import type { GeneratorTier } from '../../content/schema';

const props = defineProps<{ gen: GeneratorTier }>();

const owned = computed(() => state.ownedByGenerator[props.gen.id] ?? 0);
const cost = computed(() => computeCost(props.gen.base_cost, props.gen.cost_growth, owned.value));
const canAfford = computed(() => state.rumor >= cost.value);

function tap() {
  if (props.gen.is_click_driven) {
    click();
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
      <div class="cost" v-if="!gen.is_click_driven">{{ formatCost(cost) }}</div>
      <div class="cost" v-else>+1</div>
    </div>
    <div class="desc">{{ gen.description }}</div>
    <div class="meta">
      <span class="tag">{{ gen.technique_tag }}</span>
      <span class="owned" v-if="!gen.is_click_driven">×{{ owned }}</span>
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
}
.desc {
  font-size: 11px;
  opacity: 0.75;
  margin-top: 4px;
  font-style: italic;
  font-family: var(--theme-font-body, -apple-system, sans-serif);
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

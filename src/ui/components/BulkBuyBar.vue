<script setup lang="ts">
import { computed } from 'vue';
import { state } from '../state';

type Tier = 1 | 10 | 100 | 'max';

const visibleTiers = computed<Tier[]>(() => {
  const tiers: Tier[] = [1];
  if (state.prestigeCount >= 1) tiers.push(10);
  if (state.prestigeCount >= 5) tiers.push(100);
  if (state.prestigeCount >= 25) tiers.push('max');
  return tiers;
});

function select(t: Tier) {
  state.bulkBuyMultiplier = t;
}

function label(t: Tier): string {
  return t === 'max' ? 'MAX' : `×${t}`;
}
</script>

<template>
  <div v-if="visibleTiers.length > 1" class="bulk-bar" role="radiogroup" aria-label="Buy multiplier">
    <button
      v-for="t in visibleTiers"
      :key="String(t)"
      type="button"
      class="bulk-btn"
      :class="{ active: state.bulkBuyMultiplier === t }"
      :aria-pressed="state.bulkBuyMultiplier === t"
      @click="select(t)"
    >
      {{ label(t) }}
    </button>
  </div>
</template>

<style scoped>
.bulk-bar {
  display: flex;
  margin: 0;
  padding: 6px 14px;
  width: 100%;
  background: var(--theme-surface, #ebe2c4);
  border-bottom: 1px solid var(--theme-border, #2a2218);
  gap: 4px;
  box-sizing: border-box;
}
.bulk-btn {
  flex: 1;
  margin: 0;
  padding: 8px 4px;
  border: 1px solid var(--theme-border, #2a2218);
  background: transparent;
  color: var(--theme-text, #2a2218);
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 1px;
  cursor: pointer;
  box-sizing: border-box;
}
.bulk-btn.active {
  background: var(--theme-accent, #2a2218);
  color: var(--theme-background, #f2ecd9);
}
</style>

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
  <div v-if="visibleTiers.length > 1" class="bulk-bar bulk-riso" role="radiogroup" aria-label="Buy multiplier">
    <button
      v-for="t in visibleTiers"
      :key="String(t)"
      type="button"
      class="bulk-seg"
      :class="{ on: state.bulkBuyMultiplier === t }"
      :aria-pressed="state.bulkBuyMultiplier === t"
      @click="select(t)"
    >
      {{ label(t) }}
    </button>
  </div>
</template>

<style scoped>
.bulk-bar {
  margin: 0;
  padding: 8px 12px 10px;
  width: 100%;
  background: var(--theme-surface, #ebe2c4);
  border-bottom: 1px solid var(--theme-border, #2a2218);
  box-sizing: border-box;
}
</style>

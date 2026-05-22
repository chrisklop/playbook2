<script setup lang="ts">
import { computed } from 'vue';
import { state } from '../state';

type Tier = 1 | 10 | 100 | 'max';

// Bulk options are available from the start now. The "watch the cost tick
// down and tap MAX at exactly the right moment" pattern is core gameplay,
// not a late-game reward -- previously these were gated behind 1/5/25
// prestiges, which buried MAX entirely. Templatable: any era inherits this.
const visibleTiers = computed<Tier[]>(() => [1, 10, 100, 'max']);

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

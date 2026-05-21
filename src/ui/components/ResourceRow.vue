<script setup lang="ts">
import { computed } from 'vue';
import { state, currentCopy, productionPerSecond } from '../state';

const formatted = computed(() => formatNumber(state.rumor));
const perSec = computed(() => formatNumber(productionPerSecond.value));

function formatNumber(n: number): string {
  if (n < 1000) return n.toFixed(0);
  if (n < 1e6) return (n / 1000).toFixed(2) + 'K';
  if (n < 1e9) return (n / 1e6).toFixed(2) + 'M';
  if (n < 1e12) return (n / 1e9).toFixed(2) + 'B';
  return n.toExponential(2);
}
</script>

<template>
  <div class="res-row">
    <div class="cell">
      <div class="val">{{ formatted }}</div>
      <div class="lbl">{{ currentCopy.resource_labels.rumor }}</div>
    </div>
    <div class="cell">
      <div class="val">{{ perSec }}/s</div>
      <div class="lbl">Rate</div>
    </div>
  </div>
</template>

<style scoped>
.res-row {
  display: flex;
  margin: 0;
  padding: 8px 14px;
  width: 100%;
  gap: 6px;
  box-sizing: border-box;
  background: var(--theme-surface, #ebe2c4);
  border-bottom: 1px solid var(--theme-border, #2a2218);
}
.cell {
  flex: 1;
  text-align: center;
  padding: 4px;
  border-right: 1px solid var(--theme-border, #2a2218);
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  color: var(--theme-text, #2a2218);
  box-sizing: border-box;
}
.cell:last-child { border-right: 0; }
.val { font-weight: 700; font-size: 14px; }
.lbl { font-size: 8px; opacity: 0.7; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
</style>

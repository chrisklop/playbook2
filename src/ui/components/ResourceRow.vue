<script setup lang="ts">
import { computed } from 'vue';
import { state, currentCopy, productionPerSecond } from '../state';
import { formatResource, formatRate } from '../format';

const formatted = computed(() => formatResource(state.rumor));
const perSec = computed(() => formatRate(productionPerSecond.value));
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

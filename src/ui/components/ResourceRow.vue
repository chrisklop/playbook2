<script setup lang="ts">
import { computed } from 'vue';
import { state, currentCopy, productionPerSecond } from '../state';
import { carryoverMultiplier } from '../../game/prestige';
import { formatResource, formatRate } from '../format';

const formatted = computed(() => formatResource(state.rumor));
const perSec = computed(() => formatRate(productionPerSecond.value));

// Permanent multiplier from Memetic Inheritance (carries across prestiges).
// Show it as "+X%" so the player can see the prestige reward at all times.
const miBonusPct = computed(() => {
  const mult = carryoverMultiplier(state.memeticInheritance);
  return Math.round((mult - 1) * 100);
});
const showMiCell = computed(() => state.memeticInheritance > 0 || state.prestigeCount > 0);
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
    <div v-if="showMiCell" class="cell mi-cell">
      <div class="val">+{{ miBonusPct }}%</div>
      <div class="lbl">Inheritance</div>
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
.mi-cell .val { color: var(--theme-accent, #2a2218); }
</style>

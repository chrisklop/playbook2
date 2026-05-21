<script setup lang="ts">
import { computed } from 'vue';
import { state, currentEra, projectedMI, canPrestige } from '../state';

const visible = computed(() => {
  // Show whenever this era prestiges into something, or the player has earned any lifetime Rumor.
  return currentEra.value.prestige_into !== null || state.lifetimeRumor > 0;
});

const progress = computed(() => Math.min(1, projectedMI.value));
const pct = computed(() => Math.round(progress.value * 100));
</script>

<template>
  <div v-if="visible" class="strip" :class="{ ready: canPrestige }">
    <div class="bar">
      <div class="fill" :style="{ width: progress * 100 + '%' }"></div>
    </div>
    <div class="label">
      <template v-if="canPrestige">Ready to ascend</template>
      <template v-else>Memetic Inheritance projected: {{ projectedMI.toFixed(2) }} — {{ pct }}%</template>
    </div>
  </div>
</template>

<style scoped>
.strip {
  margin: 0;
  padding: 4px 14px 6px;
  width: 100%;
  background: var(--theme-surface, #ebe2c4);
  border-top: 1px solid var(--theme-border, #2a2218);
  box-sizing: border-box;
  position: sticky;
  bottom: 0;
  z-index: 5;
}
.strip.ready {
  background: linear-gradient(0deg, rgba(240, 160, 96, 0.25) 0%, var(--theme-surface, #ebe2c4) 100%);
}
.bar {
  width: 100%;
  height: 3px;
  background: rgba(42, 34, 24, 0.15);
  border: 1px solid var(--theme-border, #2a2218);
  box-sizing: border-box;
}
.fill {
  height: 100%;
  background: var(--theme-accent, #2a2218);
  transition: width 200ms ease-out;
}
.label {
  font-family: var(--theme-font-body, -apple-system, sans-serif);
  font-size: 10px;
  font-style: italic;
  opacity: 0.7;
  text-align: center;
  margin-top: 2px;
}
</style>

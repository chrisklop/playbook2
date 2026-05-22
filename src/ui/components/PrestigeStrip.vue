<script setup lang="ts">
import { computed } from 'vue';
import { state, currentEra, projectedMI, canPrestige } from '../state';
import { getEra, registry } from '../../content/registry';

const visible = computed(() => {
  return currentEra.value.prestige_into !== null || state.lifetimeRumor > 0;
});
const progress = computed(() => Math.min(1, projectedMI.value));
const pct = computed(() => Math.round(progress.value * 100));
const projectedRounded = computed(() => Math.floor(projectedMI.value));

// Destination era name for the "Progress toward ___" line. Reads cleanly
// regardless of how the era's prestige_button_label is phrased (which can
// be an action verb like "Onward to..." or "Begin Again", neither of which
// composes grammatically with "Progress toward").
const destinationLabel = computed(() => {
  const nextId = currentEra.value.prestige_into;
  if (!nextId || !registry.eraIds.includes(nextId)) return 'next era';
  const next = getEra(nextId).era;
  // Loop-back (Era 4 → Era 1) reads better as "loop's end" than as a
  // bare era name, since landing back in Antiquity is the achievement.
  if (next.ordinal < currentEra.value.ordinal) return `the next loop`;
  return next.display_name;
});
</script>

<template>
  <div v-if="visible" class="strip" :class="{ ready: canPrestige }">
    <div class="header">
      <span class="title">
        <template v-if="canPrestige">⚡ READY TO ASCEND</template>
        <template v-else>Progress toward {{ destinationLabel }}</template>
      </span>
      <span class="amount">
        <template v-if="canPrestige">+{{ projectedRounded }} Inheritance</template>
        <template v-else>{{ pct }}%</template>
      </span>
    </div>
    <div class="bar">
      <div class="fill" :style="{ width: progress * 100 + '%' }"></div>
    </div>
    <div v-if="!canPrestige" class="sub">
      Memetic Inheritance projected: {{ projectedMI.toFixed(2) }} (need 1.0+)
    </div>
  </div>
</template>

<style scoped>
.strip {
  margin: 0;
  padding: 8px 14px 10px;
  width: 100%;
  background: var(--theme-surface, #ebe2c4);
  border-top: 2px solid var(--theme-border, #2a2218);
  box-sizing: border-box;
  position: sticky;
  bottom: 0;
  z-index: 5;
  transition: background 200ms ease-out;
}
.strip.ready {
  background: linear-gradient(180deg, rgba(232, 142, 56, 0.35), rgba(214, 120, 48, 0.5));
  animation: ready-pulse 1.6s ease-in-out infinite;
}
@keyframes ready-pulse {
  0%, 100% { filter: brightness(1); }
  50%      { filter: brightness(1.08); }
}
.header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}
.title {
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.strip.ready .title { color: #b3261e; }
.amount {
  font-family: var(--riso-font, 'IBM Plex Mono', monospace);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.5px;
}
.bar {
  width: 100%;
  height: 6px;
  background: rgba(0,0,0,0.15);
  border: 1px solid var(--theme-border, #2a2218);
  box-sizing: border-box;
  overflow: hidden;
}
.fill {
  height: 100%;
  background: linear-gradient(90deg, var(--theme-accent, #2a2218), var(--riso-primary-bg, #f0a050));
  transition: width 250ms ease-out;
}
.strip.ready .fill {
  background: linear-gradient(90deg, #b3261e, #f4d000);
}
.sub {
  margin-top: 4px;
  font-family: var(--theme-font-body, -apple-system, sans-serif);
  font-size: 10px;
  font-style: italic;
  opacity: 0.75;
  text-align: center;
}
</style>

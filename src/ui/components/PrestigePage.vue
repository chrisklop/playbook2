<script setup lang="ts">
import { computed } from 'vue';
import {
  state,
  currentEra,
  currentCopy,
  projectedMI,
  canPrestige,
  performPrestige,
} from '../state';
import { carryoverMultiplier } from '../../game/prestige';
import { formatResource } from '../format';

const progress = computed(() => Math.min(1, projectedMI.value));
const pct = computed(() => Math.round(progress.value * 100));
const projectedRounded = computed(() => Math.floor(projectedMI.value));

const currentBonusPct = computed(() => {
  const mult = carryoverMultiplier(state.memeticInheritance);
  return Math.round((mult - 1) * 100);
});

const lifetimeNeeded = computed(() => {
  // Inverse of MI formula: lifetime = pivot * (target_mi / 150)^2 at target=1.0
  // (i.e. the threshold to start prestiging at all).
  return Math.ceil(currentEra.value.prestige_pivot / 22500);
});
const remainingNeeded = computed(() =>
  Math.max(0, lifetimeNeeded.value - state.lifetimeRumor),
);

function tryPrestige() {
  if (!canPrestige.value) return;
  if (!confirm(`Cross into the next era? You'll gain ${projectedRounded.value} Memetic Inheritance (permanent bonus across all future runs). Current era's Rumor and tiles will reset; mastery and inheritance carry forward.`)) return;
  performPrestige();
}
</script>

<template>
  <article class="page">
    <h2>Prestige & Ascension</h2>
    <p class="lede">
      When you ascend, you abandon your current era's Rumor and generators
      to bank <strong>Memetic Inheritance</strong> — a permanent multiplier
      that applies to every era you play after, forever. The bureaus close.
      The knowledge crosses with you.
    </p>

    <section class="status">
      <div class="stat">
        <div class="stat-label">Current Inheritance</div>
        <div class="stat-value">{{ state.memeticInheritance.toFixed(2) }}</div>
        <div class="stat-sub">+{{ currentBonusPct }}% to all production</div>
      </div>
      <div class="stat">
        <div class="stat-label">Total ascensions</div>
        <div class="stat-value">{{ state.prestigeCount }}</div>
        <div class="stat-sub">era transitions completed</div>
      </div>
    </section>

    <section class="progress-block" :class="{ ready: canPrestige }">
      <div class="progress-head">
        <span class="ph-label">Progress in {{ currentEra.display_name }}</span>
        <span class="ph-amount">
          <template v-if="canPrestige">+{{ projectedRounded }} Inheritance ready</template>
          <template v-else>{{ pct }}%</template>
        </span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress * 100 + '%' }"></div>
      </div>
      <div v-if="!canPrestige" class="progress-sub">
        Projected: {{ projectedMI.toFixed(2) }} Inheritance (need 1.0+).
        Earn another <strong>{{ formatResource(remainingNeeded) }}</strong> lifetime Rumor to unlock ascension.
      </div>
      <div v-else class="progress-sub ready-sub">
        You can ascend now. The next era awaits.
      </div>
    </section>

    <button
      v-if="canPrestige"
      type="button"
      class="btn-riso btn-riso-upgrade ascend-btn"
      @click="tryPrestige"
    >
      {{ currentCopy.prestige_button_label }}
    </button>
  </article>
</template>

<style scoped>
.page {
  margin: 0;
  padding: 16px;
  width: 100%;
  box-sizing: border-box;
  color: var(--theme-text, #2a2218);
  font-family: var(--theme-font-body, -apple-system, sans-serif);
}
h2 {
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-size: 18px;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 0 0 12px;
  padding: 0;
}
.lede {
  font-size: 13px;
  line-height: 1.55;
  margin: 0 0 18px;
  padding: 0;
  opacity: 0.9;
}
.lede strong {
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 0 0 18px;
}
.stat {
  padding: 10px 12px;
  background: var(--theme-surface, #ebe2c4);
  border: 1px solid var(--theme-border, #2a2218);
  box-sizing: border-box;
}
.stat-label {
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  opacity: 0.7;
  margin: 0 0 4px;
}
.stat-value {
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-size: 22px;
  font-weight: 900;
  color: var(--theme-accent, #2a2218);
  line-height: 1;
}
.stat-sub {
  font-size: 11px;
  font-style: italic;
  opacity: 0.75;
  margin-top: 4px;
}

.progress-block {
  margin: 0 0 16px;
  padding: 12px 14px 14px;
  background: var(--theme-surface, #ebe2c4);
  border: 1px solid var(--theme-border, #2a2218);
  box-sizing: border-box;
}
.progress-block.ready {
  background: linear-gradient(180deg, rgba(232, 142, 56, 0.35), rgba(214, 120, 48, 0.5));
  animation: ready-pulse 1.6s ease-in-out infinite;
}
@keyframes ready-pulse {
  0%, 100% { filter: brightness(1); }
  50%      { filter: brightness(1.08); }
}
.progress-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 6px;
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.ph-label { text-transform: uppercase; }
.ph-amount {
  font-family: var(--riso-font, 'IBM Plex Mono', monospace);
  font-weight: 700;
}
.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(0,0,0,0.15);
  border: 1px solid var(--theme-border, #2a2218);
  box-sizing: border-box;
  overflow: hidden;
  margin-bottom: 8px;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--theme-accent, #2a2218), var(--riso-primary-bg, #f0a050));
  transition: width 250ms ease-out;
}
.progress-block.ready .progress-fill {
  background: linear-gradient(90deg, #b3261e, #f4d000);
}
.progress-sub {
  font-size: 12px;
  line-height: 1.45;
  font-style: italic;
  opacity: 0.85;
}
.ready-sub { color: #b3261e; opacity: 1; font-weight: 700; font-style: normal; }

.ascend-btn {
  display: block;
  width: 100%;
  padding: 14px 16px;
  font-size: 14px;
  letter-spacing: 2px;
}
</style>

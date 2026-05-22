<script setup lang="ts">
import { computed, watch } from 'vue';
import { state, anyNextMilestoneAffordable } from '../state';

type Tier = 1 | 10 | 100 | 'max' | 'next';

// Progressive unlock — new players learn one bulk concept at a time.
// First prestige flips everything on permanently so returning runs keep
// the full bulk toolbox.
//   ×1   always
//   ×10  once any manager has been hired (or prestigeCount > 0)
//   ×100 once any generator has reached 10 owned (or prestigeCount > 0)
//   MAX  + NEXT  after the first prestige
// Derived from existing state so no save-format migration is needed.
const x10Unlocked = computed(() =>
  state.prestigeCount > 0 || state.managersHired.size > 0,
);
const x100Unlocked = computed(() =>
  state.prestigeCount > 0 ||
  Object.values(state.ownedByGenerator).some(v => v >= 10),
);
const maxUnlocked = computed(() => state.prestigeCount > 0);
const nextUnlocked = computed(() => state.prestigeCount > 0);

const visibleTiers = computed<Tier[]>(() => {
  const tiers: Tier[] = [1];
  if (x10Unlocked.value) tiers.push(10);
  if (x100Unlocked.value) tiers.push(100);
  if (maxUnlocked.value) tiers.push('max');
  if (nextUnlocked.value) tiers.push('next');
  return tiers;
});

// If the saved/active multiplier becomes locked (e.g. legacy save loaded
// in the new gated UI), snap back to ×1 so the bulk bar's selection
// always matches what's actually clickable.
watch(visibleTiers, tiers => {
  if (!tiers.includes(state.bulkBuyMultiplier as Tier)) {
    state.bulkBuyMultiplier = 1;
  }
}, { immediate: true });

function select(t: Tier) {
  state.bulkBuyMultiplier = t;
}

function label(t: Tier): string {
  if (t === 'max') return 'MAX';
  if (t === 'next') return 'NEXT';
  return `×${t}`;
}

// NEXT is always selectable -- the player can park on it and just tap a
// tile when its BUY pill becomes affordable. The button pulses to flag
// when a target is reachable so the eye can find the moment.
function isNextReady(t: Tier): boolean {
  return t === 'next' && anyNextMilestoneAffordable.value;
}
</script>

<template>
  <div v-if="visibleTiers.length > 1" class="bulk-bar bulk-riso" role="radiogroup" aria-label="Buy multiplier">
    <button
      v-for="t in visibleTiers"
      :key="String(t)"
      type="button"
      class="bulk-seg"
      :class="{
        on: state.bulkBuyMultiplier === t,
        'next-ready': isNextReady(t),
      }"
      :aria-pressed="state.bulkBuyMultiplier === t"
      :title="t === 'next' ? 'Buy exactly enough to reach the next milestone' : undefined"
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
/* When NEXT has an affordable target on the field, give it a soft pulse so
   the eye finds the "you can hit a milestone right now" signal. */
.bulk-seg.next-ready:not(.on) {
  animation: next-pulse 1.4s ease-in-out infinite;
}
@keyframes next-pulse {
  0%, 100% { filter: brightness(1); }
  50%      { filter: brightness(1.18); }
}
</style>

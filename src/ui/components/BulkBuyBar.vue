<script setup lang="ts">
import { computed } from 'vue';
import { state, anyNextMilestoneAffordable } from '../state';

type Tier = 1 | 10 | 100 | 'max' | 'next';

// Bulk options are available from the start. The "watch the cost tick down
// and tap MAX at exactly the right moment" pattern is core gameplay.
// NEXT (AdCap-style) buys exactly enough to cross the next milestone on
// whatever tile you tap. It lights up only when at least one visible tile
// has an affordable next-milestone purchase.
const visibleTiers = computed<Tier[]>(() => [1, 10, 100, 'max', 'next']);

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

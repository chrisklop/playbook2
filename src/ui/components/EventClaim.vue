<script setup lang="ts">
import { computed } from 'vue';
import { state, claimActiveOffer } from '../state';
import { offerFractionRemaining, bonusFractionRemaining } from '../../game/ticker-events';

const offer = computed(() => state.activeOffer);
const bonus = computed(() => state.activeBonus);

const offerFraction = computed(() =>
  offer.value ? offerFractionRemaining(offer.value, state.nowMs) : 0,
);
const bonusFraction = computed(() =>
  bonus.value ? bonusFractionRemaining(bonus.value, state.nowMs) : 0,
);

const bonusSecondsLeft = computed(() => {
  if (!bonus.value) return 0;
  return Math.max(0, Math.ceil((bonus.value.expires_at_ms - state.nowMs) / 1000));
});
</script>

<template>
  <!-- Active claim offer: pulsing call-to-action with a draining timer bar -->
  <div v-if="offer" class="event-claim">
    <div class="headline">{{ offer.headline }}</div>
    <button
      type="button"
      class="btn-riso claim-btn"
      @click="claimActiveOffer"
    >
      {{ offer.claim_verb }} · ×{{ offer.effect_value }} for {{ offer.effect_duration_s }}s
    </button>
    <div class="timer-bar" :style="{ width: offerFraction * 100 + '%' }"></div>
  </div>

  <!-- Active bonus (post-claim): small banner showing time remaining -->
  <div v-else-if="bonus" class="event-bonus">
    <span class="bonus-label">×{{ bonus.value }} ACTIVE</span>
    <span class="bonus-time">{{ bonusSecondsLeft }}s</span>
    <div class="bonus-bar" :style="{ width: bonusFraction * 100 + '%' }"></div>
  </div>
</template>

<style scoped>
.event-claim {
  position: relative;
  margin: 0;
  padding: 10px 14px 14px;
  background: var(--riso-primary-bg, #f0a050);
  color: var(--riso-primary-text, #1a1410);
  border-bottom: 2px solid var(--riso-ink, #1a1410);
  animation: claim-pulse 1.4s ease-in-out infinite;
  overflow: hidden;
}
@keyframes claim-pulse {
  0%, 100% { background: var(--riso-primary-bg, #f0a050); }
  50%      { background: #ffc080; }
}
.headline {
  font-family: var(--riso-font, 'IBM Plex Mono', monospace);
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 8px;
  text-align: center;
}
.claim-btn {
  width: 100%;
  display: block;
  background: var(--riso-ink, #1a1410);
  color: var(--riso-paper, #f4ecd6);
  box-shadow: 4px 4px 0 0 var(--riso-primary-shadow, #4a90b0);
  font-size: 12px;
  padding: 9px 14px;
}
.claim-btn:active {
  transform: translate(4px, 4px);
  box-shadow: 0 0 0 0 var(--riso-primary-shadow, #4a90b0);
}
.timer-bar {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  background: var(--riso-ink, #1a1410);
  transition: width 100ms linear;
}

.event-bonus {
  position: relative;
  margin: 0;
  padding: 6px 14px 9px;
  background: rgba(42, 107, 53, 0.18);
  color: var(--riso-ink, #1a1410);
  border-bottom: 1px solid var(--riso-ink, #1a1410);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: var(--riso-font, 'IBM Plex Mono', monospace);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  overflow: hidden;
}
.bonus-label { color: #2a6b35; }
.bonus-bar {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  background: #2a6b35;
  transition: width 200ms linear;
}
</style>

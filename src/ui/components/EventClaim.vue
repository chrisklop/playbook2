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
  <div v-if="offer" class="event-claim" :class="{ frenzy: offer.is_frenzy }">
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
  <div v-else-if="bonus" class="event-bonus" :class="{ frenzy: bonus.is_frenzy }">
    <span class="bonus-label">
      <template v-if="bonus.is_frenzy">⚡ FRENZY ×{{ bonus.value }}</template>
      <template v-else>×{{ bonus.value }} ACTIVE</template>
    </span>
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

/* Frenzy treatment — louder, hotter, faster pulse so the player feels
   the urgency of a high-magnitude burst. Era theme tokens still drive
   the base palette; we override only the intensity. */
.event-claim.frenzy {
  background: linear-gradient(90deg, #ff3b00, #ffb800, #ff3b00);
  background-size: 200% 100%;
  color: #fff5d4;
  animation: frenzy-claim-pulse 0.45s ease-in-out infinite,
             frenzy-claim-shift 1.2s linear infinite;
  box-shadow: 0 0 18px 2px rgba(255, 90, 0, 0.55);
}
.event-claim.frenzy .headline { color: #fff5d4; text-shadow: 0 1px 0 rgba(0,0,0,0.45); }
.event-claim.frenzy .claim-btn {
  background: #fff5d4;
  color: #b3261e;
  box-shadow: 4px 4px 0 0 #1a1410;
}
@keyframes frenzy-claim-pulse {
  0%, 100% { filter: brightness(1); }
  50%      { filter: brightness(1.18); }
}
@keyframes frenzy-claim-shift {
  0%   { background-position: 0% 0%; }
  100% { background-position: 200% 0%; }
}

.event-bonus.frenzy {
  background: linear-gradient(90deg, rgba(255, 59, 0, 0.22), rgba(255, 184, 0, 0.22));
  border-bottom-color: #b3261e;
}
.event-bonus.frenzy .bonus-label { color: #b3261e; }
.event-bonus.frenzy .bonus-bar   { background: #b3261e; }
</style>

<script setup lang="ts">
import { computed } from 'vue';
import { state } from '../state';
import { formatResource } from '../format';

const data = computed(() => state.timeWarpAnimation);

// Streak count tuned for visual density without absurd DOM count. Each
// streak is positioned via CSS variables (--x, --delay, --duration) so
// the keyframes can sweep them upward at different speeds.
const STREAK_COUNT = 28;
const streaks = Array.from({ length: STREAK_COUNT }).map((_, i) => ({
  i,
  x: (i * (100 / STREAK_COUNT) + Math.random() * 3) + '%',
  delay: (Math.random() * 0.6).toFixed(2) + 's',
  duration: (0.6 + Math.random() * 0.9).toFixed(2) + 's',
  width: (1 + Math.random() * 2).toFixed(1) + 'px',
  opacity: (0.35 + Math.random() * 0.45).toFixed(2),
}));
</script>

<template>
  <Transition name="warp-fade">
    <div v-if="data" class="warp-overlay" role="status" aria-live="polite">
      <!-- Vertical motion streaks. Lots of thin lines drifting upward at
           different speeds reads as "time is rushing past you." -->
      <div class="warp-streaks" aria-hidden="true">
        <span
          v-for="s in streaks"
          :key="s.i"
          class="warp-streak"
          :style="{
            left: s.x,
            width: s.width,
            opacity: s.opacity,
            animationDelay: s.delay,
            animationDuration: s.duration,
          }"
        />
      </div>

      <!-- Centered reveal. Sequential lines: "+1 HOUR" appears first,
           "+X RUMOR" follows a beat later. -->
      <div class="warp-text">
        <div class="warp-hours">+{{ data.hours }} HOUR<span v-if="data.hours !== 1">S</span></div>
        <div class="warp-rumor">+{{ formatResource(data.rumorGained) }} Rumor</div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.warp-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  pointer-events: none;
  overflow: hidden;
  /* Translucent dark wash so the game world is still faintly visible
     behind the streaks — emphasises that time is rushing, not that the
     screen has been hijacked. */
  background: linear-gradient(
    180deg,
    rgba(20, 18, 30, 0.55) 0%,
    rgba(10, 8, 20, 0.85) 50%,
    rgba(20, 18, 30, 0.55) 100%
  );
  -webkit-backdrop-filter: blur(2px) saturate(1.1);
  backdrop-filter: blur(2px) saturate(1.1);
}

.warp-streaks {
  position: absolute;
  inset: 0;
}
.warp-streak {
  position: absolute;
  bottom: -120px;
  height: 120px;
  background: linear-gradient(180deg,
    rgba(155, 92, 246, 0) 0%,
    rgba(155, 92, 246, 0.9) 50%,
    rgba(199, 162, 255, 1) 100%);
  border-radius: 999px;
  animation-name: warp-streak-rise;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
  filter: drop-shadow(0 0 8px rgba(155, 92, 246, 0.6));
}
@keyframes warp-streak-rise {
  from { transform: translateY(0); }
  to   { transform: translateY(-120vh); }
}

.warp-text {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 14px;
  font-family: var(--theme-font-masthead, 'Space Grotesk', 'Inter', sans-serif);
  text-shadow:
    0 2px 6px rgba(0, 0, 0, 0.5),
    0 0 24px rgba(155, 92, 246, 0.5);
}
.warp-hours {
  font-size: clamp(48px, 14vw, 96px);
  font-weight: 900;
  letter-spacing: 6px;
  color: #fff;
  animation: warp-hours-pop 1.4s cubic-bezier(0.2, 0.8, 0.3, 1) both;
}
.warp-rumor {
  font-size: clamp(18px, 5vw, 28px);
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #fbbf24;
  animation: warp-rumor-pop 1.6s 0.45s cubic-bezier(0.2, 0.8, 0.3, 1) both;
}

@keyframes warp-hours-pop {
  from { opacity: 0; transform: scale(0.65) translateY(40px); letter-spacing: 28px; }
  to   { opacity: 1; transform: scale(1)    translateY(0);    letter-spacing: 6px; }
}
@keyframes warp-rumor-pop {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

.warp-fade-enter-active { transition: opacity 200ms ease; }
.warp-fade-leave-active { transition: opacity 320ms ease; }
.warp-fade-enter-from,
.warp-fade-leave-to { opacity: 0; }
</style>

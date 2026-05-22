<script setup lang="ts">
import { computed } from 'vue';
import { state } from '../state';

const t = computed(() => state.eraTransition);
const phase = computed(() => t.value?.phase ?? null);
</script>

<template>
  <Transition name="overlay-fade">
    <div v-if="t" class="overlay" :class="phase">
      <!-- Phase 1: outgoing era. Bridge copy reads big over a slow vignette. -->
      <Transition name="layer-fade" mode="out-in">
        <div v-if="phase === 'leaving'" key="leaving" class="layer leaving">
          <div class="meta">
            <span class="meta-label">Ending</span>
            <span class="meta-name">{{ t.outgoingName }}</span>
            <span class="meta-date">{{ t.outgoingDateRange }}</span>
          </div>
          <p class="bridge">{{ t.bridgeCopy }}</p>
          <div class="mi-line">
            +<strong>{{ Math.floor(t.miGained) }}</strong>
            <span class="mi-suffix">Memetic Inheritance</span>
          </div>
        </div>

        <!-- Phase 2: incoming era reveals over a brighter wash. Masthead lands. -->
        <div v-else key="arriving" class="layer arriving">
          <div class="meta">
            <span class="meta-label">{{ t.isLoopBack ? 'Loop · Begin Again' : 'Now' }}</span>
            <span class="meta-date">{{ t.incomingDateRange }}</span>
          </div>
          <div class="masthead">{{ t.incomingMasthead }}</div>
          <div class="era-name">{{ t.incomingName }}</div>
        </div>
      </Transition>

      <!-- Slow scanline shimmer — purely cosmetic, gives the overlay
           a film-projector feel without being garish. -->
      <div class="grain" aria-hidden="true"></div>
    </div>
  </Transition>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 28px;
  background: radial-gradient(
    ellipse at center,
    var(--theme-surface, #2a2218) 0%,
    var(--theme-background, #1a140e) 80%,
    #0a0805 100%
  );
  color: var(--theme-text, #f0e8d0);
  pointer-events: none; /* purely cinematic — no skip in v1 */
  overflow: hidden;
}
.overlay.arriving {
  background: radial-gradient(
    ellipse at center,
    var(--theme-surface, #ebe2c4) 0%,
    var(--theme-background, #f2ecd9) 80%,
    var(--theme-border, #2a2218) 100%
  );
  color: var(--theme-text, #2a2218);
}

.layer {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 560px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 18px;
  align-items: center;
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  text-transform: uppercase;
}
.meta-label {
  font-size: 10px;
  letter-spacing: 4px;
  opacity: 0.55;
}
.meta-name {
  font-size: 13px;
  letter-spacing: 3px;
  font-weight: 700;
  opacity: 0.85;
}
.meta-date {
  font-size: 11px;
  letter-spacing: 2px;
  opacity: 0.55;
  font-family: var(--theme-font-body, serif);
  font-style: italic;
}

.bridge {
  font-family: var(--theme-font-body, Georgia, serif);
  font-size: 17px;
  line-height: 1.5;
  font-style: italic;
  padding: 0 6px;
  margin: 0;
  opacity: 0.95;
  max-width: 480px;
}

.mi-line {
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 2px;
  opacity: 0.85;
  margin-top: 6px;
}
.mi-line strong {
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 0.5px;
  margin: 0 4px;
  color: var(--theme-accent, #e88e38);
  text-shadow: 0 2px 0 rgba(0, 0, 0, 0.35);
}
.mi-suffix {
  display: block;
  margin-top: 2px;
  font-size: 9px;
  letter-spacing: 3px;
  opacity: 0.7;
}

.masthead {
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-size: clamp(28px, 9vw, 56px);
  font-weight: 900;
  letter-spacing: 8px;
  text-transform: uppercase;
  text-shadow: 0 2px 0 rgba(0, 0, 0, 0.18);
  margin: 0;
  animation: rise 1.2s cubic-bezier(0.22, 0.95, 0.36, 1) both;
}
.era-name {
  font-family: var(--theme-font-body, Georgia, serif);
  font-size: 18px;
  letter-spacing: 6px;
  font-style: italic;
  opacity: 0.85;
  margin-top: 4px;
  animation: rise 1.4s 0.2s cubic-bezier(0.22, 0.95, 0.36, 1) both;
}

@keyframes rise {
  from { opacity: 0; transform: translateY(20px); letter-spacing: 16px; }
  to   { opacity: 1; transform: translateY(0); }
}

/* Cinematic crossfades between leaving / arriving layers. */
.layer-fade-enter-active { transition: opacity 1100ms ease, transform 1100ms ease; }
.layer-fade-leave-active { transition: opacity 700ms ease,  transform 700ms ease; }
.layer-fade-enter-from   { opacity: 0; transform: scale(1.04); }
.layer-fade-leave-to     { opacity: 0; transform: scale(0.96); }

/* Outer overlay open/close. */
.overlay-fade-enter-active, .overlay-fade-leave-active {
  transition: opacity 700ms ease, backdrop-filter 700ms ease;
}
.overlay-fade-enter-from, .overlay-fade-leave-to { opacity: 0; }

/* Subtle moving grain — diagonal stripes drifting slowly. Gives the
   overlay the texture of an old film leader without being noisy. */
.grain {
  position: absolute;
  inset: -20%;
  background:
    repeating-linear-gradient(
      115deg,
      rgba(255, 255, 255, 0.0) 0 12px,
      rgba(255, 255, 255, 0.018) 12px 13px
    );
  animation: grain-drift 8s linear infinite;
  pointer-events: none;
  z-index: 0;
}
@keyframes grain-drift {
  from { transform: translate(0, 0); }
  to   { transform: translate(80px, 40px); }
}
</style>

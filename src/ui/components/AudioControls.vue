<script setup lang="ts">
import { state } from '../state';
</script>

<template>
  <div class="audio-controls" role="group" aria-label="Audio controls">
    <button
      type="button"
      class="audio-btn"
      :class="{ muted: state.audioMuted }"
      :aria-pressed="!state.audioMuted"
      :aria-label="state.audioMuted ? 'Unmute sound effects' : 'Mute sound effects'"
      title="Sound effects"
      @click="state.audioMuted = !state.audioMuted"
    >
      <span class="glyph">{{ state.audioMuted ? '🔇' : '🔊' }}</span>
    </button>
    <button
      type="button"
      class="audio-btn"
      :class="{ muted: state.musicMuted }"
      :aria-pressed="!state.musicMuted"
      :aria-label="state.musicMuted ? 'Unmute music' : 'Mute music'"
      title="Background music"
      @click="state.musicMuted = !state.musicMuted"
    >
      <span class="glyph">🎵</span>
      <span v-if="state.musicMuted" class="strike"></span>
    </button>
  </div>
</template>

<style scoped>
/* Floating top-right toggle group. Persistent across every tab so the
   player can mute/unmute without diving into Settings. */
.audio-controls {
  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + 8px);
  right: calc(env(safe-area-inset-right, 0px) + 8px);
  z-index: 50;
  display: flex;
  gap: 4px;
  pointer-events: auto;
}
.audio-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin: 0;
  padding: 0;
  background: var(--theme-surface, #fff);
  border: 1.5px solid var(--theme-border, #1a1a1a);
  border-radius: 0;
  cursor: pointer;
  box-shadow: 2px 2px 0 0 var(--theme-border, #1a1a1a);
  transition: transform 60ms ease-out, box-shadow 60ms ease-out, opacity 100ms;
  -webkit-tap-highlight-color: transparent;
}
.audio-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 0 0 0 0 var(--theme-border, #1a1a1a);
}
.audio-btn.muted {
  opacity: 0.55;
  background: rgba(0, 0, 0, 0.05);
}
.glyph {
  font-size: 15px;
  line-height: 1;
  filter: grayscale(0.2);
}
.audio-btn.muted .glyph { filter: grayscale(0.7); }
/* Diagonal strike for muted music button — emoji set has no "muted music"
   glyph, so we overlay our own. */
.strike {
  position: absolute;
  top: 50%;
  left: 4px;
  right: 4px;
  height: 2px;
  background: var(--theme-accent, #b3261e);
  transform: rotate(-22deg);
  pointer-events: none;
}
</style>

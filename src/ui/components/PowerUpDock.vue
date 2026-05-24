<script setup lang="ts">
import { computed, ref } from 'vue';
import { FastForward, X as XIcon } from '@lucide/vue';
import { state, useTimeWarp, productionPotentialPerSecond } from '../state';
import { formatResource } from '../format';

// Floating power-up dock — bottom-right above the tab bar. Currently
// houses a single power-up type (Time Warp). Structured so additional
// types can drop in beside it without UI rewriting.

const open = ref(false);
const warpCount = computed(() => state.timeWarpsAvailable);
const hasWarps = computed(() => warpCount.value > 0);

const previewRumor = computed(() => productionPotentialPerSecond.value * 3600);

function toggle() { open.value = !open.value; }
function close() { open.value = false; }

function fireWarp() {
  const gained = useTimeWarp(1);
  if (gained > 0) close();
}
</script>

<template>
  <!-- Floating FAB. Only shown when the dock has at least one power-up;
       returning players who've used everything see a clean screen. -->
  <button
    v-if="hasWarps"
    type="button"
    class="dock-fab"
    :class="{ pulsing: hasWarps && !open }"
    :aria-label="`Power-ups available: ${warpCount}`"
    :aria-expanded="open"
    @click="toggle"
  >
    <FastForward :stroke-width="2" class="dock-icon" />
    <span v-if="warpCount > 0" class="dock-badge">{{ warpCount }}</span>
  </button>

  <!-- Panel slides up from the FAB. Outside-click via the backdrop. -->
  <Teleport to="body">
    <Transition name="dock-panel-fade">
      <div v-if="open" class="dock-backdrop" @click.self="close">
        <div class="dock-panel" role="dialog" aria-label="Power-ups">
          <div class="dock-head">
            <h3>POWER-UPS</h3>
            <button class="dock-close" @click="close" aria-label="Close">
              <XIcon :stroke-width="2" />
            </button>
          </div>

          <div class="dock-item">
            <div class="dock-item-head">
              <FastForward :stroke-width="2" class="dock-item-icon" />
              <div class="dock-item-meta">
                <div class="dock-item-name">Time Warp</div>
                <div class="dock-item-count">{{ warpCount }} available</div>
              </div>
            </div>
            <p class="dock-item-desc">
              Skip forward <strong>1 hour</strong> at your current production rate.
              You'll gain about <strong>{{ formatResource(previewRumor) }} Rumor</strong>.
            </p>
            <button
              type="button"
              class="dock-use"
              :disabled="!hasWarps"
              @click="fireWarp"
            >USE TIME WARP</button>
          </div>

          <p class="dock-footnote">
            Time Warps stack across runs. Each prestige awards one more.
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Floating FAB. Power-up purple is a deliberate non-era hue so the dock
   reads as a *meta* control, not an in-era button. */
.dock-fab {
  position: fixed;
  bottom: calc(72px + env(safe-area-inset-bottom, 0px));
  right: 16px;
  z-index: 90;
  width: 56px;
  height: 56px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, #9b5cf6 0%, #6d28d9 100%);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 2px 6px rgba(109, 40, 217, 0.4),
    0 12px 28px rgba(109, 40, 217, 0.35);
  transition: transform 160ms cubic-bezier(0.2, 0.8, 0.3, 1), box-shadow 160ms ease;
}
.dock-fab:hover {
  transform: translateY(-2px) scale(1.04);
  box-shadow:
    0 4px 10px rgba(109, 40, 217, 0.45),
    0 16px 36px rgba(109, 40, 217, 0.45);
}
.dock-fab:active { transform: translateY(0) scale(0.96); }

.dock-fab.pulsing::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid rgba(155, 92, 246, 0.55);
  animation: dock-pulse 1.8s ease-out infinite;
  pointer-events: none;
}
@keyframes dock-pulse {
  0%   { transform: scale(1); opacity: 0.7; }
  100% { transform: scale(1.4); opacity: 0; }
}
.dock-icon {
  width: 26px;
  height: 26px;
}
.dock-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 10px;
  background: #fbbf24;
  color: #1a1a1a;
  font-family: var(--theme-font-masthead, sans-serif);
  font-size: 11px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
  box-sizing: border-box;
}
</style>

<!-- Teleported markup must use unscoped styles (Vue scoped styles add a
     data attribute that wouldn't match teleported nodes). -->
<style>
.dock-backdrop {
  position: fixed;
  inset: 0;
  z-index: 95;
  background: rgba(0, 0, 0, 0.5);
  -webkit-backdrop-filter: blur(8px) saturate(120%);
  backdrop-filter: blur(8px) saturate(120%);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 16px;
  box-sizing: border-box;
}
.dock-panel {
  width: 100%;
  max-width: 480px;
  margin-bottom: calc(72px + env(safe-area-inset-bottom, 0px));
  padding: 18px 18px 16px;
  background: color-mix(in srgb, var(--theme-surface, #ebe2c4) 92%, transparent 8%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  backdrop-filter: blur(20px) saturate(140%);
  color: var(--theme-text, #2a2218);
  border: 1px solid color-mix(in srgb, var(--theme-border, #2a2218) 50%, transparent);
  border-radius: 12px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 24px 60px rgba(0, 0, 0, 0.35);
  font-family: var(--theme-font-body, -apple-system, sans-serif);
  box-sizing: border-box;
}

.dock-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.dock-head h3 {
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-size: 13px;
  letter-spacing: 3px;
  font-weight: 800;
  margin: 0;
  padding: 0;
}
.dock-close {
  width: 28px;
  height: 28px;
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--theme-text, #2a2218);
  opacity: 0.7;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.dock-close:hover { opacity: 1; }
.dock-close svg { width: 18px; height: 18px; }

.dock-item {
  padding: 14px 14px 16px;
  background: color-mix(in srgb, var(--theme-background, #f2ecd9) 70%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-border, #2a2218) 30%, transparent);
  border-radius: 8px;
}
.dock-item-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.dock-item-icon {
  width: 28px;
  height: 28px;
  color: #9b5cf6;
  flex-shrink: 0;
}
.dock-item-meta { display: flex; flex-direction: column; }
.dock-item-name {
  font-family: var(--theme-font-masthead, sans-serif);
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.dock-item-count {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 2px;
}
.dock-item-desc {
  font-size: 12px;
  line-height: 1.5;
  margin: 0 0 12px;
  padding: 0;
  opacity: 0.9;
}
.dock-item-desc strong { font-weight: 700; }

.dock-use {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #9b5cf6 0%, #6d28d9 100%);
  color: #fff;
  font-family: var(--theme-font-masthead, sans-serif);
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 2px;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(109, 40, 217, 0.35);
  transition: transform 120ms ease, box-shadow 120ms ease;
}
.dock-use:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(109, 40, 217, 0.45);
}
.dock-use:active { transform: translateY(1px); }
.dock-use:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.dock-footnote {
  margin: 12px 0 0;
  padding: 0;
  font-size: 11px;
  opacity: 0.6;
  font-style: italic;
  text-align: center;
}

.dock-panel-fade-enter-active,
.dock-panel-fade-leave-active {
  transition: opacity 200ms ease;
}
.dock-panel-fade-enter-from,
.dock-panel-fade-leave-to { opacity: 0; }
.dock-panel-fade-enter-active .dock-panel,
.dock-panel-fade-leave-active .dock-panel {
  transition: transform 220ms cubic-bezier(0.2, 0.8, 0.3, 1);
}
.dock-panel-fade-enter-from .dock-panel,
.dock-panel-fade-leave-to .dock-panel {
  transform: translateY(20px);
}
</style>

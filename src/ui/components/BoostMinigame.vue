<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import {
  state,
  minigameSuccess,
  minigameMiss,
  minigameCancel,
  BOOST_TARGET_WIDTH,
} from '../state';
import { X as XIcon } from '@lucide/vue';

// Boost name lookup — per Era 7 generator id. Maps to short
// tile-specific titles used in the minigame header.
const BOOST_NAMES: Record<string, string> = {
  'pin-a-nickname': 'NEWS CYCLE',
  'drop-qanon-cryptic': 'BREAD-BAKER FRENZY',
  'air-tucker-monologue': 'CROPPED-CLIP VIRAL',
  'deploy-troll-farm': 'COORDINATED ACTION',
  'boost-presidential-candidate': 'SUNDAY ENDORSEMENT',
  'stage-mega-rally': 'CATCH THE SPIRIT',
};

// Streak tier labels — earned per successful round, shown as a progress trail.
const TIER_NAMES = ['Spark', 'Surge', 'Storm', 'Cascade', 'Avalanche'];

const m = computed(() => state.activeMinigame);
const isOpen = computed(() => m.value !== null);

const boostTitle = computed(() => {
  if (!m.value) return '';
  return BOOST_NAMES[m.value.genId] ?? 'BOOST';
});

const round = computed(() => m.value?.round ?? 1);
const currentMult = computed(() => m.value?.currentMultiplier ?? 1);
const targetWidth = computed(() => BOOST_TARGET_WIDTH[round.value - 1] ?? 0.05);

// Cursor sweep — 0..1 fraction across the bar, ping-pongs at the edges
// so the timing feels rhythmic rather than one-shot.
const cursor = ref(0);
const direction = ref(1);
let rafId: number | null = null;
let lastT = 0;
// Sweep speed (fraction of bar per second). Speeds up each round for
// added pressure on the narrower target zones.
const SPEED_BY_ROUND = [0.65, 0.8, 0.95, 1.15, 1.4];
const speed = computed(() => SPEED_BY_ROUND[round.value - 1] ?? 1.0);

function loop(t: number) {
  if (!lastT) lastT = t;
  const dt = (t - lastT) / 1000;
  lastT = t;
  cursor.value += direction.value * speed.value * dt;
  if (cursor.value >= 1) { cursor.value = 1; direction.value = -1; }
  if (cursor.value <= 0) { cursor.value = 0; direction.value = 1; }
  rafId = requestAnimationFrame(loop);
}

watch(isOpen, open => {
  if (open) {
    cursor.value = 0;
    direction.value = 1;
    lastT = 0;
    rafId = requestAnimationFrame(loop);
  } else if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
});

// Restart cursor when advancing to a new round so each tap feels fresh.
watch(round, () => {
  cursor.value = 0;
  direction.value = 1;
});

onUnmounted(() => {
  if (rafId !== null) cancelAnimationFrame(rafId);
});

function tapBar() {
  if (!m.value) return;
  const center = 0.5;
  const half = targetWidth.value / 2;
  const inZone = cursor.value >= center - half && cursor.value <= center + half;
  if (inZone) {
    minigameSuccess();
  } else {
    minigameMiss();
  }
}

function close() {
  minigameCancel();
}

// Target zone bounds for the visual indicator.
const zoneStartPct = computed(() => (0.5 - targetWidth.value / 2) * 100);
const zoneWidthPct = computed(() => targetWidth.value * 100);
const cursorLeftPct = computed(() => cursor.value * 100);
</script>

<template>
  <Teleport to="body">
    <Transition name="boost-fade">
      <div v-if="isOpen" class="boost-backdrop" @click.self="close">
        <div class="boost-modal" role="dialog" aria-label="Boost timing minigame">
          <button class="boost-close" @click="close" aria-label="Cancel">
            <XIcon :stroke-width="2" />
          </button>

          <div class="boost-title">{{ boostTitle }}</div>
          <div class="boost-sub">Tap when the cursor enters the zone</div>

          <div class="boost-meta">
            <div class="boost-round">
              Round <strong>{{ round }}</strong> / 5
              <span class="tier">— {{ TIER_NAMES[round - 1] }}</span>
            </div>
            <div class="boost-mult">
              <span class="mult-label">Current</span>
              <span class="mult-value">×{{ currentMult }}</span>
            </div>
          </div>

          <div class="boost-bar" @click="tapBar">
            <div
              class="boost-zone"
              :style="{
                left: zoneStartPct + '%',
                width: zoneWidthPct + '%',
              }"
            />
            <div
              class="boost-cursor"
              :style="{ left: cursorLeftPct + '%' }"
            />
          </div>

          <button class="boost-tap-btn" @click="tapBar">TAP NOW</button>

          <div class="boost-foot">
            Miss the zone and your streak ends — you keep whatever multiplier
            you've earned. Max <strong>×32</strong> for 30 seconds.
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.boost-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9500;
  background: rgba(0, 0, 0, 0.65);
  -webkit-backdrop-filter: blur(10px) saturate(120%);
  backdrop-filter: blur(10px) saturate(120%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-sizing: border-box;
}

.boost-modal {
  position: relative;
  width: 100%;
  max-width: 480px;
  padding: 28px 24px 22px;
  background: color-mix(in srgb, var(--surface) 92%, transparent 8%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  backdrop-filter: blur(20px) saturate(140%);
  color: var(--text-strong);
  border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
  border-radius: 16px;
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, white 8%, transparent),
    0 32px 80px rgba(0, 0, 0, 0.5);
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
  box-sizing: border-box;
}

.boost-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: 0;
  color: var(--text-muted);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: background 120ms ease, color 120ms ease;
}
.boost-close:hover { background: var(--surface-2); color: var(--text-strong); }
.boost-close svg { width: 16px; height: 16px; }

.boost-title {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 2px;
  color: var(--accent-text);
  text-align: center;
  margin: 0;
}
.boost-sub {
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
  margin: 4px 0 22px;
}

.boost-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 0 14px;
}
.boost-round {
  font-size: 13px;
  color: var(--text-muted);
}
.boost-round strong {
  color: var(--text-strong);
  font-weight: 700;
  margin: 0 2px;
}
.boost-round .tier {
  color: var(--text-faint);
  margin-left: 4px;
}
.boost-mult { display: flex; align-items: baseline; gap: 6px; }
.mult-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--text-faint);
}
.mult-value {
  font-family: 'JetBrains Mono', 'Menlo', monospace;
  font-size: 22px;
  font-weight: 800;
  color: var(--accent-text);
}

.boost-bar {
  position: relative;
  height: 56px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  margin: 0 0 14px;
}
.boost-zone {
  position: absolute;
  top: 0;
  bottom: 0;
  background: color-mix(in srgb, var(--accent-solid) 35%, transparent);
  border-left: 2px solid var(--accent-solid);
  border-right: 2px solid var(--accent-solid);
  transition: left 120ms ease, width 120ms ease;
  box-shadow: inset 0 0 12px color-mix(in srgb, var(--accent-solid) 30%, transparent);
}
.boost-cursor {
  position: absolute;
  top: 6px;
  bottom: 6px;
  width: 3px;
  background: var(--text-strong);
  border-radius: 999px;
  transform: translateX(-50%);
  box-shadow: 0 0 8px var(--text-strong), 0 0 14px color-mix(in srgb, var(--text-strong) 50%, transparent);
}

.boost-tap-btn {
  width: 100%;
  padding: 14px;
  background: var(--accent-solid);
  color: var(--accent-contrast);
  font-family: inherit;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 2px;
  border: 0;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 6px 16px color-mix(in srgb, var(--accent-solid) 45%, transparent);
  transition: transform 100ms ease, box-shadow 120ms ease;
}
.boost-tap-btn:hover { transform: translateY(-1px); }
.boost-tap-btn:active { transform: translateY(1px); }

.boost-foot {
  margin-top: 14px;
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
  line-height: 1.5;
}
.boost-foot strong { color: var(--text-strong); }

.boost-fade-enter-active, .boost-fade-leave-active {
  transition: opacity 180ms ease;
}
.boost-fade-enter-from, .boost-fade-leave-to { opacity: 0; }
</style>

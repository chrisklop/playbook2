<script setup lang="ts">
import { ref, onBeforeUnmount, watch, nextTick } from 'vue';
import { openCodexEntry } from '../nav-state';

const props = defineProps<{
  factoid: string;
  codexLink?: string | null;
  /** Optional small label shown above the factoid — e.g., the tile's name */
  context?: string;
}>();

const open = ref(false);
const root = ref<HTMLElement | null>(null);
const popover = ref<HTMLElement | null>(null);
// Computed style for the teleported popover. Calculated from the trigger
// button's getBoundingClientRect on open, so the popover is anchored to the
// button visually but lives at the body level — escaping any parent's
// overflow:hidden / stacking context.
const popStyle = ref<Record<string, string>>({});

const POPOVER_GAP_PX = 6;
const POPOVER_MIN_WIDTH = 240;
const VIEWPORT_MARGIN = 8;

function recomputePosition() {
  if (!root.value) return;
  const btnRect = root.value.getBoundingClientRect();
  // The popover sits below the button by default, right-aligned to it. We
  // clamp the right edge to the viewport so the popover never goes off-screen.
  // Width is min(320px, 86vw) — same as before.
  const desiredWidth = Math.min(320, window.innerWidth * 0.86);
  const right = Math.max(
    VIEWPORT_MARGIN,
    window.innerWidth - btnRect.right,
  );
  const left = Math.max(VIEWPORT_MARGIN, window.innerWidth - right - desiredWidth);

  popStyle.value = {
    position: 'fixed',
    top: `${btnRect.bottom + POPOVER_GAP_PX}px`,
    left: `${left}px`,
    width: `${desiredWidth}px`,
    minWidth: `${POPOVER_MIN_WIDTH}px`,
    maxWidth: `${desiredWidth}px`,
  };
}

function toggle(e: Event) {
  e.stopPropagation();
  open.value = !open.value;
  if (open.value) {
    nextTick(recomputePosition);
  }
}

function close() {
  open.value = false;
}

function readMore(e: Event) {
  e.stopPropagation();
  if (!props.codexLink) return;
  open.value = false;
  openCodexEntry(props.codexLink);
}

// Outside-click closes the popover. Must check both the root (trigger) and
// the teleported popover element — otherwise clicking inside the popover
// (e.g. the "Read more" button) would close it before the handler fires.
function onDocPointerDown(e: PointerEvent) {
  const target = e.target as Node;
  if (root.value?.contains(target)) return;
  if (popover.value?.contains(target)) return;
  close();
}

// Reposition on scroll/resize while open so the popover follows the button
// if the layout reflows around it.
function onReflow() {
  if (open.value) recomputePosition();
}

watch(open, isOpen => {
  if (isOpen) {
    document.addEventListener('pointerdown', onDocPointerDown);
    window.addEventListener('scroll', onReflow, true);
    window.addEventListener('resize', onReflow);
  } else {
    document.removeEventListener('pointerdown', onDocPointerDown);
    window.removeEventListener('scroll', onReflow, true);
    window.removeEventListener('resize', onReflow);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocPointerDown);
  window.removeEventListener('scroll', onReflow, true);
  window.removeEventListener('resize', onReflow);
});
</script>

<template>
  <div ref="root" class="info-root" @click.stop>
    <button
      type="button"
      class="info-btn"
      :class="{ active: open }"
      :aria-label="open ? 'Close factoid' : 'Show factoid'"
      :aria-expanded="open"
      @click="toggle"
    >ⓘ</button>

    <Teleport to="body">
      <Transition name="info-pop">
        <div
          v-if="open"
          ref="popover"
          class="info-pop"
          role="dialog"
          :style="popStyle"
          @click.stop
        >
          <div v-if="context" class="info-context">{{ context }}</div>
          <p class="info-text">{{ factoid }}</p>
          <button
            v-if="codexLink"
            type="button"
            class="info-more"
            @click="readMore"
          >Read full codex entry →</button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.info-root {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.info-btn {
  width: 22px;
  height: 22px;
  padding: 0;
  margin: 0;
  border: 1px solid var(--theme-border, #2a2218);
  background: transparent;
  color: var(--theme-text, #2a2218);
  font-family: var(--theme-font-body, -apple-system, sans-serif);
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  border-radius: 50%;
  opacity: 0.55;
  transition: opacity 120ms ease, background 120ms ease;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}
.info-btn:hover,
.info-btn.active {
  opacity: 1;
  background: var(--theme-surface, rgba(0, 0, 0, 0.08));
}
</style>

<!-- The teleported popover lives at the document body, so its styles must
     be unscoped (Vue scoped styles add a data attribute that wouldn't match
     teleported markup). Place these in a non-scoped block. -->
<style>
.info-pop {
  /* position/top/left/width come from inline :style.
     Chrome-glass surface: neutral mauve-dark with translucency + backdrop
     blur, so the popover reads as a frosted overlay regardless of era. */
  z-index: 9999;
  padding: 14px 16px 14px;
  background: color-mix(in srgb, var(--surface) 88%, transparent 12%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  backdrop-filter: blur(18px) saturate(140%);
  color: var(--text-strong);
  border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
  border-radius: 12px;
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, white 10%, transparent),
    0 2px 6px rgba(0, 0, 0, 0.16),
    0 20px 48px rgba(0, 0, 0, 0.36);
  text-align: left;
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
  box-sizing: border-box;
}

.info-context {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--accent-text);
  margin-bottom: 6px;
}
.info-text {
  font-size: 13px;
  line-height: 1.55;
  margin: 0;
  padding: 0;
  color: var(--text-strong);
}
.info-more {
  display: block;
  margin-top: 12px;
  padding: 10px 0 0;
  width: 100%;
  text-align: left;
  background: none;
  border: 0;
  border-top: 1px solid var(--border);
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  color: var(--accent-text);
  cursor: pointer;
  letter-spacing: 0;
  transition: color 120ms ease;
}
.info-more:hover { color: var(--accent-hover); }

.info-pop-enter-active, .info-pop-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
}
.info-pop-enter-from, .info-pop-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}
</style>

<script setup lang="ts">
import { ref, onBeforeUnmount, watch } from 'vue';
import { openCodexEntry } from '../nav-state';

const props = defineProps<{
  factoid: string;
  codexLink?: string | null;
  /** Optional small label shown above the factoid — e.g., the tile's name */
  context?: string;
}>();

const open = ref(false);
const root = ref<HTMLElement | null>(null);

function toggle(e: Event) {
  e.stopPropagation();
  open.value = !open.value;
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

// Outside-click closes the popover. Only registered while open to avoid
// global listener noise. Pointerdown beats click for mobile responsiveness.
function onDocPointerDown(e: PointerEvent) {
  if (!root.value) return;
  if (!root.value.contains(e.target as Node)) close();
}
watch(open, isOpen => {
  if (isOpen) {
    document.addEventListener('pointerdown', onDocPointerDown);
  } else {
    document.removeEventListener('pointerdown', onDocPointerDown);
  }
});
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocPointerDown);
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

    <Transition name="info-pop">
      <div v-if="open" class="info-pop" role="dialog">
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
  /* margin-left auto isn't applied — caller positions the button. */
}
.info-btn:hover,
.info-btn.active {
  opacity: 1;
  background: var(--theme-surface, rgba(0, 0, 0, 0.08));
}

.info-pop {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 240px;
  max-width: min(320px, 86vw);
  z-index: 50;
  padding: 10px 12px 12px;
  background: var(--theme-surface, #ebe2c4);
  color: var(--theme-text, #2a2218);
  border: 1px solid var(--theme-border, #2a2218);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    4px 4px 0 0 var(--theme-border, #2a2218);
  text-align: left;
  font-family: var(--theme-font-body, -apple-system, sans-serif);
  /* arrow indicator */
}
.info-pop::before {
  content: '';
  position: absolute;
  top: -6px;
  right: 8px;
  width: 10px;
  height: 10px;
  background: var(--theme-surface, #ebe2c4);
  border-top: 1px solid var(--theme-border, #2a2218);
  border-left: 1px solid var(--theme-border, #2a2218);
  transform: rotate(45deg);
}

.info-context {
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  opacity: 0.65;
  margin-bottom: 4px;
}
.info-text {
  font-size: 12px;
  line-height: 1.5;
  margin: 0;
  padding: 0;
}
.info-more {
  display: block;
  margin-top: 8px;
  padding: 4px 0 0;
  width: 100%;
  text-align: left;
  background: none;
  border: 0;
  border-top: 1px dashed var(--theme-border, rgba(0,0,0,0.4));
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  color: var(--theme-accent, #2a2218);
  cursor: pointer;
  letter-spacing: 0.3px;
}
.info-more:hover { text-decoration: underline; }

.info-pop-enter-active, .info-pop-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
}
.info-pop-enter-from, .info-pop-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}
</style>

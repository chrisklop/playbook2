<script setup lang="ts">
import { computed } from 'vue';
import {
  state,
  nextHiddenGenerator,
  nextRevealProgress,
  showRevealPlaceholder,
  currentCopy,
} from '../state';
import { formatResource } from '../format';

const placeholderText = computed(
  () => currentCopy.value.reveal_placeholder_text ?? 'A new playbook tool stirs.',
);

// Lifetime rumor display rounds DOWN; threshold (target) is an exact integer so format raw.
const formatN = formatResource;
</script>

<template>
  <button v-if="showRevealPlaceholder && nextHiddenGenerator" class="placeholder" disabled>
    <div class="head">
      <div class="title">???</div>
    </div>
    <div class="desc">{{ placeholderText }}</div>
    <div class="bar">
      <div class="fill" :style="{ width: nextRevealProgress * 100 + '%' }"></div>
    </div>
    <div class="hint">
      {{ formatN(state.lifetimeRumor) }} / {{ formatN(nextHiddenGenerator.reveal_at_lifetime) }} lifetime Rumor
    </div>
  </button>
</template>

<style scoped>
.placeholder {
  display: block;
  width: 100%;
  margin: 0 0 8px 0;
  padding: 12px 14px;
  text-align: left;
  background: var(--theme-surface, #ebe2c4);
  border: 1px dashed var(--theme-border, #2a2218);
  font-family: inherit;
  color: var(--theme-text, #2a2218);
  opacity: 0.65;
  box-sizing: border-box;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.title {
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 4px;
}
.desc {
  font-size: 11px;
  opacity: 0.75;
  margin-top: 4px;
  font-style: italic;
  font-family: var(--theme-font-body, -apple-system, sans-serif);
}
.bar {
  margin: 6px 0 2px;
  width: 100%;
  height: 3px;
  background: rgba(42, 34, 24, 0.15);
  border: 1px solid var(--theme-border, #2a2218);
  box-sizing: border-box;
}
.fill {
  height: 100%;
  background: var(--theme-accent, #2a2218);
  transition: width 200ms ease-out;
}
.hint {
  font-size: 9px;
  opacity: 0.55;
  margin-top: 2px;
  font-style: italic;
}
</style>

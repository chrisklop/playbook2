<script setup lang="ts">
import { activeToasts, dismissToast } from '../toast-state';
</script>

<template>
  <div class="toast-stack" aria-live="polite">
    <TransitionGroup name="toast">
      <div
        v-for="toast in activeToasts"
        :key="toast.id"
        class="toast"
        :class="`era-${toast.era_id}`"
        role="status"
        @click="dismissToast(toast.id)"
      >
        {{ toast.message }}
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-stack {
  position: fixed;
  top: calc(var(--safe-top, 0px) + 8px);
  left: 0;
  right: 0;
  margin: 0;
  padding: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  pointer-events: none;
  z-index: 1000;
  box-sizing: border-box;
}
.toast {
  pointer-events: auto;
  margin: 0;
  padding: 10px 16px;
  width: calc(100% - 32px);
  max-width: 360px;
  box-sizing: border-box;
  background: var(--theme-surface, #ebe2c4);
  color: var(--theme-text, #2a2218);
  border: 1px solid var(--theme-border, #2a2218);
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-size: 12px;
  letter-spacing: 1px;
  text-transform: uppercase;
  text-align: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 200ms ease-out;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>

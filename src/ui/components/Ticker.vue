<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { currentTicker } from '../state';

const currentIndex = ref(0);
let interval: number | undefined;

const pickNext = () => {
  currentIndex.value = (currentIndex.value + 1) % currentTicker.value.quotes.length;
};

onMounted(() => {
  interval = window.setInterval(pickNext, currentTicker.value.interval_ms);
});
onUnmounted(() => {
  if (interval !== undefined) clearInterval(interval);
});
</script>

<template>
  <div class="ticker">{{ currentTicker.quotes[currentIndex].text }}</div>
</template>

<style scoped>
.ticker {
  margin: 0;
  padding: 6px 14px;
  width: 100%;
  box-sizing: border-box;
  font-size: 11px;
  background: var(--theme-surface, #ebe2c4);
  color: var(--theme-muted, #6b5a3d);
  border-bottom: 1px solid var(--theme-border, #2a2218);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
</style>

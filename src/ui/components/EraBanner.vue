<script setup lang="ts">
import { currentEra } from '../state';
</script>

<template>
  <div class="banner">
    <div class="era-name">{{ currentEra.display_name }}</div>
    <div class="era-date">{{ currentEra.date_range }}</div>
  </div>
</template>

<style scoped>
.banner {
  margin: 0;
  padding: 10px 16px;
  width: 100%;
  box-sizing: border-box;
  background: var(--theme-surface, #ebe2c4);
  border-bottom: 1px solid var(--theme-border, #2a2218);
  color: var(--theme-text, #2a2218);
}
.era-name {
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
}
.era-date {
  font-size: 10px;
  opacity: 0.6;
  margin-top: 2px;
  color: var(--theme-muted, #6b5a3d);
}
</style>

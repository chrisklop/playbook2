<script setup lang="ts">
import { currentCopy } from '../state';
</script>

<template>
  <header class="masthead">
    <h1 class="title">{{ currentCopy.masthead_title }}</h1>
    <p class="subtitle">{{ currentCopy.masthead_subtitle }}</p>
  </header>
</template>

<style scoped>
.masthead {
  margin: 0;
  padding: 12px 16px 8px;
  width: 100%;
  box-sizing: border-box;
  text-align: center;
  border-bottom: 2px solid var(--theme-border, #2a2218);
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  background: var(--theme-background, #f2ecd9);
  color: var(--theme-text, #2a2218);
}
.title { font-size: 18px; font-weight: 900; letter-spacing: 4px; margin: 0; }
.subtitle { font-size: 9px; letter-spacing: 3px; margin: 4px 0 0; opacity: 0.7; }
</style>

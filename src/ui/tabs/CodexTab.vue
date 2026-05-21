<script setup lang="ts">
import CodexList from '../components/CodexList.vue';
import CodexEntryView from '../components/CodexEntryView.vue';
import { codexState } from '../codex-state';
</script>

<template>
  <div class="codex-tab">
    <h2 v-if="!codexState.selectedId" class="header">Codex</h2>
    <CodexEntryView v-if="codexState.selectedId" />
    <CodexList v-else />
  </div>
</template>

<style scoped>
.codex-tab {
  margin: 0;
  padding: 0 0 80px 0;
  width: 100%;
  box-sizing: border-box;
}
.header {
  margin: 0;
  padding: 14px 16px;
  width: 100%;
  box-sizing: border-box;
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 3px;
  border-bottom: 1px solid var(--theme-border, #2a2218);
  color: var(--theme-text, #2a2218);
  background: var(--theme-background, #f2ecd9);
}
</style>

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
  background: var(--bg);
  min-height: 100%;
}
.header {
  margin: 0;
  padding: 18px 18px;
  width: 100%;
  box-sizing: border-box;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.01em;
  border-bottom: 1px solid var(--border);
  color: var(--text-strong);
  background: var(--bg);
}
</style>

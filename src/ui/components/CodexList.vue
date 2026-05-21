<script setup lang="ts">
import { visibleEntries, codexState } from '../codex-state';
</script>

<template>
  <ul class="codex-list">
    <li
      v-for="e in visibleEntries"
      :key="e.frontmatter.id"
      class="entry-link"
      @click="codexState.selectedId = e.frontmatter.id"
    >
      <div class="title">{{ e.frontmatter.title }}</div>
      <div class="tags">
        <span v-for="t in e.frontmatter.techniques" :key="t" class="tag">{{ t }}</span>
      </div>
    </li>
    <li v-if="visibleEntries.length === 0" class="empty">
      No codex entries unlocked yet. Play more to discover the playbook.
    </li>
  </ul>
</template>

<style scoped>
.codex-list {
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
  box-sizing: border-box;
}
.entry-link {
  margin: 0;
  padding: 14px 16px;
  width: 100%;
  box-sizing: border-box;
  border-bottom: 1px solid var(--theme-border, #2a2218);
  cursor: pointer;
  color: var(--theme-text, #2a2218);
  background: var(--theme-background, #f2ecd9);
}
.entry-link:active { background: var(--theme-surface, #ebe2c4); }
.title {
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-weight: 700;
  font-size: 14px;
}
.tags {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}
.tag {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.6;
}
.empty {
  margin: 0;
  padding: 24px 16px;
  width: 100%;
  box-sizing: border-box;
  font-style: italic;
  opacity: 0.6;
  font-size: 13px;
  color: var(--theme-muted, #6b5a3d);
}
</style>

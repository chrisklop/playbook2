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
  padding: 12px;
  width: 100%;
  box-sizing: border-box;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.entry-link {
  margin: 0;
  padding: 14px 16px;
  width: 100%;
  box-sizing: border-box;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  color: var(--text-strong);
  transition: background 120ms ease, border-color 120ms ease, transform 100ms ease;
}
.entry-link:hover {
  background: var(--surface-2);
  border-color: var(--border-2);
}
.entry-link:active {
  background: var(--surface-3);
  transform: translateY(1px);
}
.title {
  font-weight: 600;
  font-size: 15px;
  letter-spacing: -0.005em;
  color: var(--text-strong);
}
.tags {
  display: flex;
  gap: 6px;
  margin-top: 6px;
  flex-wrap: wrap;
}
.tag {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--accent-text);
  background: var(--accent-bg);
  border: 1px solid color-mix(in srgb, var(--accent-border) 40%, transparent);
  padding: 2px 6px;
  border-radius: 4px;
}
.empty {
  margin: 12px;
  padding: 24px 16px;
  width: calc(100% - 24px);
  box-sizing: border-box;
  background: var(--surface);
  border: 1px dashed var(--border);
  border-radius: 10px;
  font-style: italic;
  font-size: 13px;
  color: var(--text-muted);
  text-align: center;
}
</style>

<script setup lang="ts">
import { visibleEntries, codexState } from '../codex-state';
import { state } from '../state';
import { Check } from '@lucide/vue';

function isMastered(id: string): boolean {
  return state.codexMastered.has(id);
}
</script>

<template>
  <ul class="codex-list">
    <li
      v-for="e in visibleEntries"
      :key="e.frontmatter.id"
      class="entry-link"
      :class="{ mastered: isMastered(e.frontmatter.id) }"
      @click="codexState.selectedId = e.frontmatter.id"
    >
      <div class="row-head">
        <div class="title">{{ e.frontmatter.title }}</div>
        <span v-if="isMastered(e.frontmatter.id)" class="badge mastered-badge">
          <Check :stroke-width="3" class="badge-icon" /> Mastered
        </span>
        <span v-else class="badge unread-badge">New</span>
      </div>
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
/* Override Profectus' global * { margin: auto } which inside a flex
   container spreads children to the edges. Tags and badges must stay
   left-grouped with their natural width. */
.row-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
}
.title {
  margin: 0;
  flex: 1;
  font-weight: 600;
  font-size: 15px;
  letter-spacing: -0.005em;
  color: var(--text-strong);
  text-align: left;
}
.badge {
  margin: 0;
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 3px 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
.mastered-badge {
  background: color-mix(in srgb, var(--accent-solid) 18%, transparent);
  color: var(--accent-text);
  border: 1px solid color-mix(in srgb, var(--accent-border) 60%, transparent);
}
.unread-badge {
  background: var(--surface-3);
  color: var(--text-muted);
  border: 1px solid var(--border);
}
.badge-icon {
  width: 11px;
  height: 11px;
}
.tags {
  margin: 6px 0 0;
  display: flex;
  justify-content: flex-start;
  gap: 6px;
  flex-wrap: wrap;
}
.tag {
  margin: 0;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--accent-text);
  background: var(--accent-bg);
  border: 1px solid color-mix(in srgb, var(--accent-border) 40%, transparent);
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
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

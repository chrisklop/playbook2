<script setup lang="ts">
import { computed } from 'vue';
import { marked } from 'marked';
import { selectedEntry, codexState } from '../codex-state';

const html = computed(() => selectedEntry.value ? marked.parse(selectedEntry.value.body) as string : '');
</script>

<template>
  <article v-if="selectedEntry" class="entry">
    <button class="back" @click="codexState.selectedId = null">← Back</button>
    <h2>{{ selectedEntry.frontmatter.title }}</h2>
    <div class="body" v-html="html"></div>
    <h3>Sources</h3>
    <ul class="sources">
      <li v-for="s in selectedEntry.frontmatter.sources" :key="s.url">
        <a :href="s.url" target="_blank" rel="noopener">{{ s.label }}</a>
      </li>
    </ul>
  </article>
</template>

<style scoped>
.entry {
  margin: 0;
  padding: 14px 16px;
  width: 100%;
  box-sizing: border-box;
  color: var(--theme-text, #2a2218);
  font-family: var(--theme-font-body, -apple-system, sans-serif);
}
.back {
  background: none;
  border: 0;
  margin: 0;
  padding: 8px 0;
  color: var(--theme-muted, #6b5a3d);
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
}
h2 {
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-size: 18px;
  margin: 8px 0 12px;
  padding: 0;
}
.body {
  font-size: 14px;
  line-height: 1.55;
  margin: 0;
}
.body :deep(p) { margin: 0 0 12px; padding: 0; }
.body :deep(em) { font-style: italic; }
.body :deep(strong) { font-weight: 700; }
h3 {
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 24px 0 8px;
  padding: 0;
  opacity: 0.7;
}
.sources {
  list-style: none;
  margin: 0;
  padding: 0;
}
.sources li {
  margin: 0 0 6px 0;
  padding: 0;
  font-size: 12px;
}
.sources a {
  color: var(--theme-accent, #2a2218);
  text-decoration: underline;
}
</style>

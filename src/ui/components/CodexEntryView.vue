<script setup lang="ts">
import { computed } from 'vue';
import { marked } from 'marked';
import { selectedEntry, codexState } from '../codex-state';
import { state, claimCodexMastery } from '../state';
import { PER_LEVEL_BONUS } from '../../game/mastery';

const html = computed(() => selectedEntry.value ? marked.parse(selectedEntry.value.body) as string : '');

const entryId = computed(() => selectedEntry.value?.frontmatter.id ?? '');
const techniques = computed<string[]>(() => selectedEntry.value?.frontmatter.techniques ?? []);
const alreadyMastered = computed(() => state.codexMastered.has(entryId.value));

const bonusPctPerTechnique = Math.round(PER_LEVEL_BONUS * 100);

function master() {
  claimCodexMastery(entryId.value, techniques.value);
}
</script>

<template>
  <article v-if="selectedEntry" class="entry">
    <button class="btn-riso btn-riso-sm btn-riso-secondary back" @click="codexState.selectedId = null">← Back</button>
    <h2>{{ selectedEntry.frontmatter.title }}</h2>
    <div class="body" v-html="html"></div>
    <h3>Sources</h3>
    <ul class="sources">
      <li v-for="s in selectedEntry.frontmatter.sources" :key="s.url">
        <a :href="s.url" target="_blank" rel="noopener">{{ s.label }}</a>
      </li>
    </ul>

    <!-- Master This — one-time reward for reading the entry. Each technique
         tag levels up by 1; permanent +5% production multiplier per level. -->
    <div v-if="techniques.length > 0" class="mastery-block">
      <h3>Mastery</h3>
      <p class="mastery-explain">
        This entry teaches:
        <span v-for="(t, i) in techniques" :key="t">
          <strong>{{ t }}</strong><span v-if="i < techniques.length - 1">, </span>
        </span>.
        Mastering it grants <strong>+{{ bonusPctPerTechnique }}% permanent production</strong>
        to every generator in every era that uses
        {{ techniques.length === 1 ? 'this technique' : 'any of these techniques' }}.
        Persists across prestige.
      </p>
      <button
        type="button"
        class="btn-riso master-btn"
        :class="{ disabled: alreadyMastered }"
        :disabled="alreadyMastered"
        @click="master"
      >
        <template v-if="alreadyMastered">✓ MASTERED</template>
        <template v-else>MASTER THIS</template>
      </button>
    </div>
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
.mastery-block {
  margin-top: 26px;
  padding: 14px 0 0;
  border-top: 1px solid var(--theme-border, #2a2218);
}
.mastery-explain {
  font-size: 13px;
  line-height: 1.5;
  margin: 0 0 12px;
  padding: 0;
  font-style: italic;
  opacity: 0.9;
}
.mastery-explain strong {
  font-style: normal;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.master-btn {
  width: 100%;
  padding: 12px 16px;
  font-size: 13px;
  letter-spacing: 2px;
}
</style>

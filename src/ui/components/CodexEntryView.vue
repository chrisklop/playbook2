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

    <!-- Mastery sits right under the body so the reward button is visible
         without scrolling past the citations list. Sources move below. -->
    <div v-if="techniques.length > 0" class="mastery-block">
      <p class="mastery-explain">
        Teaches:
        <span v-for="(t, i) in techniques" :key="t">
          <strong>{{ t }}</strong><span v-if="i < techniques.length - 1">, </span>
        </span>.
        Mastering grants <strong>+{{ bonusPctPerTechnique }}%</strong> permanent production
        to every generator using
        {{ techniques.length === 1 ? 'it' : 'any of these' }} (persists across prestige).
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
  padding: 10px 14px;
  width: 100%;
  box-sizing: border-box;
  color: var(--theme-text, #2a2218);
  font-family: var(--theme-font-body, -apple-system, sans-serif);
}
.back {
  background: none;
  border: 0;
  margin: 0 0 4px;
  padding: 6px 0;
  color: var(--theme-muted, #6b5a3d);
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
}
h2 {
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-size: 16px;
  margin: 4px 0 8px;
  padding: 0;
  line-height: 1.25;
}
.body {
  font-size: 13px;
  line-height: 1.5;
  margin: 0;
}
.body :deep(p) { margin: 0 0 8px; padding: 0; }
.body :deep(em) { font-style: italic; }
.body :deep(strong) { font-weight: 700; }
h3 {
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 14px 0 6px;
  padding: 0;
  opacity: 0.65;
}
.sources {
  list-style: none;
  margin: 0;
  padding: 0;
}
.sources li {
  margin: 0 0 4px 0;
  padding: 0;
  font-size: 11px;
  line-height: 1.4;
}
.sources a {
  color: var(--theme-accent, #2a2218);
  text-decoration: underline;
}
.mastery-block {
  margin-top: 12px;
  padding: 10px 0 4px;
  border-top: 1px solid rgba(0,0,0,0.18);
}
.mastery-explain {
  font-size: 12px;
  line-height: 1.45;
  margin: 0 0 8px;
  padding: 0;
  font-style: italic;
  opacity: 0.85;
}
.mastery-explain strong {
  font-style: normal;
  font-weight: 700;
  color: #2a6b35;
}
.master-btn {
  width: 100%;
  padding: 9px 14px;
  font-size: 12px;
  letter-spacing: 1.5px;
}
</style>

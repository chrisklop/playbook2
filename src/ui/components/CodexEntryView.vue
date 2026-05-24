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
/* Codex is a read-heavy surface — opts fully into chrome neutrals so
   the per-era loud palettes never make the text unreadable. */
.entry {
  margin: 0;
  padding: 18px 18px 28px;
  width: 100%;
  box-sizing: border-box;
  background: var(--bg);
  color: var(--text-strong);
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
}
.back {
  /* Profectus' global * { margin: auto } horizontally centres any block
     element. Explicit margin-right: auto + display: block left-pins the
     back arrow regardless of that cascade. */
  display: block;
  background: transparent;
  border: 0;
  margin: 0 auto 12px 0;
  padding: 6px 0;
  color: var(--text-muted);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: color 120ms ease;
}
.back:hover { color: var(--text-strong); }
h2 {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 4px 0 14px;
  padding: 0;
  line-height: 1.25;
  color: var(--text-strong);
}
.body {
  font-size: 15px;
  line-height: 1.65;
  margin: 0;
  color: var(--text-strong);
}
.body :deep(p) { margin: 0 0 14px; padding: 0; }
.body :deep(em) { font-style: italic; color: var(--text-muted); }
.body :deep(strong) { font-weight: 700; color: var(--text-strong); }
h3 {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 22px 0 10px;
  padding: 0;
  color: var(--text-muted);
}
.sources {
  list-style: none;
  margin: 0;
  padding: 0;
}
.sources li {
  margin: 0 0 6px 0;
  padding: 0;
  font-size: 13px;
  line-height: 1.45;
}
.sources a {
  color: var(--accent-text);
  text-decoration: none;
  border-bottom: 1px solid color-mix(in srgb, var(--accent-text) 40%, transparent);
  transition: border-color 120ms ease, color 120ms ease;
}
.sources a:hover {
  color: var(--accent-hover);
  border-bottom-color: var(--accent-hover);
}
.mastery-block {
  margin-top: 18px;
  padding: 14px 14px 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
}
.mastery-explain {
  font-size: 13px;
  line-height: 1.55;
  margin: 0 0 12px;
  padding: 0;
  color: var(--text-muted);
}
.mastery-explain strong {
  font-weight: 700;
  color: var(--text-strong);
}
.master-btn {
  width: 100%;
  padding: 11px 14px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
  background: var(--accent-solid);
  color: var(--accent-contrast);
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  transition: background 120ms ease, transform 100ms ease;
}
.master-btn:hover:not(:disabled) { background: var(--accent-hover); }
.master-btn:active { transform: translateY(1px); }
.master-btn:disabled {
  background: var(--surface-2);
  color: var(--text-faint);
  cursor: default;
}
</style>

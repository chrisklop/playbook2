<script setup lang="ts">
import { computed } from 'vue';
import TechniqueBranch from '../components/TechniqueBranch.vue';
import { ALL_TECHNIQUES, type TechniqueId } from '../../content/types';
import { currentEra } from '../state';
import type { GeneratorTier } from '../../content/schema';

const generatorsByTechnique = computed(() => {
  const map: Record<TechniqueId, GeneratorTier[]> = {
    impersonation: [], emotion: [], polarization: [],
    conspiracy: [], discrediting: [], trolling: [],
  };
  for (const gen of currentEra.generators) {
    map[gen.technique_tag].push(gen);
  }
  return map;
});
</script>

<template>
  <div class="tree-tab">
    <h2 class="header">The Six Techniques</h2>
    <TechniqueBranch
      v-for="t in ALL_TECHNIQUES"
      :key="t"
      :technique="t"
      :generators="generatorsByTechnique[t]"
      :unlocked="currentEra.techniques_unlocked.includes(t)"
    />
    <p class="footnote">
      Technique taxonomy adapted from Roozenbeek &amp; van der Linden's <em>Bad News</em> research (Cambridge / DROG).
    </p>
  </div>
</template>

<style scoped>
.tree-tab {
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
.footnote {
  font-size: 10px;
  opacity: 0.5;
  margin: 0;
  padding: 16px;
  width: 100%;
  box-sizing: border-box;
  line-height: 1.5;
  font-style: italic;
  color: var(--theme-muted, #6b5a3d);
}
</style>

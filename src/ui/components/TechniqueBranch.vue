<script setup lang="ts">
import { state } from '../state';
import type { GeneratorTier, TechniqueId } from '../../content/schema';

defineProps<{
  technique: TechniqueId;
  generators: GeneratorTier[];
  unlocked: boolean;
}>();

const TECHNIQUE_LABELS: Record<TechniqueId, string> = {
  impersonation: 'Impersonation',
  emotion: 'Emotion',
  polarization: 'Polarization',
  conspiracy: 'Conspiracy',
  discrediting: 'Discrediting',
  trolling: 'Trolling',
};
</script>

<template>
  <section class="branch" :class="{ locked: !unlocked }">
    <header class="branch-header">
      <h3>{{ TECHNIQUE_LABELS[technique] }}</h3>
      <span v-if="!unlocked" class="lock">Locked</span>
    </header>
    <div v-if="unlocked && generators.length > 0" class="gens">
      <div v-for="gen in generators" :key="gen.id" class="gen">
        <span class="gen-name">{{ gen.display_name }}</span>
        <span class="gen-owned">×{{ state.ownedByGenerator[gen.id] ?? 0 }}</span>
      </div>
    </div>
    <p v-else-if="unlocked" class="empty">No generators in this era.</p>
    <p v-else class="empty">Unlocks in a later era.</p>
  </section>
</template>

<style scoped>
.branch {
  margin: 0;
  padding: 14px 16px;
  width: 100%;
  box-sizing: border-box;
  border-bottom: 1px solid var(--theme-border, #2a2218);
  background: var(--theme-background, #f2ecd9);
  color: var(--theme-text, #2a2218);
}
.branch.locked { opacity: 0.45; }
.branch-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin: 0;
  padding: 0;
  width: 100%;
  box-sizing: border-box;
}
h3 {
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 0;
  padding: 0;
}
.lock {
  font-size: 10px;
  opacity: 0.6;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--theme-muted, #6b5a3d);
}
.gens {
  margin: 8px 0 0 0;
  padding: 0;
  width: 100%;
  box-sizing: border-box;
}
.gen {
  display: flex;
  justify-content: space-between;
  margin: 0;
  padding: 4px 0;
  font-size: 12px;
  width: 100%;
  box-sizing: border-box;
}
.gen-name {
  font-family: var(--theme-font-body, -apple-system, sans-serif);
}
.gen-owned {
  font-weight: 700;
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
}
.empty {
  font-size: 11px;
  font-style: italic;
  opacity: 0.6;
  margin: 8px 0 0 0;
  padding: 0;
  color: var(--theme-muted, #6b5a3d);
}
</style>

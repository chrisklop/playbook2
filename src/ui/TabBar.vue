<script setup lang="ts">
defineProps<{ activeTab: 'play' | 'tree' | 'codex' | 'more' }>();
const emit = defineEmits<{ (e: 'navigate', tab: 'play' | 'tree' | 'codex' | 'more'): void }>();

const tabs = [
  { id: 'play' as const, label: 'Play' },
  { id: 'tree' as const, label: 'Tree' },
  { id: 'codex' as const, label: 'Codex' },
  { id: 'more' as const, label: 'More' },
];
</script>

<template>
  <nav class="tabbar">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="tab"
      :class="{ active: activeTab === tab.id }"
      @click="emit('navigate', tab.id)"
    >
      <span class="tab-label">{{ tab.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.tabbar {
  display: flex;
  width: 100%;
  height: 60px;
  margin: 0;
  padding: 0;
  padding-bottom: var(--safe-bottom);
  background: var(--theme-surface, #1a1a1a);
  border-top: 1px solid var(--theme-border, #2f2f2f);
  box-sizing: border-box;
}
.tab {
  flex: 1;
  background: none;
  border: 0;
  color: var(--theme-muted, #8e8e93);
  font-family: inherit;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
  padding: 8px 0 12px;
  cursor: pointer;
}
.tab.active { color: var(--theme-text, #ececec); }
.tab-label { display: block; }
</style>

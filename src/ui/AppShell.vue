<script setup lang="ts">
import { ref } from 'vue';
import TabBar from './TabBar.vue';
import PlayTab from './tabs/PlayTab.vue';
import TreeTab from './tabs/TreeTab.vue';
import CodexTab from './tabs/CodexTab.vue';
import MoreTab from './tabs/MoreTab.vue';

const activeTab = ref<'play' | 'tree' | 'codex' | 'more'>('play');
</script>

<template>
  <div class="app-shell">
    <main class="content">
      <PlayTab v-if="activeTab === 'play'" />
      <TreeTab v-else-if="activeTab === 'tree'" />
      <CodexTab v-else-if="activeTab === 'codex'" />
      <MoreTab v-else-if="activeTab === 'more'" />
    </main>
    <TabBar :active-tab="activeTab" @navigate="activeTab = $event" />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  padding-top: var(--safe-top);
  background: var(--theme-background, #000);
}
.content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>

<script setup lang="ts">
import { ref } from 'vue';
import TabBar from './TabBar.vue';
import PlayTab from './tabs/PlayTab.vue';
import TreeTab from './tabs/TreeTab.vue';
import CodexTab from './tabs/CodexTab.vue';
import MoreTab from './tabs/MoreTab.vue';
import ToastStack from './components/ToastStack.vue';
import AudioControls from './components/AudioControls.vue';

const activeTab = ref<'play' | 'tree' | 'codex' | 'more'>('play');
</script>

<template>
  <div class="app-shell">
    <ToastStack />
    <AudioControls />
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
  width: 100%;
  height: 100dvh;
  margin: 0;
  padding-top: var(--safe-top);
  background: var(--theme-background, #000);
  /* Reset Profectus global child-margin */
  box-sizing: border-box;
}
.content {
  flex: 1;
  width: 100%;
  margin: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>

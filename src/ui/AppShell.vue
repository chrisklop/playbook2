<script setup lang="ts">
import TabBar from './TabBar.vue';
import PlayTab from './tabs/PlayTab.vue';
import TreeTab from './tabs/TreeTab.vue';
import CodexTab from './tabs/CodexTab.vue';
import MoreTab from './tabs/MoreTab.vue';
import ToastStack from './components/ToastStack.vue';
import AudioControls from './components/AudioControls.vue';
import EraTransitionOverlay from './components/EraTransitionOverlay.vue';
import PowerUpDock from './components/PowerUpDock.vue';
import TimeWarpOverlay from './components/TimeWarpOverlay.vue';
import BoostMinigame from './components/BoostMinigame.vue';
import { activeTab } from './nav-state';
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
    <!-- Cinematic prestige overlay — fixed-position above everything,
         driven by state.eraTransition. Inert when no transition is active. -->
    <EraTransitionOverlay />
    <!-- Power-up FAB + panel. Floats above tab bar; only shown when warps
         are available. Triggers TimeWarpOverlay on USE. -->
    <PowerUpDock />
    <TimeWarpOverlay />
    <!-- Era-7 boost timing minigame (proof of concept). Only renders
         markup when state.activeMinigame is set, so it's inert outside
         the minigame moment regardless of which era you're in. -->
    <BoostMinigame />
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

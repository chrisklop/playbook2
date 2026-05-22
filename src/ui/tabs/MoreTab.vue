<script setup lang="ts">
import { ref, computed } from 'vue';
import TransparencyPage from '../components/TransparencyPage.vue';
import AboutPage from '../components/AboutPage.vue';
import SettingsPage from '../components/SettingsPage.vue';
import PrestigePage from '../components/PrestigePage.vue';
import { canPrestige } from '../state';

const page = ref<null | 'transparency' | 'about' | 'settings' | 'prestige'>(null);

const ITEMS = computed(() => [
  { id: 'prestige' as const, label: 'Prestige & Ascension', ready: canPrestige.value },
  { id: 'transparency' as const, label: 'How this game works', ready: false },
  { id: 'about' as const, label: 'About & Credits', ready: false },
  { id: 'settings' as const, label: 'Settings', ready: false },
]);
</script>

<template>
  <div class="more">
    <button v-if="page" class="btn-riso btn-riso-sm btn-riso-secondary back" @click="page = null">← Back</button>
    <TransparencyPage v-if="page === 'transparency'" />
    <AboutPage v-else-if="page === 'about'" />
    <SettingsPage v-else-if="page === 'settings'" />
    <PrestigePage v-else-if="page === 'prestige'" />
    <ul v-else class="menu">
      <li v-for="i in ITEMS" :key="i.id" class="menu-item" :class="{ ready: i.ready }" @click="page = i.id">
        <span>{{ i.label }}</span>
        <span v-if="i.ready" class="ready-pill">READY</span>
        <span class="chev">›</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.more {
  margin: 0;
  padding: 0 0 80px 0;
  width: 100%;
  box-sizing: border-box;
  background: var(--theme-background, #f2ecd9);
  color: var(--theme-text, #2a2218);
}
.back {
  background: none;
  border: 0;
  margin: 0;
  padding: 12px 16px;
  width: 100%;
  text-align: left;
  box-sizing: border-box;
  color: var(--theme-muted, #6b5a3d);
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
}
.menu {
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
  box-sizing: border-box;
}
.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0;
  padding: 16px;
  width: 100%;
  box-sizing: border-box;
  border-bottom: 1px solid var(--theme-border, #2a2218);
  font-size: 14px;
  cursor: pointer;
  font-family: var(--theme-font-body, -apple-system, sans-serif);
  color: var(--theme-text, #2a2218);
}
.chev {
  opacity: 0.4;
  font-size: 18px;
}
.menu-item.ready {
  background: linear-gradient(180deg, rgba(232, 142, 56, 0.25), rgba(214, 120, 48, 0.4));
  animation: ready-pulse 1.6s ease-in-out infinite;
}
@keyframes ready-pulse {
  0%, 100% { filter: brightness(1); }
  50%      { filter: brightness(1.1); }
}
.ready-pill {
  margin-left: auto;
  margin-right: 8px;
  padding: 2px 7px;
  background: #b3261e;
  color: #fff;
  font-family: var(--riso-font, 'IBM Plex Mono', monospace);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1px;
  border: 1.5px solid #1a1a1a;
  box-shadow: 2px 2px 0 0 #f4d000;
}
</style>

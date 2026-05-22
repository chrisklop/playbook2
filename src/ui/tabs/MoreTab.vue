<script setup lang="ts">
import { ref } from 'vue';
import TransparencyPage from '../components/TransparencyPage.vue';
import AboutPage from '../components/AboutPage.vue';
import SettingsPage from '../components/SettingsPage.vue';

const page = ref<null | 'transparency' | 'about' | 'settings'>(null);

const ITEMS = [
  { id: 'transparency' as const, label: 'How this game works' },
  { id: 'about' as const, label: 'About & Credits' },
  { id: 'settings' as const, label: 'Settings' },
];
</script>

<template>
  <div class="more">
    <button v-if="page" class="btn-riso btn-riso-sm btn-riso-secondary back" @click="page = null">← Back</button>
    <TransparencyPage v-if="page === 'transparency'" />
    <AboutPage v-else-if="page === 'about'" />
    <SettingsPage v-else-if="page === 'settings'" />
    <ul v-else class="menu">
      <li v-for="i in ITEMS" :key="i.id" class="menu-item" @click="page = i.id">
        <span>{{ i.label }}</span>
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
</style>

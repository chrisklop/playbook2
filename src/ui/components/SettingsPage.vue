<script setup lang="ts">
import { computed, ref } from 'vue';
import { writeLocalSave, serializeSave, deserializeSave } from '../../game/save';
import { snapshotSave, state, currentEra } from '../state';
import { formatResource } from '../format';

const exportText = ref('');
const importText = ref('');
const message = ref('');

const totalPrestiges = computed(() => state.prestigeCount);
const memeticInheritance = computed(() => state.memeticInheritance.toFixed(2));
const eraName = computed(() => currentEra.value.display_name);
const lifetimeRumorDisplay = computed(() => formatResource(state.lifetimeRumor));

function doExport() {
  exportText.value = serializeSave(snapshotSave());
  message.value = 'Exported. Copy the string above to back up your save.';
}

function doImport() {
  try {
    const restored = deserializeSave(importText.value.trim());
    writeLocalSave(restored);
    location.reload();
  } catch (err) {
    message.value = 'Import failed: ' + (err as Error).message;
  }
}

function hardReset() {
  if (!confirm('Permanently erase your save? This cannot be undone.')) return;
  if (!confirm('Are you absolutely sure? This will reset everything.')) return;
  // Sentinel flag prevents the visibilitychange autosave from racing the
  // reload and re-writing in-memory state back into localStorage. State.ts
  // clears the sentinel on next boot.
  localStorage.setItem('playbook.hard-reset', '1');
  localStorage.removeItem('playbook.save');
  location.reload();
}
</script>

<template>
  <article class="page">
    <h2>Settings</h2>

    <section class="settings-section">
      <h3>Audio</h3>
      <label class="toggle-row">
        <input type="checkbox" :checked="state.audioMuted" @change="(e) => state.audioMuted = (e.target as HTMLInputElement).checked">
        <span>Mute sound effects (clicks, chimes, milestones)</span>
      </label>
      <label class="toggle-row">
        <input type="checkbox" :checked="state.musicMuted" @change="(e) => state.musicMuted = (e.target as HTMLInputElement).checked">
        <span>Mute background music</span>
      </label>
      <div class="slider-row" :class="{ disabled: state.musicMuted }">
        <label for="music-volume">Music volume</label>
        <input
          id="music-volume"
          type="range"
          min="0"
          max="100"
          step="1"
          :value="Math.round(state.musicVolume * 100)"
          :disabled="state.musicMuted"
          @input="(e) => state.musicVolume = Number((e.target as HTMLInputElement).value) / 100"
        >
        <span class="slider-value">{{ Math.round(state.musicVolume * 100) }}%</span>
      </div>
    </section>

    <section class="settings-section">
      <h3>Hints</h3>
      <label class="toggle-row">
        <input type="checkbox" v-model="state.showBestBuyHint">
        <span>Show best-buy recommendation</span>
      </label>
    </section>

    <section class="settings-section">
      <h3>Stats</h3>
      <dl class="stats">
        <dt>Total prestiges</dt><dd>{{ totalPrestiges }}</dd>
        <dt>Memetic Inheritance</dt><dd>{{ memeticInheritance }}</dd>
        <dt>Current era</dt><dd>{{ eraName }}</dd>
        <dt>Lifetime Rumor (era)</dt><dd>{{ lifetimeRumorDisplay }}</dd>
      </dl>
    </section>

    <section class="settings-section">
      <h3>Export save</h3>
      <p>Copy this string to back up your progress externally.</p>
      <button class="btn-riso btn-riso-sm btn-riso-secondary" @click="doExport">Generate export string</button>
      <textarea v-if="exportText" readonly :value="exportText" rows="4"></textarea>
    </section>

    <section class="settings-section">
      <h3>Import save</h3>
      <p>Paste an exported string to restore.</p>
      <textarea v-model="importText" rows="4" placeholder="paste save string here…"></textarea>
      <button class="btn-riso btn-riso-sm" :disabled="!importText.trim()" @click="doImport">Import</button>
    </section>

    <section class="settings-section">
      <h3>Hard reset</h3>
      <p>Erase all progress. Two confirmations required.</p>
      <button class="btn-riso btn-riso-sm btn-riso-upgrade" @click="hardReset">Hard reset</button>
    </section>

    <p v-if="message" class="message">{{ message }}</p>
  </article>
</template>

<style scoped>
.page {
  margin: 0;
  padding: 16px;
  width: 100%;
  box-sizing: border-box;
  color: var(--theme-text, #2a2218);
  font-family: var(--theme-font-body, -apple-system, sans-serif);
  font-size: 13px;
  line-height: 1.5;
}
.page h2 {
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-size: 18px;
  margin: 8px 0 20px;
  padding: 0;
}
.settings-section {
  margin: 0 0 24px;
  padding: 0;
  width: 100%;
  box-sizing: border-box;
}
.page h3 {
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 0 0 6px;
  padding: 0;
  opacity: 0.7;
}
.page p {
  margin: 0 0 8px;
  padding: 0;
}
button { margin-top: 8px; }
textarea {
  display: block;
  width: 100%;
  margin-top: 8px;
  padding: 8px;
  background: var(--theme-surface, #ebe2c4);
  color: var(--theme-text, #2a2218);
  border: 1px solid var(--theme-border, #2a2218);
  font-family: monospace;
  font-size: 11px;
  box-sizing: border-box;
  resize: vertical;
}
.message {
  font-style: italic;
  opacity: 0.7;
  margin-top: 16px;
}
.toggle-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--theme-font-body, -apple-system, sans-serif);
  font-size: 13px;
  cursor: pointer;
}
.toggle-row input[type="checkbox"] {
  width: 18px;
  height: 18px;
  margin: 0;
}
.slider-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  font-family: var(--theme-font-body, -apple-system, sans-serif);
  font-size: 13px;
}
.slider-row label {
  flex-shrink: 0;
  opacity: 0.85;
}
.slider-row input[type="range"] {
  flex: 1;
  margin: 0;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--theme-border, #1a1a1a);
  outline: none;
  cursor: pointer;
}
.slider-row input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 0;
  background: var(--theme-accent, #d3211c);
  border: 1.5px solid var(--theme-border, #1a1a1a);
  cursor: pointer;
}
.slider-row input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 0;
  background: var(--theme-accent, #d3211c);
  border: 1.5px solid var(--theme-border, #1a1a1a);
  cursor: pointer;
}
.slider-row.disabled { opacity: 0.4; }
.slider-row .slider-value {
  font-family: var(--riso-font, 'IBM Plex Mono', monospace);
  font-weight: 700;
  font-size: 12px;
  min-width: 36px;
  text-align: right;
}
.stats {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 4px 12px;
  margin: 0;
  font-family: var(--theme-font-body, -apple-system, sans-serif);
  font-size: 13px;
}
.stats dt { font-style: italic; opacity: 0.7; }
.stats dd { margin: 0; font-family: var(--theme-font-masthead, -apple-system, sans-serif); font-weight: 700; }
</style>

<script setup lang="ts">
import { ref } from 'vue';
import { writeLocalSave, serializeSave, deserializeSave } from '../../game/save';
import { snapshotSave } from '../state';

const exportText = ref('');
const importText = ref('');
const message = ref('');

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
  localStorage.removeItem('playbook.save');
  location.reload();
}
</script>

<template>
  <article class="page">
    <h2>Settings</h2>

    <section class="settings-section">
      <h3>Export save</h3>
      <p>Copy this string to back up your progress externally.</p>
      <button @click="doExport">Generate export string</button>
      <textarea v-if="exportText" readonly :value="exportText" rows="4"></textarea>
    </section>

    <section class="settings-section">
      <h3>Import save</h3>
      <p>Paste an exported string to restore.</p>
      <textarea v-model="importText" rows="4" placeholder="paste save string here…"></textarea>
      <button :disabled="!importText.trim()" @click="doImport">Import</button>
    </section>

    <section class="settings-section">
      <h3>Hard reset</h3>
      <p>Erase all progress. Two confirmations required.</p>
      <button class="danger" @click="hardReset">Hard reset</button>
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
button {
  margin-top: 8px;
  padding: 10px 16px;
  background: var(--theme-accent, #2a2218);
  color: var(--theme-background, #f2ecd9);
  border: 0;
  font-family: inherit;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
}
button.danger {
  background: #c8141c;
  color: #fff;
}
button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
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
</style>

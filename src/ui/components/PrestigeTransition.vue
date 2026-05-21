<script setup lang="ts">
import { ref } from 'vue';
import { currentEra, currentCopy, projectedMI, performPrestige, canPrestige } from '../state';

const confirming = ref(false);
function start() { confirming.value = true; }
function cancel() { confirming.value = false; }
function confirm() {
  confirming.value = false;
  performPrestige();
}
</script>

<template>
  <div v-if="canPrestige" class="prestige">
    <button v-if="!confirming" class="btn" @click="start">
      {{ currentCopy.prestige_button_label }} <span class="mi">(+{{ Math.floor(projectedMI) }} MI)</span>
    </button>
    <div v-else class="modal-backdrop" @click.self="cancel">
      <div class="modal">
        <h3>{{ currentCopy.prestige_confirm_title }}</h3>
        <p>{{ currentEra.prestige_bridge_copy }}</p>
        <p class="emphasis">{{ currentCopy.prestige_confirm_body }}</p>
        <p class="gain">You will gain <strong>{{ Math.floor(projectedMI) }}</strong> Memetic Inheritance.</p>
        <div class="row">
          <button class="cancel" @click="cancel">Stay</button>
          <button class="go" @click="confirm">Cross the Threshold</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.prestige {
  margin: 0;
  padding: 16px;
  width: 100%;
  box-sizing: border-box;
}
.btn {
  display: block;
  width: 100%;
  margin: 0;
  padding: 14px;
  background: var(--theme-accent, #2a2218);
  color: var(--theme-background, #f2ecd9);
  border: 0;
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  cursor: pointer;
  box-sizing: border-box;
}
.mi {
  font-weight: 400;
  opacity: 0.9;
  margin-left: 8px;
}
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
  box-sizing: border-box;
}
.modal {
  margin: 0;
  padding: 24px;
  width: 100%;
  max-width: 380px;
  background: var(--theme-surface, #ebe2c4);
  color: var(--theme-text, #2a2218);
  font-family: var(--theme-font-body, -apple-system, sans-serif);
  box-sizing: border-box;
}
.modal h3 {
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-size: 18px;
  margin: 0 0 12px;
  padding: 0;
}
.modal p {
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 12px;
  padding: 0;
}
.emphasis { font-style: italic; }
.gain { font-size: 16px; }
.row {
  display: flex;
  gap: 12px;
  margin: 20px 0 0;
}
.row button {
  flex: 1;
  padding: 12px;
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid var(--theme-border, #2a2218);
  box-sizing: border-box;
}
.cancel {
  background: var(--theme-surface, #ebe2c4);
  color: var(--theme-text, #2a2218);
}
.go {
  background: var(--theme-accent, #2a2218);
  color: var(--theme-background, #f2ecd9);
  border: 0;
  font-weight: 700;
}
</style>

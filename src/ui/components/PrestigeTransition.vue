<script setup lang="ts">
import { ref } from 'vue';
import { currentEra, currentCopy, projectedMI, performPrestige, canPrestige } from '../state';
import { playCue, stopCue } from '../audio';

const confirming = ref(false);
function start() {
  confirming.value = true;
  // Bridge cue plays while the player reads the era's prestige_bridge_copy.
  // 12s clip; the audio module's watchdog restores the loop if the player
  // lingers past it. Cancelled below if they back out.
  playCue('bridge', 12_500);
}
function cancel() {
  confirming.value = false;
  stopCue();
}
function confirm() {
  confirming.value = false;
  // Don't stopCue() here — performPrestige fires the prestige cue, which
  // cancels the bridge cue cleanly via playCue's own swap logic. Stopping
  // here would briefly restore the loop in the gap between cues.
  performPrestige();
}
</script>

<template>
  <div v-if="canPrestige" class="prestige">
    <button v-if="!confirming" class="btn btn-riso btn-riso-upgrade" @click="start">
      {{ currentCopy.prestige_button_label }} <span class="mi">(+{{ Math.floor(projectedMI) }} MI)</span>
    </button>
    <div v-else class="modal-backdrop" @click.self="cancel">
      <div class="modal">
        <h3>{{ currentCopy.prestige_confirm_title }}</h3>
        <p>{{ currentEra.prestige_bridge_copy }}</p>
        <p class="emphasis">{{ currentCopy.prestige_confirm_body }}</p>
        <p class="gain">You will gain <strong>{{ Math.floor(projectedMI) }}</strong> Memetic Inheritance.</p>
        <div class="row">
          <button class="btn-riso btn-riso-secondary" @click="cancel">Stay</button>
          <button class="btn-riso btn-riso-upgrade" @click="confirm">Cross the Threshold</button>
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
  font-size: 13px;
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
  font-size: 12px;
  box-sizing: border-box;
}
</style>

<script setup lang="ts">
import { computed } from 'vue';
import {
  state,
  currentEra,
  currentCopy,
  projectedMI,
  canPrestige,
  performPrestige,
} from '../state';
import { carryoverMultiplier } from '../../game/prestige';
import { formatResource } from '../format';

const progress = computed(() => Math.min(1, projectedMI.value));
const pct = computed(() => Math.round(progress.value * 100));
const projectedRounded = computed(() => Math.floor(projectedMI.value));

const currentBonusPct = computed(() => {
  const mult = carryoverMultiplier(state.memeticInheritance);
  return Math.round((mult - 1) * 100);
});

const lifetimeNeeded = computed(() =>
  Math.ceil(currentEra.value.prestige_pivot / 22500),
);
const remainingNeeded = computed(() =>
  Math.max(0, lifetimeNeeded.value - state.lifetimeRumor),
);

function tryPrestige() {
  if (!canPrestige.value) return;
  if (!confirm(`Cross into the next era? You'll gain ${projectedRounded.value} Memetic Inheritance (a permanent bonus to every future run). Your current era's Rumor, tiles, managers, and upgrades will reset. Memetic Inheritance, codex mastery, and prestige count carry forward.`)) return;
  performPrestige();
}
</script>

<template>
  <article class="page">
    <h2>Prestige & Ascension</h2>
    <p class="lede">
      When you <strong>Ascend</strong>, you walk forward through the
      history of disinformation — banking permanent power on the way.
      Each ascension is a one-way step into the next era; reaching
      the end of the chain loops you back to Antiquity with everything
      you learned still in hand.
    </p>

    <!-- Live status: shows current MI bonus, ascensions, loops. -->
    <section class="status">
      <div class="stat">
        <div class="stat-label">Current Inheritance</div>
        <div class="stat-value">{{ state.memeticInheritance.toFixed(2) }}</div>
        <div class="stat-sub">+{{ currentBonusPct }}% to all production, every era, forever</div>
      </div>
      <div class="stat">
        <div class="stat-label">Total ascensions</div>
        <div class="stat-value">{{ state.prestigeCount }}</div>
        <div class="stat-sub">era transitions completed</div>
      </div>
      <div v-if="state.loopsCompleted > 0" class="stat span-2">
        <div class="stat-label">Historical loops</div>
        <div class="stat-value">{{ state.loopsCompleted }}</div>
        <div class="stat-sub">full passes through the timeline (Era 1 → 4 → 1 …)</div>
      </div>
    </section>

    <!-- Current-era progress + ascend button (when ready). -->
    <section class="progress-block" :class="{ ready: canPrestige }">
      <div class="progress-head">
        <span class="ph-label">Progress in {{ currentEra.display_name }}</span>
        <span class="ph-amount">
          <template v-if="canPrestige">+{{ projectedRounded }} Inheritance ready</template>
          <template v-else>{{ pct }}%</template>
        </span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress * 100 + '%' }"></div>
      </div>
      <div v-if="!canPrestige" class="progress-sub">
        Projected: {{ projectedMI.toFixed(2) }} Inheritance (need 1.0+).
        Earn another <strong>{{ formatResource(remainingNeeded) }}</strong> lifetime Rumor to unlock ascension.
      </div>
      <div v-else class="progress-sub ready-sub">
        You can ascend now. The next era awaits.
      </div>
    </section>

    <button
      v-if="canPrestige"
      type="button"
      class="btn-riso btn-riso-upgrade ascend-btn"
      @click="tryPrestige"
    >
      {{ currentCopy.prestige_button_label }}
    </button>

    <!-- ===== The full how-it-works documentation ===== -->
    <section class="docs">
      <h3>How Prestige Works</h3>

      <h4>The short version</h4>
      <ol class="numbered">
        <li>Earn enough lifetime Rumor in your current era to unlock ascension (the bar above tells you exactly how much more you need).</li>
        <li>Tap the ascend button. Your current era's Rumor, tiles, managers, and per-generator upgrades are <strong>reset to zero</strong>.</li>
        <li>In exchange, you gain <strong>Memetic Inheritance (MI)</strong> — a permanent bonus that multiplies all production in every era, forever.</li>
        <li>You move forward to the next era in the timeline. The first time, that's Antiquity → Printing Press → Penny Press → Propaganda State.</li>
      </ol>

      <h4>What you keep across an ascension</h4>
      <ul class="bullets">
        <li><strong>Memetic Inheritance</strong> — your accumulated bonus % (see the Inheritance cell at the top-right of every screen).</li>
        <li><strong>Codex Mastery</strong> — every codex entry you tapped MASTER THIS on stays mastered, and the +5% technique bonuses still apply.</li>
        <li><strong>Prestige count + loop count</strong> — your run history.</li>
        <li><strong>Audio settings + bulk-buy preference</strong> — quality-of-life carries forward.</li>
      </ul>

      <h4>What you lose</h4>
      <ul class="bullets">
        <li>All current-era Rumor (current and lifetime, just for this era — your global lifetime keeps growing).</li>
        <li>Every tile you own and every manager you hired in this era.</li>
        <li>Every per-generator upgrade purchase (the ★ Boost pills).</li>
        <li>Any active ticker-event bonus.</li>
      </ul>
      <p class="note">
        The losses are real, but the gain is permanent. Each ascension makes
        every <em>future</em> ascension faster.
      </p>

      <h4>The math, briefly</h4>
      <p>
        MI gained per ascension = <code>150 × √(lifetime ÷ era_pivot)</code>.
        Each point of MI grants <strong>+2% to all production</strong>
        in every era. The bonus stacks multiplicatively on top of milestones,
        upgrades, managers, ticker events, and mastery.
      </p>

      <h4>The loop — what happens at the end of history</h4>
      <p>
        After ascending out of Propaganda State (1914–1945, currently the
        last era), you loop back to <strong>Antiquity</strong> with every
        bonus intact. The early eras fall dramatically faster — a fresh
        Era 1 climb that took ~30 minutes the first time might take
        ~10 minutes on loop 2 and under a minute by loop 10. Each lap
        through history compounds.
      </p>

      <h4>Strategy</h4>
      <ul class="bullets">
        <li><strong>Don't ascend at the minimum.</strong> MI scales with √lifetime, so doubling your lifetime Rumor before ascending only gains ~41% more MI — but pushing well past the threshold is usually worth it for one extra hour of accumulation.</li>
        <li><strong>Hire all managers</strong> in an era before ascending — they let production run while you do other things, making it cheap to push deeper.</li>
        <li><strong>Read codex entries on the way</strong> — Mastery is permanent across all prestiges, so investing reading time early pays compounding dividends.</li>
        <li><strong>Ticker events stack with prestige bonuses.</strong> A claimed ×5 bonus during heavy late-game production right before ascending can dramatically boost MI gain.</li>
      </ul>
    </section>
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
}
h2 {
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-size: 18px;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 0 0 12px;
  padding: 0;
}
.lede {
  font-size: 13px;
  line-height: 1.55;
  margin: 0 0 18px;
  padding: 0;
  opacity: 0.9;
}
.lede strong {
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 0 0 18px;
}
.stat {
  padding: 10px 12px;
  background: var(--theme-surface, #ebe2c4);
  border: 1px solid var(--theme-border, #2a2218);
  box-sizing: border-box;
}
.stat.span-2 { grid-column: 1 / -1; }
.stat-label {
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  opacity: 0.7;
  margin: 0 0 4px;
}
.stat-value {
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-size: 22px;
  font-weight: 900;
  color: var(--theme-accent, #2a2218);
  line-height: 1;
}
.stat-sub {
  font-size: 11px;
  font-style: italic;
  opacity: 0.75;
  margin-top: 4px;
}

.progress-block {
  margin: 0 0 16px;
  padding: 12px 14px 14px;
  background: var(--theme-surface, #ebe2c4);
  border: 1px solid var(--theme-border, #2a2218);
  box-sizing: border-box;
}
.progress-block.ready {
  background: linear-gradient(180deg, rgba(232, 142, 56, 0.35), rgba(214, 120, 48, 0.5));
  animation: ready-pulse 1.6s ease-in-out infinite;
}
@keyframes ready-pulse {
  0%, 100% { filter: brightness(1); }
  50%      { filter: brightness(1.08); }
}
.progress-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 6px;
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.ph-label { text-transform: uppercase; }
.ph-amount {
  font-family: var(--riso-font, 'IBM Plex Mono', monospace);
  font-weight: 700;
}
.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(0,0,0,0.15);
  border: 1px solid var(--theme-border, #2a2218);
  box-sizing: border-box;
  overflow: hidden;
  margin-bottom: 8px;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--theme-accent, #2a2218), var(--riso-primary-bg, #f0a050));
  transition: width 250ms ease-out;
}
.progress-block.ready .progress-fill {
  background: linear-gradient(90deg, #b3261e, #f4d000);
}
.progress-sub {
  font-size: 12px;
  line-height: 1.45;
  font-style: italic;
  opacity: 0.85;
}
.ready-sub { color: #b3261e; opacity: 1; font-weight: 700; font-style: normal; }

.ascend-btn {
  display: block;
  width: 100%;
  padding: 14px 16px;
  font-size: 14px;
  letter-spacing: 2px;
  margin-bottom: 18px;
}

/* ===== Docs ===== */
.docs {
  margin-top: 24px;
  padding-top: 18px;
  border-top: 2px solid var(--theme-border, #2a2218);
}
.docs h3 {
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-size: 16px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin: 0 0 14px;
  padding: 0;
}
.docs h4 {
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-size: 11px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin: 16px 0 6px;
  padding: 0;
  color: var(--theme-accent, #2a2218);
  opacity: 0.95;
}
.docs h4:first-of-type { margin-top: 0; }
.docs p {
  font-size: 12px;
  line-height: 1.55;
  margin: 0 0 8px;
  padding: 0;
}
.docs .numbered, .docs .bullets {
  margin: 0 0 8px;
  padding: 0 0 0 20px;
}
.docs .numbered li, .docs .bullets li {
  font-size: 12px;
  line-height: 1.5;
  margin: 0 0 4px;
}
.docs .note {
  font-style: italic;
  opacity: 0.85;
  margin-top: 6px;
}
.docs code {
  font-family: var(--riso-font, 'IBM Plex Mono', monospace);
  font-size: 11px;
  background: rgba(0,0,0,0.08);
  padding: 1px 4px;
  border: 1px solid rgba(0,0,0,0.15);
}
</style>

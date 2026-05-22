<script setup lang="ts">
import { computed } from 'vue';
import { ALL_TECHNIQUES, type TechniqueId } from '../../content/types';
import { state, currentEra } from '../state';
import { codexIdsByTechnique } from '../codex-state';
import { multiplierForLevel, PER_LEVEL_BONUS } from '../../game/mastery';

const codexByTechnique = computed(() => codexIdsByTechnique());

const bonusPctPerLevel = Math.round(PER_LEVEL_BONUS * 100);

interface MasteryRow {
  technique: TechniqueId;
  level: number;
  bonusPct: number;
  available: number;
  mastered: number;
  unlockedInThisEra: boolean;
}

const rows = computed<MasteryRow[]>(() =>
  ALL_TECHNIQUES.map(t => {
    const level = state.techniqueMastery[t] ?? 0;
    const allForT = codexByTechnique.value[t] ?? [];
    const mastered = allForT.filter(id => state.codexMastered.has(id)).length;
    return {
      technique: t,
      level,
      bonusPct: Math.round((multiplierForLevel(level) - 1) * 100),
      available: allForT.length,
      mastered,
      unlockedInThisEra: currentEra.value.techniques_unlocked.includes(t),
    };
  }),
);

const totalBonus = computed(() => {
  // For display: average bonus across all techniques used in current era's
  // generators. Approximate "what is my mastery actually doing for me here".
  const tagsInEra = new Set<string>(
    currentEra.value.generators.map(g => g.technique_tag),
  );
  let count = 0, sum = 0;
  for (const r of rows.value) {
    if (tagsInEra.has(r.technique)) {
      sum += r.bonusPct;
      count++;
    }
  }
  return count > 0 ? Math.round(sum / count) : 0;
});

function humanize(t: string): string {
  return t.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
</script>

<template>
  <div class="mastery-tab">
    <header class="header">
      <h2>Technique Mastery</h2>
      <p class="subhead">
        Each codex entry you master grants <strong>+{{ bonusPctPerLevel }}%</strong> permanent
        production to every generator that uses its technique tag — in every era, across every prestige.
        Average bonus to your current era: <strong>+{{ totalBonus }}%</strong>.
      </p>
    </header>

    <ul class="rows">
      <li
        v-for="row in rows"
        :key="row.technique"
        class="mastery-row"
        :class="{ 'in-era': row.unlockedInThisEra, 'dormant': !row.unlockedInThisEra }"
      >
        <div class="row-head">
          <span class="technique-name">{{ humanize(row.technique) }}</span>
          <span v-if="row.unlockedInThisEra" class="in-era-pill">USED THIS ERA</span>
          <span class="level-badge">Level {{ row.level }}</span>
        </div>
        <div class="row-stats">
          <span class="bonus">+{{ row.bonusPct }}% production</span>
          <span class="entries">{{ row.mastered }} / {{ row.available }} codex entries mastered</span>
        </div>
        <div v-if="row.available > 0" class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: (row.mastered / row.available) * 100 + '%' }"
          ></div>
        </div>
      </li>
    </ul>

    <p class="footnote">
      Technique taxonomy from Roozenbeek &amp; van der Linden's <em>Bad News</em> research (Era 1–3)
      plus period-specific additions for Era 4 onward. Master entries via the <strong>MASTER THIS</strong>
      button on each codex page.
    </p>
  </div>
</template>

<style scoped>
.mastery-tab {
  margin: 0;
  padding: 0 0 80px 0;
  width: 100%;
  box-sizing: border-box;
}
.header {
  padding: 14px 16px 12px;
  border-bottom: 1px solid var(--theme-border, #2a2218);
  background: var(--theme-background, #f2ecd9);
}
.header h2 {
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-size: 18px;
  text-transform: uppercase;
  letter-spacing: 3px;
  margin: 0 0 6px;
  padding: 0;
}
.subhead {
  font-family: var(--theme-font-body, -apple-system, sans-serif);
  font-size: 12px;
  line-height: 1.5;
  margin: 0;
  padding: 0;
  opacity: 0.85;
  font-style: italic;
}
.subhead strong {
  font-style: normal;
  font-weight: 700;
  color: #2a6b35;
}
.rows {
  list-style: none;
  margin: 0;
  padding: 12px 16px;
}
.mastery-row {
  margin: 0 0 10px;
  padding: 10px 12px;
  background: var(--theme-surface, #ebe2c4);
  border: 1px solid var(--theme-border, #2a2218);
  box-sizing: border-box;
}
.mastery-row.dormant { opacity: 0.6; }
.row-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}
.technique-name {
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.in-era-pill {
  font-family: var(--riso-font, 'IBM Plex Mono', monospace);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1px;
  background: var(--riso-primary-bg, #f0a050);
  color: var(--riso-primary-text, #1a1410);
  padding: 2px 6px;
  border: 1px solid var(--riso-ink, #1a1410);
  box-shadow: 2px 2px 0 0 var(--riso-primary-shadow, #4a90b0);
}
.level-badge {
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.5px;
  color: var(--theme-accent, #2a2218);
}
.row-stats {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin: 6px 0 6px;
  font-family: var(--theme-font-body, -apple-system, sans-serif);
  font-size: 11px;
}
.bonus { color: #2a6b35; font-weight: 700; }
.entries { opacity: 0.7; font-style: italic; }
.progress-bar {
  height: 5px;
  background: rgba(0,0,0,0.12);
  border: 1px solid rgba(0,0,0,0.25);
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #d27020, #f0a050);
  transition: width 250ms ease-out;
}
.footnote {
  font-size: 10px;
  opacity: 0.55;
  margin: 0;
  padding: 8px 16px 0;
  line-height: 1.5;
  font-style: italic;
  color: var(--theme-muted, #6b5a3d);
}
</style>

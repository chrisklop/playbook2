<script setup lang="ts">
import { computed } from 'vue';
import { state, visibleGenerators, isManagerHired } from '../state';

// Contextual onboarding line. Reads the current play state and tells the
// player the single most-useful next move. Returns null to hide entirely
// once the player has multiple generators going — by then the loop is
// internalised and the banner becomes noise.
const message = computed<string | null>(() => {
  const gens = visibleGenerators.value;
  if (gens.length === 0) return null;

  // Step past onboarding once two generator types are owned. By then the
  // player has clearly grasped buy → produce → buy more → next tile.
  let ownedTypes = 0;
  for (const g of gens) {
    if ((state.ownedByGenerator[g.id] ?? 0) > 0) ownedTypes++;
  }
  if (ownedTypes >= 2) return null;

  const first = gens[0];
  const firstOwned = state.ownedByGenerator[first.id] ?? 0;
  const firstName = first.display_name;
  const mgrName = first.manager_name;

  // No rumor yet — the very first thing a new player should do.
  if (state.lifetimeRumor === 0) {
    return `Tap the ${firstName} tile to spread your first Rumor.`;
  }

  // Got some rumor but nothing owned yet — point at the Buy pill.
  if (firstOwned === 0) {
    if (state.rumor >= first.base_cost) {
      return `Tap BUY to put your first ${firstName} to work.`;
    }
    return `Keep tapping — you need ${first.base_cost} Rumor to buy a ${firstName}.`;
  }

  // Owned at least one — keep tapping to earn while you save for more.
  if (firstOwned < first.auto_unlock_at) {
    return `Buy more ${firstName}s — each tap earns Rumor too.`;
  }

  // Manager is unlocked but not hired yet.
  if (!isManagerHired(first.id)) {
    return `Hire a ${mgrName} so the work runs itself.`;
  }

  // First manager is hired but no second generator owned yet — save up.
  return `Nice. Save up to afford the next technique.`;
});
</script>

<template>
  <Transition name="coach-fade">
    <div v-if="message" class="coach" role="status" aria-live="polite">
      <span class="coach-dot">●</span>
      <span class="coach-text">{{ message }}</span>
    </div>
  </Transition>
</template>

<style scoped>
.coach {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 14px 8px;
  padding: 8px 12px;
  background: var(--theme-surface, #ebe2c4);
  border-left: 3px solid var(--theme-accent, #e88e38);
  font-family: var(--theme-font-body, -apple-system, sans-serif);
  font-size: 12px;
  font-weight: 600;
  color: var(--theme-text, #2a2218);
  box-sizing: border-box;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    0 1px 0 rgba(0, 0, 0, 0.12);
}
.coach-dot {
  color: var(--theme-accent, #e88e38);
  font-size: 9px;
  animation: coach-blink 1.6s ease-in-out infinite;
}
@keyframes coach-blink {
  0%, 100% { opacity: 0.35; }
  50%      { opacity: 1; }
}
.coach-text {
  flex: 1;
  letter-spacing: 0.2px;
  line-height: 1.3;
}

.coach-fade-enter-active, .coach-fade-leave-active {
  transition: opacity 300ms ease, transform 300ms ease;
}
.coach-fade-enter-from, .coach-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>

import { reactive, computed } from 'vue';
import { parseCodexEntry, type CodexEntry } from '../content/codex-parser';
import { state as gameState, currentEra } from './state';

const codexFiles = import.meta.glob('../content/eras/*/codex/*.md', {
  eager: true,
  as: 'raw',
}) as Record<string, string>;

const entries: (CodexEntry & { path: string })[] = Object.entries(codexFiles).map(
  ([path, raw]) => ({ path, ...parseCodexEntry(raw) })
);

export const codexState = reactive({
  selectedId: null as string | null,
});

export const visibleEntries = computed(() => {
  const eraId = currentEra.value.id;
  return entries.filter(e => {
    if (e.frontmatter.era !== eraId) return false;
    const trig = e.frontmatter.unlock_trigger;
    if (trig.type === 'always') return true;
    if (trig.type === 'era_reached') return true;
    if (trig.type === 'generator_owned') {
      const owned = gameState.ownedByGenerator[trig.generator!] ?? 0;
      return owned >= (trig.count ?? 1);
    }
    return false;
  });
});

export const selectedEntry = computed(() =>
  entries.find(e => e.frontmatter.id === codexState.selectedId) ?? null
);

/** Every codex entry in the project, across all eras. Used by the Mastery tab
 *  to show "you've mastered N of M entries for technique X". */
export const allCodexEntries = entries;

/** Group codex IDs by which technique tag(s) they cover. One entry can appear
 *  under multiple techniques if its frontmatter lists more than one. */
export function codexIdsByTechnique(): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const e of entries) {
    for (const t of e.frontmatter.techniques) {
      if (!out[t]) out[t] = [];
      out[t].push(e.frontmatter.id);
    }
  }
  return out;
}

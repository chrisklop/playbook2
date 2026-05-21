import { reactive, computed } from 'vue';
import { parseCodexEntry, type CodexEntry } from '../content/codex-parser';
import { state as gameState } from './state';

// Vite supports the ?raw query param to import file contents as strings.
// `import.meta.glob` with eager + as raw loads all files in the directory at build time.
const codexFiles = import.meta.glob('../content/eras/01-antiquity/codex/*.md', {
  eager: true,
  as: 'raw',
}) as Record<string, string>;

const entries: (CodexEntry & { path: string })[] = Object.entries(codexFiles).map(
  ([path, raw]) => ({ path, ...parseCodexEntry(raw) })
);

export const codexState = reactive({
  selectedId: null as string | null,
});

/** Returns codex entries whose unlock trigger condition is currently met. */
export const visibleEntries = computed(() => {
  return entries.filter(e => {
    const trig = e.frontmatter.unlock_trigger;
    if (trig.type === 'always') return true;
    if (trig.type === 'era_reached') return true; // current era is loaded → unlocked
    if (trig.type === 'generator_owned') {
      const owned = gameState.ownedByGenerator[trig.generator!] ?? 0;
      return owned >= (trig.count ?? 1);
    }
    return false;
  });
});

/** Returns the currently selected entry, or null if none selected. */
export const selectedEntry = computed(() =>
  entries.find(e => e.frontmatter.id === codexState.selectedId) ?? null
);

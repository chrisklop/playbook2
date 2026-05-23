import { ref } from 'vue';
import { codexState } from './codex-state';

/**
 * App-level tab navigation, shared across components. Previously this lived
 * as a local ref in AppShell.vue, but Info popovers on tiles/events need to
 * be able to navigate to the Codex tab AND select a specific entry — which
 * requires touching state outside AppShell's scope.
 */
export type TabId = 'play' | 'tree' | 'codex' | 'more';

export const activeTab = ref<TabId>('play');

/** Convenience: open a specific codex entry on the Codex tab. */
export function openCodexEntry(codexId: string): void {
  codexState.selectedId = codexId;
  activeTab.value = 'codex';
}

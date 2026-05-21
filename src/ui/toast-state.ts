import { reactive, computed } from 'vue';
import { state } from './state';

export interface ActiveToast {
  id: string; // event id (e.g. 'auto-unlock:antiquity:spread-rumor')
  message: string;
  era_id: string; // for theme-aware styling
  fired_at_ms: number;
}

const MAX_VISIBLE = 3;
const DISMISS_AFTER_MS = 3000;

const queue = reactive<{ active: ActiveToast[] }>({ active: [] });

export const activeToasts = computed(() => queue.active);

/**
 * Fire a toast iff its id has not been seen before. Add the id to the seen set
 * (persisted via state) so it won't re-fire on reload or future runs.
 */
export function fireToast(opts: { id: string; message: string; era_id: string }): void {
  if (state.seenToastEvents.has(opts.id)) return;
  state.seenToastEvents.add(opts.id);

  const toast: ActiveToast = {
    id: opts.id,
    message: opts.message,
    era_id: opts.era_id,
    fired_at_ms: Date.now(),
  };
  queue.active.push(toast);

  while (queue.active.length > MAX_VISIBLE) {
    queue.active.shift();
  }

  if (typeof window !== 'undefined') {
    window.setTimeout(() => dismissToast(opts.id), DISMISS_AFTER_MS);
  }
}

export function dismissToast(id: string): void {
  const idx = queue.active.findIndex(t => t.id === id);
  if (idx >= 0) queue.active.splice(idx, 1);
}

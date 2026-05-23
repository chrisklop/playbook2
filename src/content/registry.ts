import { loadEra } from './loader';
import {
  ThemeSchema,
  EventDefinitionSchema,
  type EraDefinition,
  type Theme,
  type EventDefinition,
} from './schema';
import { z } from 'zod';

/**
 * Era bundles are auto-discovered from src/content/eras/*\/.
 *
 * Each era ships five JSON files in a numbered directory (01-antiquity,
 * 02-printing-press, etc.):
 *
 *   era.json    — generators, milestones, prestige chain, technique tags
 *   theme.json  — palette + fonts + riso button overrides
 *   ticker.json — scrolling-headline pool
 *   copy.json   — masthead text, prestige labels, resource names
 *   events.json — ticker-event definitions + frenzy bursts
 *
 * Adding a new era is a drop-in operation: create the directory, fill in
 * the five files, register any new technique tags in src/content/types.ts
 * and src/content/schema.ts, and update the previous era's prestige_into
 * to point at it. No edits to this file are required.
 *
 * Vite's import.meta.glob ingests everything at build time, so the bundle
 * map is statically known to the bundler — no runtime fetches.
 */

const TickerSchema = z.object({
  quotes: z.array(z.object({
    id: z.string().min(1),
    text: z.string().min(1),
    codex_link: z.string().nullable(),
  })).min(1),
  interval_ms: z.number().int().positive(),
  no_repeat_within: z.number().int().nonnegative(),
});
export type Ticker = z.infer<typeof TickerSchema>;

const CopySchema = z.object({
  masthead_title: z.string().min(1),
  masthead_subtitle: z.string().min(1),
  resource_labels: z.record(z.string(), z.string()),
  prestige_button_label: z.string().min(1),
  prestige_confirm_title: z.string().min(1),
  prestige_confirm_body: z.string().min(1),
  // v0.2 additions — optional, defaults supplied at consumer site
  reveal_placeholder_text: z.string().min(1).default('A new playbook tool stirs.'),
  prestige_ready_toast: z
    .string()
    .min(1)
    .default("The threshold calls. Ascend whenever you're ready."),
});
export type Copy = z.infer<typeof CopySchema>;

const EventsArraySchema = z.array(EventDefinitionSchema);

export interface EraBundle {
  era: EraDefinition;
  theme: Theme;
  ticker: Ticker;
  copy: Copy;
  events: EventDefinition[];
}

function loadBundle(
  raw: { era: unknown; theme: unknown; ticker: unknown; copy: unknown; events: unknown },
  eraIdHint: string,
): EraBundle {
  try {
    return {
      era: loadEra(raw.era),
      theme: ThemeSchema.parse(raw.theme),
      ticker: TickerSchema.parse(raw.ticker),
      copy: CopySchema.parse(raw.copy),
      events: EventsArraySchema.parse(raw.events),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Content for era '${eraIdHint}' failed to load:\n${message}`);
  }
}

// Five parallel globs, one per file type. Each returns a map of
// "./eras/<dir>/<filename>.json" → parsed JSON. Eager so the values are
// inlined at build time; { import: 'default' } unwraps the JSON-module
// default export so we get the raw object instead of { default: ... }.
const eraGlobs    = import.meta.glob('./eras/*/era.json',    { eager: true, import: 'default' });
const themeGlobs  = import.meta.glob('./eras/*/theme.json',  { eager: true, import: 'default' });
const tickerGlobs = import.meta.glob('./eras/*/ticker.json', { eager: true, import: 'default' });
const copyGlobs   = import.meta.glob('./eras/*/copy.json',   { eager: true, import: 'default' });
const eventsGlobs = import.meta.glob('./eras/*/events.json', { eager: true, import: 'default' });

function dirFromPath(p: string): string {
  // './eras/03-penny-press/era.json' → '03-penny-press'
  const m = p.match(/\.\/eras\/([^/]+)\//);
  if (!m) throw new Error(`Unrecognised era content path: ${p}`);
  return m[1];
}

// Walk the era.json glob (sorted alphabetically so 01-, 02-, … come out in
// ordinal order). For each era dir, pull the sibling files from the other
// globs by path, parse the whole bundle, and stash it by the era's *id*
// (which is what consumer code uses, not the directory name).
const BUNDLES: Record<string, EraBundle> = {};
const orderedEraIds: string[] = [];

const sortedEraPaths = Object.keys(eraGlobs).sort();
for (const eraPath of sortedEraPaths) {
  const dir = dirFromPath(eraPath);
  const eraRaw = eraGlobs[eraPath];
  const themeRaw = themeGlobs[`./eras/${dir}/theme.json`];
  const tickerRaw = tickerGlobs[`./eras/${dir}/ticker.json`];
  const copyRaw = copyGlobs[`./eras/${dir}/copy.json`];
  const eventsRaw = eventsGlobs[`./eras/${dir}/events.json`];

  if (!themeRaw || !tickerRaw || !copyRaw || !eventsRaw) {
    throw new Error(
      `Era '${dir}' is missing one or more content files. Required: era.json, theme.json, ticker.json, copy.json, events.json.`,
    );
  }

  const bundle = loadBundle(
    { era: eraRaw, theme: themeRaw, ticker: tickerRaw, copy: copyRaw, events: eventsRaw },
    dir,
  );
  BUNDLES[bundle.era.id] = bundle;
  orderedEraIds.push(bundle.era.id);
}

export const registry = {
  eraIds: orderedEraIds,
};

export function getEra(id: string): EraBundle {
  const bundle = BUNDLES[id];
  if (!bundle) throw new Error(`Unknown era id: '${id}'`);
  return bundle;
}

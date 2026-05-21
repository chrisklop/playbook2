import { loadEra } from './loader';
import { ThemeSchema, type EraDefinition, type Theme } from './schema';
import { z } from 'zod';

// Vite supports JSON imports natively
import antiquityEraRaw from './eras/01-antiquity/era.json';
import antiquityThemeRaw from './eras/01-antiquity/theme.json';
import antiquityTickerRaw from './eras/01-antiquity/ticker.json';
import antiquityCopyRaw from './eras/01-antiquity/copy.json';

import printingPressEraRaw from './eras/02-printing-press/era.json';
import printingPressThemeRaw from './eras/02-printing-press/theme.json';
import printingPressTickerRaw from './eras/02-printing-press/ticker.json';
import printingPressCopyRaw from './eras/02-printing-press/copy.json';

import pennyPressEraRaw from './eras/03-penny-press/era.json';
import pennyPressThemeRaw from './eras/03-penny-press/theme.json';
import pennyPressTickerRaw from './eras/03-penny-press/ticker.json';
import pennyPressCopyRaw from './eras/03-penny-press/copy.json';

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

export interface EraBundle {
  era: EraDefinition;
  theme: Theme;
  ticker: Ticker;
  copy: Copy;
}

function loadBundle(
  raw: { era: unknown; theme: unknown; ticker: unknown; copy: unknown },
  eraIdHint: string,
): EraBundle {
  try {
    return {
      era: loadEra(raw.era),
      theme: ThemeSchema.parse(raw.theme),
      ticker: TickerSchema.parse(raw.ticker),
      copy: CopySchema.parse(raw.copy),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Content for era '${eraIdHint}' failed to load:\n${message}`);
  }
}

const BUNDLES: Record<string, EraBundle> = {
  antiquity: loadBundle(
    {
      era: antiquityEraRaw,
      theme: antiquityThemeRaw,
      ticker: antiquityTickerRaw,
      copy: antiquityCopyRaw,
    },
    'antiquity',
  ),
  'printing-press': loadBundle(
    {
      era: printingPressEraRaw,
      theme: printingPressThemeRaw,
      ticker: printingPressTickerRaw,
      copy: printingPressCopyRaw,
    },
    'printing-press',
  ),
  'penny-press': loadBundle(
    {
      era: pennyPressEraRaw,
      theme: pennyPressThemeRaw,
      ticker: pennyPressTickerRaw,
      copy: pennyPressCopyRaw,
    },
    'penny-press',
  ),
};

export const registry = {
  eraIds: Object.keys(BUNDLES),
};

export function getEra(id: string): EraBundle {
  const bundle = BUNDLES[id];
  if (!bundle) throw new Error(`Unknown era id: '${id}'`);
  return bundle;
}

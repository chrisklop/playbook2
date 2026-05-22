import { z } from 'zod';

export const TechniqueIdSchema = z.enum([
  // Era 1-3 baseline
  'impersonation', 'emotion', 'polarization',
  'conspiracy', 'discrediting', 'trolling',
  // Era 4+ additions
  'big-lie', 'atrocity-calibration', 'monumental-aesthetic',
  'black-propaganda', 'photographic-falsification', 'manufactured-event',
]);

export const ResourceIdSchema = z.enum([
  'rumor', 'reach', 'cred', 'memetic_inheritance',
]);

export const GeneratorTierSchema = z.object({
  id: z.string().min(1),
  tier: z.number().int().min(1).max(8),
  display_name: z.string().min(1),
  description: z.string().min(1),
  technique_tag: TechniqueIdSchema,
  resource: ResourceIdSchema,
  base_cost: z.number().nonnegative(),
  cost_growth: z.number().min(1.07).max(1.20),
  base_production: z.number().nonnegative(),
  is_click_driven: z.boolean(),
  auto_unlock_at: z.number().int().nonnegative(),
  auto_operative_name: z.string().min(1),
  milestones: z.array(z.number().int().positive()).default([25, 50, 100, 200, 300, 400]),
  codex_link: z.string().nullable().default(null),
  /**
   * Progressive reveal: the generator's card is hidden until lifetime resource of
   * the matching `resource` type reaches this value. 0 = always visible (Tier 1).
   * AdVenture Capitalist pattern — keeps the next tier as a "discoverable" carrot
   * rather than dumping all options on the player at start.
   */
  reveal_at_lifetime: z.number().nonnegative().default(0),
  /**
   * AdCap-style cycle time in seconds. Higher tiers get slower visible cycles
   * with proportionally larger payouts. Math: payout_per_cycle = base_production
   * × cycle_seconds × owned × milestones × multipliers, divided by cycle_seconds
   * = same rate-per-second as the v0.2 continuous-tick model. Visually: bar
   * fills over cycle_seconds, pops, resets.
   */
  cycle_seconds: z.number().positive().default(1.0),
  /**
   * One-time Rumor cost to hire the manager for this generator. Before hire,
   * the cycle requires the player to tap the card. After hire, cycle auto-runs.
   * Replaces v0.1's auto_unlock_at mechanic with an explicit purchase decision.
   */
  manager_cost: z.number().nonnegative().default(0),
  /** Display name of the manager (shown on the Hire button + toast). */
  manager_name: z.string().default('Manager'),
  /** Emoji or single-character icon for the card's icon block. */
  icon: z.string().default('●'),
  /**
   * AdCap-style one-time upgrades for this generator. Each upgrade unlocks at a
   * given owned threshold and applies a permanent multiplier to this generator's
   * payout when purchased. Stacks multiplicatively.
   */
  upgrades: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1).default(''),
    unlock_at_owned: z.number().int().positive(),
    multiplier: z.number().positive(),
    cost: z.number().positive(),
  })).default([]),
});
export type GeneratorTier = z.infer<typeof GeneratorTierSchema>;

/**
 * Random ticker events — auto-spawn during play, the player has a brief window
 * to tap the headline and "spread" it for a temporary production bonus.
 * Templatable: each era ships its own events.json with era-appropriate flavor.
 * Engine reads + fires + applies the bonus uniformly across all eras.
 */
export const EventEffectSchema = z.object({
  type: z.enum(['rumor_mult']),
  value: z.number().positive(),
  duration_s: z.number().positive(),
});
export const EventDefinitionSchema = z.object({
  id: z.string().min(1),
  headline: z.string().min(1),
  /** Verb on the claim button — "TAP TO SPREAD", "PRINT IT", etc. Per era flavor. */
  claim_verb: z.string().min(1).default('TAP TO SPREAD'),
  /** Seconds the claim button is on screen before scrolling away. */
  claim_window_s: z.number().positive().default(20),
  effect: EventEffectSchema,
  /** Relative spawn weight. Defaults to 1; rarer events get smaller values. */
  weight: z.number().positive().default(1),
  /** Rare high-magnitude burst (10×+ for ~10s). Triggers louder UI and an
   *  optional music swap. Distinct from normal ticker offers so the player
   *  registers "this one matters." */
  is_frenzy: z.boolean().default(false),
});
export type EventDefinition = z.infer<typeof EventDefinitionSchema>;
export type EventEffect = z.infer<typeof EventEffectSchema>;

export const EraDefinitionSchema = z.object({
  id: z.string().min(1),
  ordinal: z.number().int().min(1).max(12),
  date_range: z.string().min(1),
  display_name: z.string().min(1),
  theme_id: z.string().min(1),
  techniques_unlocked: z.array(TechniqueIdSchema).min(1),
  generators: z.array(GeneratorTierSchema).min(2),
  prestige_into: z.string().nullable(),
  prestige_bridge_copy: z.string().min(1),
  /**
   * Per-era pivot for the prestige formula `MI = 150 × sqrt(lifetime / pivot)`.
   * Calibrated against the economy simulator so first prestige lands in 30–60 min.
   * Default 1e12 is Era-1-class; later eras need orders of magnitude higher pivots
   * because their production scale is correspondingly larger.
   */
  prestige_pivot: z.number().positive().default(1e12),
});
export type EraDefinition = z.infer<typeof EraDefinitionSchema>;

export const CodexFrontmatterSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  era: z.string().min(1),
  techniques: z.array(TechniqueIdSchema).min(1),
  sources: z.array(z.object({
    url: z.string().url(),
    label: z.string().min(1),
  })).min(1, 'Codex entries MUST have at least one source URL'),
  unlock_trigger: z.object({
    type: z.enum(['generator_owned', 'era_reached', 'always']),
    generator: z.string().optional(),
    count: z.number().int().positive().optional(),
  }),
});
export type CodexFrontmatter = z.infer<typeof CodexFrontmatterSchema>;

const HexColor = z.string().regex(/^#[0-9a-f]{6}$/i);

/**
 * Optional per-era overrides for the riso button language. When provided in
 * an era's theme.json, these values replace the global defaults from
 * src/ui/buttons.css. Lets each era have its own distinctive button accents
 * without touching engine code -- the templatization principle for buttons.
 */
const RisoOverrides = z.object({
  primary_bg: HexColor.optional(),
  primary_shadow: HexColor.optional(),
  primary_text: HexColor.optional(),
  secondary_bg: HexColor.optional(),
  secondary_shadow: HexColor.optional(),
  secondary_text: HexColor.optional(),
  upgrade_bg: HexColor.optional(),
  upgrade_shadow: HexColor.optional(),
  upgrade_text: HexColor.optional(),
  bulk_on_bg: HexColor.optional(),
  bulk_on_shadow: HexColor.optional(),
  bulk_on_text: HexColor.optional(),
}).optional();

export const ThemeSchema = z.object({
  id: z.string().min(1),
  era_id: z.string().min(1),
  fonts: z.object({
    masthead: z.string().min(1),
    body: z.string().min(1),
    google_fonts_url: z.string().url().optional(),
  }),
  palette: z.object({
    background: HexColor,
    surface: HexColor,
    text: HexColor,
    muted: HexColor,
    accent: HexColor,
    border: HexColor,
  }),
  riso: RisoOverrides,
  card_style: z.enum(['flat-paper', 'broadsheet', 'poster', 'chat-bubble']).default('flat-paper'),
});
export type Theme = z.infer<typeof ThemeSchema>;

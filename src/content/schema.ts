import { z } from 'zod';

export const TechniqueIdSchema = z.enum([
  'impersonation', 'emotion', 'polarization',
  'conspiracy', 'discrediting', 'trolling',
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
});
export type GeneratorTier = z.infer<typeof GeneratorTierSchema>;

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

export const ThemeSchema = z.object({
  id: z.string().min(1),
  era_id: z.string().min(1),
  fonts: z.object({
    masthead: z.string().min(1),
    body: z.string().min(1),
    google_fonts_url: z.string().url().optional(),
  }),
  palette: z.object({
    background: z.string().regex(/^#[0-9a-f]{6}$/i),
    surface: z.string().regex(/^#[0-9a-f]{6}$/i),
    text: z.string().regex(/^#[0-9a-f]{6}$/i),
    muted: z.string().regex(/^#[0-9a-f]{6}$/i),
    accent: z.string().regex(/^#[0-9a-f]{6}$/i),
    border: z.string().regex(/^#[0-9a-f]{6}$/i),
  }),
  card_style: z.enum(['flat-paper', 'broadsheet', 'poster', 'chat-bubble']).default('flat-paper'),
});
export type Theme = z.infer<typeof ThemeSchema>;

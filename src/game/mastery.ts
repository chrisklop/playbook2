import type { TechniqueId } from '../content/types';

/**
 * Technique Mastery — a persistent (cross-prestige) progression system.
 *
 * Each codex entry has a `techniques: [TechniqueId, ...]` field in its
 * frontmatter. When the player taps "Master This" on a codex page, every
 * technique listed in that entry levels up by 1.
 *
 * The mastery level grants a permanent multiplicative bonus to every
 * generator carrying that technique_tag — across ALL eras, surviving
 * prestige. Treat it as the player's accumulated craft knowledge: once
 * you've read about the Bryce Report, you understand atrocity calibration
 * forever, even after you ascend.
 *
 * Design:
 *   - +5% per level, additive within a technique
 *   - Generator's effective production = base × (1 + 0.05 × mastery[tag])
 *   - Multiple techniques on one generator? Not currently supported by
 *     schema (technique_tag is singular). If we ever go multi-tag,
 *     multiply across all tags.
 *   - No cap — there's enough codex content (~25-50 entries per era
 *     long-term) that mastery scales sublinearly compared to other
 *     multipliers (managers, milestones, upgrades, MI carryover).
 */

export const PER_LEVEL_BONUS = 0.05; // +5% per level

/** Multiplier for a given mastery level (0-indexed). Level 0 returns 1.0. */
export function multiplierForLevel(level: number): number {
  return 1 + PER_LEVEL_BONUS * Math.max(0, level);
}

/**
 * Multiplier to apply to a generator whose `technique_tag` is `tag`,
 * given the player's current mastery map.
 */
export function multiplierForTechnique(
  mastery: Record<string, number>,
  tag: TechniqueId,
): number {
  return multiplierForLevel(mastery[tag] ?? 0);
}

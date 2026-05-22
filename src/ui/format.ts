/**
 * Honest-display number formatters.
 *
 * Display rounding lies about state if it's not careful. Our convention:
 *
 *   - COSTS are rounded UP (ceiling). Never display "affordable" when it isn't.
 *   - OWNED RESOURCES are rounded DOWN (floor). Never display "more than you have".
 *   - RATES use 1 decimal when small, then K/M/B suffixes.
 *
 * Invariant (enforced in tests/ui/format.test.ts):
 *   parseDisplayed(formatRumor(r)) <= r < parseDisplayed(formatRumor(r)) + 1  (for r < 1000)
 *   actual_cost <= parseDisplayed(formatCost(actual_cost))
 *
 * Which means: if the player sees `displayed_rumor >= displayed_cost`, the
 * actual buy is guaranteed to succeed.
 */

/**
 * Short-scale suffix ladder. Each entry is [10^n, suffix]. We keep going
 * to decillion (1e33) so the player almost never sees the ugly scientific
 * notation 4.7e+13 in normal play. Beyond decillion the named suffixes
 * become esoteric (there's no widely-agreed two-letter shorthand past
 * "Dc"), so we fall through to exponential.
 */
const SUFFIX_LADDER: readonly [number, string][] = [
  [1e3,  'K'],   // thousand
  [1e6,  'M'],   // million
  [1e9,  'B'],   // billion
  [1e12, 'T'],   // trillion
  [1e15, 'Qa'],  // quadrillion
  [1e18, 'Qi'],  // quintillion
  [1e21, 'Sx'],  // sextillion
  [1e24, 'Sp'],  // septillion
  [1e27, 'Oc'],  // octillion
  [1e30, 'No'],  // nonillion
  [1e33, 'Dc'],  // decillion
];

/** Pick the suffix-ladder rung for `n` and format with `rounder` (Math.floor / Math.ceil). */
function formatWithLadder(n: number, rounder: (x: number) => number): string {
  if (n < 1000) return rounder(n).toString();
  for (let i = 0; i < SUFFIX_LADDER.length; i++) {
    const [threshold, suffix] = SUFFIX_LADDER[i];
    const next = i + 1 < SUFFIX_LADDER.length ? SUFFIX_LADDER[i + 1][0] : 1e36;
    if (n < next) {
      // One decimal place at this rung: floor/ceil at scale/10 then divide by 10.
      const scaled = rounder(n / (threshold / 10)) / 10;
      return scaled.toFixed(1) + suffix;
    }
  }
  // Past the ladder — fall back to scientific so unbounded growth still renders.
  return n.toExponential(1);
}

/** Format a cost. Always rounds UP so the displayed number is never less than actual. */
export function formatCost(n: number): string {
  return formatWithLadder(n, Math.ceil);
}

/** Format an owned resource (rumor, etc). Rounds DOWN so display never overstates. */
export function formatResource(n: number): string {
  return formatWithLadder(n, Math.floor);
}

/** Format a per-second rate. Shows 2 decimals when sub-1, 1 decimal when sub-10,
 *  then runs the same suffix ladder as resources/costs. */
export function formatRate(n: number): string {
  if (n === 0) return '0';
  if (n < 1) return n.toFixed(2);
  if (n < 10) return n.toFixed(1);
  return formatWithLadder(n, Math.round);
}

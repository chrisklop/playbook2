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

/** Format a cost. Always rounds UP so the displayed number is never less than actual. */
export function formatCost(n: number): string {
  if (n < 1000) return Math.ceil(n).toString();
  if (n < 1e6) return (Math.ceil(n / 100) / 10).toFixed(1) + 'K';
  if (n < 1e9) return (Math.ceil(n / 1e5) / 10).toFixed(1) + 'M';
  if (n < 1e12) return (Math.ceil(n / 1e8) / 10).toFixed(1) + 'B';
  return n.toExponential(1);
}

/** Format an owned resource (rumor, etc). Rounds DOWN so display never overstates. */
export function formatResource(n: number): string {
  if (n < 1000) return Math.floor(n).toString();
  if (n < 1e6) return (Math.floor(n / 100) / 10).toFixed(1) + 'K';
  if (n < 1e9) return (Math.floor(n / 1e5) / 10).toFixed(1) + 'M';
  if (n < 1e12) return (Math.floor(n / 1e8) / 10).toFixed(1) + 'B';
  return n.toExponential(1);
}

/** Format a per-second rate. Shows 1 decimal when small, K/M/B suffix otherwise. */
export function formatRate(n: number): string {
  if (n === 0) return '0';
  if (n < 1) return n.toFixed(2);
  if (n < 10) return n.toFixed(1);
  if (n < 1000) return Math.round(n).toString();
  if (n < 1e6) return (n / 1000).toFixed(1) + 'K';
  if (n < 1e9) return (n / 1e6).toFixed(1) + 'M';
  if (n < 1e12) return (n / 1e9).toFixed(1) + 'B';
  return n.toExponential(1);
}

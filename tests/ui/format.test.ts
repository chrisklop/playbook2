import { describe, it, expect } from 'vitest';
import { formatCost, formatResource, formatRate } from '../../src/ui/format';

describe('formatCost — rounds UP (display ≥ actual)', () => {
  it('integer cost displays unchanged', () => {
    expect(formatCost(7)).toBe('7');
    expect(formatCost(100)).toBe('100');
  });

  it('fractional cost rounds UP', () => {
    expect(formatCost(7.35)).toBe('8');
    expect(formatCost(7.01)).toBe('8');
    expect(formatCost(7.99)).toBe('8');
  });

  it('0 displays as "0"', () => {
    expect(formatCost(0)).toBe('0');
  });

  it('K/M/B scales round UP at the 0.1 tier', () => {
    expect(formatCost(1234)).toBe('1.3K'); // 1.234K rounds up to 1.3K
    expect(formatCost(1200)).toBe('1.2K');
    expect(formatCost(1200.1)).toBe('1.3K');
  });
});

describe('formatResource — rounds DOWN (display ≤ actual)', () => {
  it('integer resource displays unchanged', () => {
    expect(formatResource(7)).toBe('7');
    expect(formatResource(100)).toBe('100');
  });

  it('fractional resource rounds DOWN', () => {
    expect(formatResource(7.35)).toBe('7');
    expect(formatResource(7.99)).toBe('7');
    expect(formatResource(0.5)).toBe('0');
  });

  it('K scale rounds DOWN at the 0.1 tier', () => {
    expect(formatResource(1234)).toBe('1.2K'); // 1.234K rounds down to 1.2K
    expect(formatResource(1299)).toBe('1.2K');
  });
});

describe('CRITICAL invariant: displayed_rumor ≥ displayed_cost ⇒ actual_rumor ≥ actual_cost', () => {
  // Sweep a bunch of (rumor, cost) pairs near integer boundaries — the danger zone.
  // For every pair where the visible display would suggest "affordable", verify it really is.
  it.each([
    [6, 7.35],
    [6.4, 7.35],
    [7, 7.35],
    [7.2, 7.35],
    [7.35, 7.35], // exact match
    [10, 14.07],
    [14.06, 14.07],
    [14.07, 14.07],
    [99, 100.001],
    [100, 100.001],
    [1234, 1234.99],
  ])('rumor=%f, cost=%f: if display affordable, actual must be affordable too', (rumor, cost) => {
    const displayedR = parseDisplay(formatResource(rumor));
    const displayedC = parseDisplay(formatCost(cost));
    if (displayedR >= displayedC) {
      // The player sees this as affordable. Actual must also be affordable.
      expect(rumor).toBeGreaterThanOrEqual(cost);
    }
  });

  it.each([
    [6, 7.35],
    [6.4, 7.35],
    [99.5, 100.1],
    [0, 4],
  ])('rumor=%f, cost=%f: when player CAN\'T afford, display must reflect that', (rumor, cost) => {
    if (rumor < cost) {
      const displayedR = parseDisplay(formatResource(rumor));
      const displayedC = parseDisplay(formatCost(cost));
      // Either display also shows unaffordable (R < C), or equal (which is OK because
      // an actually-equal case happens only when rumor === cost == integer).
      const displayShowsUnaffordable = displayedR < displayedC || (displayedR === displayedC && rumor === cost);
      expect(displayShowsUnaffordable).toBe(true);
    }
  });
});

// Helper to parse our formatted strings back into a number for the invariant check.
function parseDisplay(s: string): number {
  if (s.endsWith('K')) return parseFloat(s) * 1000;
  if (s.endsWith('M')) return parseFloat(s) * 1e6;
  if (s.endsWith('B')) return parseFloat(s) * 1e9;
  if (s.includes('e')) return parseFloat(s);
  return parseFloat(s);
}

describe('formatRate — 1 decimal when small', () => {
  it('0 → "0"', () => expect(formatRate(0)).toBe('0'));
  it('small rates show 1 decimal', () => {
    expect(formatRate(1.2)).toBe('1.2');
    expect(formatRate(9.9)).toBe('9.9');
  });
  it('mid rates show whole numbers', () => {
    expect(formatRate(10)).toBe('10');
    expect(formatRate(163.7)).toBe('164');
  });
});

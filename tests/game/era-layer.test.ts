import { describe, it, expect } from 'vitest';
import { computeCost, computeBulkCost } from '../../src/game/era-layer';

describe('era-layer math', () => {
  it('computeCost(base=100, growth=1.07, owned=10) ≈ 196.715', () => {
    expect(computeCost(100, 1.07, 10)).toBeCloseTo(100 * Math.pow(1.07, 10), 4);
  });

  it('computeBulkCost matches sum of individual costs', () => {
    const base = 100, growth = 1.10, owned = 5, n = 7;
    let expected = 0;
    for (let i = 0; i < n; i++) expected += base * Math.pow(growth, owned + i);
    expect(computeBulkCost(base, growth, owned, n)).toBeCloseTo(expected, 4);
  });

  it('returns 0 for n=0', () => {
    expect(computeBulkCost(100, 1.07, 10, 0)).toBe(0);
  });
});

import { describe, it, expect } from 'vitest';
import { maxAffordableBulk, computeBulkCost } from '../../src/game/era-layer';

describe('maxAffordableBulk — closed-form max buys', () => {
  it('returns 0 when available < cost of next single buy', () => {
    // base=100, growth=1.10, owned=0 → cost(0) = 100. Available = 50 → can't afford 1.
    expect(maxAffordableBulk(100, 1.10, 0, 50)).toBe(0);
  });

  it('returns 1 when can afford exactly one', () => {
    // cost(0)=100, cost(1)=110. Available = 105 → can afford 1, not 2.
    expect(maxAffordableBulk(100, 1.10, 0, 105)).toBe(1);
  });

  it('returns N when can afford exactly N', () => {
    const exact = computeBulkCost(100, 1.10, 0, 5);
    expect(maxAffordableBulk(100, 1.10, 0, exact)).toBe(5);
    expect(maxAffordableBulk(100, 1.10, 0, exact - 0.01)).toBe(4);
  });

  it('handles large quantities (200 buys)', () => {
    const cost = computeBulkCost(10, 1.07, 0, 200);
    expect(maxAffordableBulk(10, 1.07, 0, cost)).toBe(200);
    expect(maxAffordableBulk(10, 1.07, 0, cost - 1)).toBe(199);
  });

  it('respects existing owned offset', () => {
    const start = 10;
    const exactFor3 = computeBulkCost(100, 1.10, start, 3);
    expect(maxAffordableBulk(100, 1.10, start, exactFor3)).toBe(3);
  });

  it('returns 0 cleanly when available is 0', () => {
    expect(maxAffordableBulk(100, 1.10, 0, 0)).toBe(0);
  });
});

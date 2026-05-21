import { describe, it, expect } from 'vitest';
import { computeMemeticInheritance } from '../../src/game/prestige';

describe('computeMemeticInheritance — AdCap sqrt formula', () => {
  it('zero lifetime → 0 MI', () => {
    expect(computeMemeticInheritance(0)).toBe(0);
  });
  it('lifetime = pivot (1e15) → 150 MI', () => {
    expect(computeMemeticInheritance(1e15)).toBeCloseTo(150, 4);
  });
  it('lifetime = 4× pivot → 300 MI (sqrt doubles at 4×)', () => {
    expect(computeMemeticInheritance(4e15)).toBeCloseTo(300, 4);
  });
  it('lifetime = 100× pivot → 1500 MI', () => {
    expect(computeMemeticInheritance(1e17)).toBeCloseTo(1500, 4);
  });
});

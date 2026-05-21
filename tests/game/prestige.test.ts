import { describe, it, expect } from 'vitest';
import { computeMemeticInheritance, carryoverMultiplier, DEFAULT_PRESTIGE_PIVOT } from '../../src/game/prestige';

describe('computeMemeticInheritance — AdCap sqrt formula with per-era pivot', () => {
  it('zero lifetime → 0 MI regardless of pivot', () => {
    expect(computeMemeticInheritance(0, 1e12)).toBe(0);
    expect(computeMemeticInheritance(0, 1e15)).toBe(0);
  });

  it('lifetime = pivot → 150 MI', () => {
    expect(computeMemeticInheritance(1e12, 1e12)).toBeCloseTo(150, 4);
    expect(computeMemeticInheritance(1e15, 1e15)).toBeCloseTo(150, 4);
  });

  it('lifetime = 4× pivot → 300 MI (sqrt doubles at 4×)', () => {
    expect(computeMemeticInheritance(4e12, 1e12)).toBeCloseTo(300, 4);
    expect(computeMemeticInheritance(4e15, 1e15)).toBeCloseTo(300, 4);
  });

  it('lifetime = 100× pivot → 1500 MI', () => {
    expect(computeMemeticInheritance(1e14, 1e12)).toBeCloseTo(1500, 4);
  });

  it('default pivot is 1e12 when not specified', () => {
    expect(computeMemeticInheritance(1e12)).toBeCloseTo(150, 4);
    expect(DEFAULT_PRESTIGE_PIVOT).toBe(1e12);
  });
});

describe('carryoverMultiplier', () => {
  it('mi=0 → 1.0', () => expect(carryoverMultiplier(0)).toBe(1));
  it('mi=50 → 2.0 (1 + 50 × 0.02)', () => expect(carryoverMultiplier(50)).toBeCloseTo(2.0, 4));
  it('mi=150 → 4.0 (1 + 150 × 0.02)', () => expect(carryoverMultiplier(150)).toBeCloseTo(4.0, 4));
});

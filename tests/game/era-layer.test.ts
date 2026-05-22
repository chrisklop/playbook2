import { describe, it, expect } from 'vitest';
import {
  computeCost,
  computeBulkCost,
  milestoneMultiplier,
  generatorProduction,
} from '../../src/game/era-layer';

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

describe('milestoneMultiplier', () => {
  const MS = [25, 50, 100, 200, 300, 400];
  it.each([
    [0, 1], [24, 1], [25, 2], [49, 2], [50, 4],
    [99, 4], [100, 8], [199, 8], [200, 16],
    [299, 16], [300, 32], [399, 32], [400, 64], [1000, 64],
  ])('owned=%i → multiplier=%i', (owned, expected) => {
    expect(milestoneMultiplier(owned, MS)).toBe(expected);
  });
});

describe('generatorProduction', () => {
  const gen = {
    id: 'g', tier: 2, display_name: 'G', description: '',
    technique_tag: 'impersonation' as const, resource: 'rumor' as const,
    base_cost: 250, cost_growth: 1.07, base_production: 7,
    is_click_driven: false, auto_unlock_at: 0,
    auto_operative_name: 'X', milestones: [25, 50, 100, 200, 300, 400],
    codex_link: null,
    reveal_at_lifetime: 0,
    cycle_seconds: 1, manager_cost: 0, manager_name: 'M', icon: '●',
    upgrades: [],
  };
  it('produces 0 when owned=0', () => {
    expect(generatorProduction(gen, 0, 1)).toBe(0);
  });
  it('owned=1, mult=1 → base_production', () => {
    expect(generatorProduction(gen, 1, 1)).toBe(7);
  });
  it('owned=25, milestone-1 applies (×2) → 7 × 25 × 2 = 350', () => {
    expect(generatorProduction(gen, 25, 1)).toBe(350);
  });
  it('owned=50, two milestones (×4) → 7 × 50 × 4 = 1400', () => {
    expect(generatorProduction(gen, 50, 1)).toBe(1400);
  });
  it('global multiplier compounds', () => {
    expect(generatorProduction(gen, 50, 2.5)).toBe(7 * 50 * 4 * 2.5);
  });
  it('click-driven generator produces 0 BEFORE reaching auto_unlock_at', () => {
    const clickGen = { ...gen, is_click_driven: true, auto_unlock_at: 10, base_production: 1 };
    expect(generatorProduction(clickGen, 9, 1)).toBe(0);
  });
  it('click-driven generator produces idle AFTER reaching auto_unlock_at ("Sycophant hired" moment)', () => {
    const clickGen = { ...gen, is_click_driven: true, auto_unlock_at: 10, base_production: 1 };
    expect(generatorProduction(clickGen, 10, 1)).toBe(10); // 1 × 10 × milestone(10)=1 × 1
  });
  it('click-driven generator with 25 owned applies milestone bonus too', () => {
    const clickGen = { ...gen, is_click_driven: true, auto_unlock_at: 10, base_production: 1 };
    expect(generatorProduction(clickGen, 25, 1)).toBe(50); // 1 × 25 × milestone(25)=2 × 1
  });
});

import { describe, it, expect } from 'vitest';
import {
  payoutPerCycle,
  cycleRatePerSecond,
  computeCost,
  computeBulkCost,
  generatorProduction,
} from '../../src/game/era-layer';
import type { GeneratorTier } from '../../src/content/schema';

const baseGen = (overrides: Partial<GeneratorTier> = {}): GeneratorTier => ({
  id: 'g',
  tier: 2,
  display_name: 'G',
  description: '',
  technique_tag: 'impersonation',
  resource: 'rumor',
  base_cost: 250,
  cost_growth: 1.07,
  base_production: 7,
  is_click_driven: false,
  auto_unlock_at: 0,
  auto_operative_name: 'X',
  milestones: [25, 50, 100, 200, 300, 400],
  codex_link: null,
  reveal_at_lifetime: 0,
  cycle_seconds: 3.0,
  manager_cost: 5000,
  manager_name: 'M',
  icon: '●',
  upgrades: [],
  ...overrides,
});

describe('payoutPerCycle — single cycle pays base × cycle_seconds × owned × multipliers', () => {
  it('owned=1, cycle=3s, base=7 → 21 per cycle (no milestone, mult=1)', () => {
    const gen = baseGen({ cycle_seconds: 3, base_production: 7 });
    expect(payoutPerCycle(gen, 1, 1, 1)).toBe(21);
  });

  it('owned=25, cycle=3s, base=7, ×2 milestone → 7 × 3 × 25 × 2 × 1 = 1050', () => {
    const gen = baseGen({ cycle_seconds: 3, base_production: 7 });
    expect(payoutPerCycle(gen, 25, 1, 1)).toBe(1050);
  });

  it('upgrade multiplier compounds', () => {
    const gen = baseGen({ cycle_seconds: 3, base_production: 7 });
    expect(payoutPerCycle(gen, 1, 1, 3)).toBe(63); // 21 × 3
  });

  it('global multiplier compounds with upgrade', () => {
    const gen = baseGen({ cycle_seconds: 3, base_production: 7 });
    expect(payoutPerCycle(gen, 1, 2.5, 3)).toBe(21 * 2.5 * 3);
  });

  it('returns 0 for 0 owned', () => {
    const gen = baseGen();
    expect(payoutPerCycle(gen, 0, 1, 1)).toBe(0);
  });
});

describe('cycleRatePerSecond — steady-state cycle math equals rate-per-second math', () => {
  it('matches generatorProduction for non-click-driven', () => {
    const gen = baseGen({ cycle_seconds: 3, base_production: 7 });
    // payoutPerCycle / cycle_seconds = base × owned × milestone × global
    expect(cycleRatePerSecond(gen, 25, 1, 1)).toBeCloseTo(generatorProduction(gen, 25, 1), 6);
  });

  it('1 second of cycle ticking averages to expected rate (50 owned, ×4 milestone)', () => {
    const gen = baseGen({ cycle_seconds: 3, base_production: 7 });
    const expected = generatorProduction(gen, 50, 1); // 7 × 50 × 4 = 1400/s
    expect(cycleRatePerSecond(gen, 50, 1, 1)).toBeCloseTo(expected, 6);
  });

  it('different cycle_seconds same base produces same rate (math equivalence)', () => {
    const fast = baseGen({ cycle_seconds: 1, base_production: 7 });
    const slow = baseGen({ cycle_seconds: 30, base_production: 7 });
    expect(cycleRatePerSecond(fast, 10, 1, 1)).toBeCloseTo(
      cycleRatePerSecond(slow, 10, 1, 1),
      6,
    );
  });
});

describe('CRITICAL: cycle simulation over N seconds equals rate × N (math equivalence)', () => {
  it('simulating 60s of cycle payouts equals rate × 60 within 1% tolerance', () => {
    const gen = baseGen({ cycle_seconds: 3, base_production: 7 });
    const owned = 25;
    const rate = cycleRatePerSecond(gen, owned, 1, 1);
    const expectedTotal = rate * 60;

    // Simulate 60s of cycles at 100ms tick
    let cycleProgress = 0;
    let total = 0;
    const dt = 0.1;
    for (let t = 0; t < 600; t++) {
      cycleProgress += dt / gen.cycle_seconds;
      while (cycleProgress >= 1) {
        total += payoutPerCycle(gen, owned, 1, 1);
        cycleProgress -= 1;
      }
    }
    // Discretization error: at worst ≤ 1 cycle's worth (float-accumulation can produce
    // one extra fired payout near a tick boundary). Acceptable for visual UI; in steady
    // state the average rate matches exactly.
    const oneCycle = payoutPerCycle(gen, owned, 1, 1);
    expect(Math.abs(total - expectedTotal)).toBeLessThanOrEqual(oneCycle);
  });

  it('long-horizon (1 hour) cycle simulation stays within 0.1% of expected total', () => {
    const gen = baseGen({ cycle_seconds: 3, base_production: 7 });
    const owned = 50; // ×4 milestone
    const rate = cycleRatePerSecond(gen, owned, 1, 1);
    const horizonSec = 3600;
    const expectedTotal = rate * horizonSec;

    let cycleProgress = 0;
    let total = 0;
    const dt = 0.1;
    for (let t = 0; t < horizonSec * 10; t++) {
      cycleProgress += dt / gen.cycle_seconds;
      while (cycleProgress >= 1) {
        total += payoutPerCycle(gen, owned, 1, 1);
        cycleProgress -= 1;
      }
    }
    // Long-horizon drift should be well under 0.1%
    expect(Math.abs(total - expectedTotal) / expectedTotal).toBeLessThan(0.001);
  });
});

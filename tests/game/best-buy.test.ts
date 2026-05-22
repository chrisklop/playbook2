import { describe, it, expect } from 'vitest';
import { pickOptimalGenerator } from '../../src/game/era-layer';
import type { GeneratorTier } from '../../src/content/schema';

const baseGen = (overrides: Partial<GeneratorTier>): GeneratorTier => ({
  id: 'g',
  tier: 1,
  display_name: 'G',
  description: '',
  technique_tag: 'impersonation',
  resource: 'rumor',
  base_cost: 100,
  cost_growth: 1.10,
  base_production: 1,
  is_click_driven: false,
  auto_unlock_at: 0,
  auto_operative_name: 'X',
  milestones: [25, 50, 100, 200, 300, 400],
  codex_link: null,
  reveal_at_lifetime: 0,
  cycle_seconds: 1,
  manager_cost: 0,
  manager_name: 'M',
  icon: '●',
  upgrades: [],
  ...overrides,
});

const state = (rumor: number, owned: Record<string, number> = {}) => ({
  rumor,
  ownedByGenerator: owned,
});

describe('pickOptimalGenerator — Pecorella overtake heuristic', () => {
  it('returns null for empty candidate list', () => {
    expect(pickOptimalGenerator([], state(0), 1)).toBe(null);
  });

  it('returns the only candidate', () => {
    const a = baseGen({ id: 'a' });
    expect(pickOptimalGenerator([a], state(50), 1)).toBe('a');
  });

  it('prefers the cheaper of two equal-rate candidates', () => {
    const a = baseGen({ id: 'a', base_cost: 100, base_production: 10 });
    const b = baseGen({ id: 'b', base_cost: 500, base_production: 10 });
    expect(pickOptimalGenerator([a, b], state(0), 1)).toBe('a');
  });

  it('prefers higher-tier (better rate-per-cost) when both affordable', () => {
    // a: cost/prod = 100, b: cost/prod = 20 → b wins.
    const a = baseGen({ id: 'a', base_cost: 100, base_production: 1 });
    const b = baseGen({ id: 'b', base_cost: 1000, base_production: 50 });
    expect(pickOptimalGenerator([a, b], state(10000), 1)).toBe('b');
  });

  it('avoids click-driven generators that have not auto-unlocked', () => {
    // Tier-1 click-driven under threshold contributes 0 delta. Idle generator wins.
    const click = baseGen({
      id: 'click', is_click_driven: true, auto_unlock_at: 10, base_cost: 10, base_production: 1,
    });
    const idle = baseGen({ id: 'idle', base_cost: 100, base_production: 5 });
    expect(pickOptimalGenerator([click, idle], state(1000, { click: 5 }), 1)).toBe('idle');
  });
});

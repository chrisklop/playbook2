import { describe, it, expect } from 'vitest';
import {
  PER_LEVEL_BONUS,
  multiplierForLevel,
  multiplierForTechnique,
} from '../../src/game/mastery';

describe('mastery', () => {
  it('level 0 produces no bonus', () => {
    expect(multiplierForLevel(0)).toBe(1);
  });

  it('each level adds PER_LEVEL_BONUS', () => {
    expect(multiplierForLevel(1)).toBeCloseTo(1 + PER_LEVEL_BONUS, 10);
    expect(multiplierForLevel(5)).toBeCloseTo(1 + 5 * PER_LEVEL_BONUS, 10);
    expect(multiplierForLevel(20)).toBeCloseTo(1 + 20 * PER_LEVEL_BONUS, 10);
  });

  it('clamps negative levels to 0', () => {
    expect(multiplierForLevel(-1)).toBe(1);
    expect(multiplierForLevel(-99)).toBe(1);
  });

  it('multiplierForTechnique falls back to 1 for unknown tags', () => {
    expect(multiplierForTechnique({}, 'big-lie')).toBe(1);
    expect(multiplierForTechnique({ emotion: 3 }, 'big-lie')).toBe(1);
  });

  it('multiplierForTechnique reads the right tag', () => {
    const m = { emotion: 3, trolling: 7 };
    expect(multiplierForTechnique(m, 'emotion')).toBeCloseTo(1.15, 10);
    expect(multiplierForTechnique(m, 'trolling')).toBeCloseTo(1.35, 10);
  });
});

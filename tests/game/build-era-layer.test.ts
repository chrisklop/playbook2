import { describe, it, expect } from 'vitest';
import { buildEraLayer, type EraLayerState } from '../../src/game/build-era-layer';
import { loadEra } from '../../src/content/loader';
import { readFileSync } from 'node:fs';

const antiquity = loadEra(
  JSON.parse(readFileSync('src/content/eras/01-antiquity/era.json', 'utf-8'))
);

function freshState(): EraLayerState {
  return {
    ownedByGenerator: {},
    lifetimeRumor: 0,
    rumor: 0,
    globalMultiplier: 1,
  };
}

describe('buildEraLayer — Antiquity', () => {
  it('onClick adds 1 to rumor and lifetime', () => {
    const layer = buildEraLayer(antiquity, 0);
    const s = freshState();
    layer.onClick(s);
    expect(s.rumor).toBe(1);
    expect(s.lifetimeRumor).toBe(1);
  });

  it('onTick with no generators owned yields no income', () => {
    const layer = buildEraLayer(antiquity, 0);
    const s = freshState();
    layer.onTick(s, 1);
    expect(s.rumor).toBe(0);
  });

  it('onTick with 1 forge-naru-tablet owned yields base_production per second', () => {
    const layer = buildEraLayer(antiquity, 0);
    const s = freshState();
    s.ownedByGenerator['forge-naru-tablet'] = 1;
    layer.onTick(s, 1);
    expect(s.rumor).toBe(7);
  });

  it('Tier-1 auto-unlock at 10 owned does not throw', () => {
    const layer = buildEraLayer(antiquity, 0);
    const s = freshState();
    s.ownedByGenerator['spread-rumor'] = 10;
    expect(() => layer.onTick(s, 1)).not.toThrow();
  });

  it('performPrestige returns MI based on lifetime and the era pivot', () => {
    const layer = buildEraLayer(antiquity, 0);
    const s = freshState();
    // When lifetime == pivot, MI should equal the coefficient (150).
    s.lifetimeRumor = antiquity.prestige_pivot;
    const mi = layer.performPrestige(s);
    expect(mi).toBeCloseTo(150, 4);
  });

  it('carryover multiplier applies when mi > 0', () => {
    const layer = buildEraLayer(antiquity, 50); // MI = 50 → globalMult = 1 + 50*0.02 = 2.0
    expect(layer.globalMultiplier).toBeCloseTo(2.0, 4);
    const s = freshState();
    s.ownedByGenerator['forge-naru-tablet'] = 1;
    layer.onTick(s, 1);
    // With 2× global mult: 7 × 1 × milestone(1)=1 × 2.0 = 14
    expect(s.rumor).toBeCloseTo(14, 4);
  });
});

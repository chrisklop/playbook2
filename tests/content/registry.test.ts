import { describe, it, expect } from 'vitest';
import { registry, getEra } from '../../src/content/registry';

describe('content registry', () => {
  it('loads Antiquity at boot', () => {
    const a = getEra('antiquity');
    expect(a.era.id).toBe('antiquity');
    expect(a.era.generators).toHaveLength(5);
  });

  it('Antiquity theme is loaded and valid', () => {
    const a = getEra('antiquity');
    expect(a.theme.id).toBe('antiquity-cinzel');
    expect(a.theme.palette.background).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('Antiquity ticker has at least 6 quotes', () => {
    const a = getEra('antiquity');
    expect(a.ticker.quotes.length).toBeGreaterThanOrEqual(6);
  });

  it('Antiquity copy has masthead title', () => {
    const a = getEra('antiquity');
    expect(a.copy.masthead_title).toBeTruthy();
  });

  it('registry exposes all loaded era ids', () => {
    expect(registry.eraIds).toContain('antiquity');
  });

  it('getEra throws on unknown id', () => {
    expect(() => getEra('not-an-era')).toThrow(/not-an-era/);
  });
});

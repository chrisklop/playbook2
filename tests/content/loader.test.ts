import { describe, it, expect } from 'vitest';
import { loadEra, ContentValidationError } from '../../src/content/loader';

describe('loadEra', () => {
  it('throws ContentValidationError when era.json is missing required fields', () => {
    const invalid = { id: 'antiquity' };
    expect(() => loadEra(invalid)).toThrow(ContentValidationError);
  });

  it('returns parsed era when content is valid', () => {
    const valid = {
      id: 'antiquity',
      ordinal: 1,
      date_range: '~3000 BCE – 500 CE',
      display_name: 'Antiquity',
      theme_id: 'antiquity-cinzel',
      techniques_unlocked: ['impersonation', 'discrediting'],
      generators: [
        {
          id: 'spread-rumor',
          tier: 1,
          display_name: 'Spread Rumor',
          description: 'Whisper to a passerby.',
          technique_tag: 'impersonation',
          resource: 'rumor',
          base_cost: 0,
          cost_growth: 1.07,
          base_production: 0,
          is_click_driven: true,
          auto_unlock_at: 10,
          auto_operative_name: 'Sycophant',
          milestones: [25, 50, 100, 200, 300, 400],
          codex_link: null,
        },
        {
          id: 'forge-naru',
          tier: 2,
          display_name: 'Forge Naru Tablet',
          description: 'Backdate your own legend.',
          technique_tag: 'impersonation',
          resource: 'rumor',
          base_cost: 250,
          cost_growth: 1.07,
          base_production: 7,
          is_click_driven: false,
          auto_unlock_at: 0,
          auto_operative_name: 'Scribe',
          milestones: [25, 50, 100, 200, 300, 400],
          codex_link: 'sargon-naru-tradition',
        },
      ],
      prestige_into: 'printing-press',
      prestige_bridge_copy: 'The tablets crumble; the playbook does not.',
    };
    const era = loadEra(valid);
    expect(era.id).toBe('antiquity');
    expect(era.generators).toHaveLength(2);
  });

  it('rejects cost_growth outside 1.07–1.20', () => {
    const bad = {
      id: 'antiquity', ordinal: 1, date_range: '~3000 BCE',
      display_name: 'Antiquity', theme_id: 't', techniques_unlocked: ['impersonation'],
      generators: [{
        id: 'g', tier: 1, display_name: 'G', description: 'D',
        technique_tag: 'impersonation', resource: 'rumor',
        base_cost: 1, cost_growth: 1.05, base_production: 1,
        is_click_driven: false, auto_unlock_at: 0,
        auto_operative_name: 'X', milestones: [25], codex_link: null,
      }, {
        id: 'h', tier: 2, display_name: 'H', description: 'D',
        technique_tag: 'impersonation', resource: 'rumor',
        base_cost: 1, cost_growth: 1.10, base_production: 1,
        is_click_driven: false, auto_unlock_at: 0,
        auto_operative_name: 'X', milestones: [25], codex_link: null,
      }],
      prestige_into: null, prestige_bridge_copy: '.',
    };
    expect(() => loadEra(bad)).toThrow(/cost_growth/);
  });
});

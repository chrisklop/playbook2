import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { simulateEra } from '../../src/game/simulator';
import { loadEra } from '../../src/content/loader';

const antiquity = loadEra(
  JSON.parse(readFileSync('src/content/eras/01-antiquity/era.json', 'utf-8')),
);
const printingPress = loadEra(
  JSON.parse(readFileSync('src/content/eras/02-printing-press/era.json', 'utf-8')),
);
const pennyPress = loadEra(
  JSON.parse(readFileSync('src/content/eras/03-penny-press/era.json', 'utf-8')),
);

describe('Era 1 (Antiquity) reachability invariants', () => {
  it('first auto-unlock fires within 2 minutes of fresh start', () => {
    const r = simulateEra(antiquity, { horizon_sec: 60 * 60 });
    expect(r.time_to_first_auto_unlock_sec).not.toBeNull();
    expect(r.time_to_first_auto_unlock_sec!).toBeLessThan(120);
  });

  it('first prestige is reachable in 20-90 minutes', () => {
    const r = simulateEra(antiquity, { horizon_sec: 90 * 60 });
    expect(r.time_to_first_prestige_sec).not.toBeNull();
    expect(r.time_to_first_prestige_sec!).toBeGreaterThan(20 * 60);
    expect(r.time_to_first_prestige_sec!).toBeLessThan(90 * 60);
  });

  it('every generator is the best buy at least once during the first prestige run', () => {
    const r = simulateEra(antiquity, { horizon_sec: 90 * 60, stop_on_first_prestige: true });
    for (const gen of antiquity.generators) {
      expect(r.times_each_gen_was_best_buy[gen.id]).toBeGreaterThan(0);
    }
  });

  it('every generator gets purchased at least once during first prestige run', () => {
    const r = simulateEra(antiquity, { horizon_sec: 90 * 60, stop_on_first_prestige: true });
    for (const gen of antiquity.generators) {
      expect(r.time_to_each_generator_purchase_sec[gen.id]).not.toBeNull();
    }
  });
});

describe('Era 2 (Printing Press) reachability invariants', () => {
  it('first auto-unlock fires within 2 minutes of fresh start', () => {
    const r = simulateEra(printingPress, { horizon_sec: 60 * 60 });
    expect(r.time_to_first_auto_unlock_sec).not.toBeNull();
    expect(r.time_to_first_auto_unlock_sec!).toBeLessThan(120);
  });

  it('first prestige is reachable in 20-90 minutes', () => {
    const r = simulateEra(printingPress, { horizon_sec: 90 * 60 });
    expect(r.time_to_first_prestige_sec).not.toBeNull();
    expect(r.time_to_first_prestige_sec!).toBeGreaterThan(20 * 60);
    expect(r.time_to_first_prestige_sec!).toBeLessThan(90 * 60);
  });

  it('every generator is the best buy at least once during the first prestige run', () => {
    const r = simulateEra(printingPress, { horizon_sec: 90 * 60, stop_on_first_prestige: true });
    for (const gen of printingPress.generators) {
      expect(r.times_each_gen_was_best_buy[gen.id]).toBeGreaterThan(0);
    }
  });

  it('every generator gets purchased at least once during first prestige run', () => {
    const r = simulateEra(printingPress, { horizon_sec: 90 * 60, stop_on_first_prestige: true });
    for (const gen of printingPress.generators) {
      expect(r.time_to_each_generator_purchase_sec[gen.id]).not.toBeNull();
    }
  });
});

describe('Era 3 (Penny Press) reachability invariants', () => {
  it('first auto-unlock fires within 2 minutes of fresh start', () => {
    const r = simulateEra(pennyPress, { horizon_sec: 60 * 60 });
    expect(r.time_to_first_auto_unlock_sec).not.toBeNull();
    expect(r.time_to_first_auto_unlock_sec!).toBeLessThan(120);
  });

  it('first prestige is reachable in 20-90 minutes', () => {
    const r = simulateEra(pennyPress, { horizon_sec: 90 * 60 });
    expect(r.time_to_first_prestige_sec).not.toBeNull();
    expect(r.time_to_first_prestige_sec!).toBeGreaterThan(20 * 60);
    expect(r.time_to_first_prestige_sec!).toBeLessThan(90 * 60);
  });

  it('every generator is the best buy at least once during the first prestige run', () => {
    const r = simulateEra(pennyPress, { horizon_sec: 90 * 60, stop_on_first_prestige: true });
    for (const gen of pennyPress.generators) {
      expect(r.times_each_gen_was_best_buy[gen.id]).toBeGreaterThan(0);
    }
  });

  it('every generator gets purchased at least once during first prestige run', () => {
    const r = simulateEra(pennyPress, { horizon_sec: 90 * 60, stop_on_first_prestige: true });
    for (const gen of pennyPress.generators) {
      expect(r.time_to_each_generator_purchase_sec[gen.id]).not.toBeNull();
    }
  });
});

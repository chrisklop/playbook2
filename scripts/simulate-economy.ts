import { readFileSync } from 'node:fs';
import { loadEra } from '../src/content/loader';
import { simulateEra, type SimEvent } from '../src/game/simulator';

const eraId = process.argv[2] ?? 'antiquity';
const eraDirs: Record<string, string> = {
  antiquity: 'src/content/eras/01-antiquity/era.json',
  'printing-press': 'src/content/eras/02-printing-press/era.json',
  'penny-press': 'src/content/eras/03-penny-press/era.json',
};
const path = eraDirs[eraId];
if (!path) {
  console.error(`Unknown era: ${eraId}. Known: ${Object.keys(eraDirs).join(', ')}`);
  process.exit(1);
}

const era = loadEra(JSON.parse(readFileSync(path, 'utf-8')));
const HORIZON = 60 * 60;
const CLICKS = 5;

const result = simulateEra(era, {
  horizon_sec: HORIZON,
  clicks_per_sec: CLICKS,
  initial_mi: 0,
  stop_on_first_prestige: false,
});

function fmtT(t: number): string {
  const total = Math.max(0, t);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${String(m).padStart(2, '0')}:${s.toFixed(1).padStart(4, '0')}`;
}

function fmtN(n: number): string {
  if (!isFinite(n)) return String(n);
  if (Math.abs(n) >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(2) + 'K';
  if (Math.abs(n) < 1 && n !== 0) return n.toFixed(3);
  return n.toFixed(2);
}

console.log(`=== Era: ${era.display_name} ===`);
console.log(`Horizon: ${HORIZON / 60} min (${HORIZON} sec)`);
console.log(`Clicks/sec: ${CLICKS}`);
console.log(`Initial MI: 0`);
console.log();
console.log('Timeline:');
console.log(`  t=${fmtT(0)}  CLICK START (rumor: 0)`);

// Compress: print up to first ~80 events, then every Nth.
const events = result.events;
const PRINT_LIMIT = 200;
const printIdxs: number[] = [];
if (events.length <= PRINT_LIMIT) {
  for (let i = 0; i < events.length; i++) printIdxs.push(i);
} else {
  // First 60, last 60, sample the rest.
  const head = 60;
  const tail = 60;
  for (let i = 0; i < head; i++) printIdxs.push(i);
  const middleN = PRINT_LIMIT - head - tail;
  const middleStart = head;
  const middleEnd = events.length - tail;
  const step = Math.max(1, Math.floor((middleEnd - middleStart) / middleN));
  for (let i = middleStart; i < middleEnd; i += step) printIdxs.push(i);
  for (let i = events.length - tail; i < events.length; i++) printIdxs.push(i);
}

let lastPrinted = -1;
for (const i of printIdxs) {
  if (i <= lastPrinted) continue;
  lastPrinted = i;
  const ev = events[i];
  console.log('  ' + formatEvent(ev));
}

console.log();
console.log('Summary:');
console.log(`  Final rumor: ${fmtN(result.final_state.rumor)}`);
console.log(`  Lifetime rumor: ${fmtN(result.lifetime_rumor_at_horizon)}`);
console.log(`  Owned: ${JSON.stringify(result.final_state.ownedByGenerator)}`);
console.log(`  Projected MI at horizon: ${fmtN(result.projected_mi_at_horizon)}`);
console.log(
  `  Time to first auto-unlock: ${result.time_to_first_auto_unlock_sec === null ? 'NEVER' : fmtT(result.time_to_first_auto_unlock_sec)}`,
);
console.log(
  `  Time to first prestige: ${result.time_to_first_prestige_sec === null ? 'NEVER (target: 20-60 min)' : fmtT(result.time_to_first_prestige_sec) + ' (target: 20-60 min)'}`,
);
console.log(`  Times each generator was best buy:`);
for (const g of era.generators) {
  const purchaseTime = result.time_to_each_generator_purchase_sec[g.id];
  console.log(
    `    ${g.id.padEnd(28)} best=${String(result.times_each_gen_was_best_buy[g.id]).padStart(5)} ` +
      `bought=${String(result.final_state.ownedByGenerator[g.id] ?? 0).padStart(4)} ` +
      `first@${purchaseTime === null ? 'NEVER' : fmtT(purchaseTime)}`,
  );
}
console.log(`  Total events: ${events.length}, simulation iterations completed.`);

function formatEvent(ev: SimEvent): string {
  const t = `t=${fmtT(ev.t_sec)}`;
  switch (ev.type) {
    case 'click':
      return `${t}  CLICK (rumor: ${fmtN(ev.rumor)})`;
    case 'purchase':
      return `${t}  PURCHASE ${ev.gen_id.padEnd(22)} (cost: ${fmtN(ev.cost).padStart(10)}) owned: ${ev.owned_after}`;
    case 'auto_unlock':
      return `${t}  AUTO-UNLOCK ${ev.gen_id} -> ${ev.operative}`;
    case 'milestone':
      return `${t}  MILESTONE ${ev.gen_id} x${ev.multiplier} at ${ev.owned} owned`;
    case 'prestige_available':
      return `${t}  PRESTIGE AVAILABLE -- projected MI: ${fmtN(ev.projected_mi)}`;
    case 'stop':
      return `${t}  STOP (${ev.reason})`;
  }
}

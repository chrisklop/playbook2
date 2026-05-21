import { readFileSync } from 'node:fs';
import { loadEra } from '../src/content/loader';
import { simulateEra } from '../src/game/simulator';

const eraId = process.argv[2] || 'antiquity';
const pivot = parseFloat(process.argv[3] || '1e12');

const raw = JSON.parse(readFileSync(`src/content/eras/${
  eraId === 'antiquity' ? '01-antiquity' :
  eraId === 'printing-press' ? '02-printing-press' :
  '03-penny-press'
}/era.json`, 'utf-8'));
raw.prestige_pivot = pivot;

const era = loadEra(raw);
const result = simulateEra(era, { horizon_sec: 90 * 60, stop_on_first_prestige: true, initial_mi: 0 });

console.log(`Era: ${era.display_name}  pivot=${pivot.toExponential(2)}`);
console.log(`  Time to first prestige: ${result.time_to_first_prestige_sec
  ? `${Math.floor(result.time_to_first_prestige_sec / 60)}:${String(Math.floor(result.time_to_first_prestige_sec % 60)).padStart(2, '0')}`
  : 'NEVER (90min horizon)'}`);
console.log(`  Lifetime rumor at end: ${result.final_state.lifetimeRumor.toExponential(3)}`);
console.log(`  Projected MI at end: ${result.projected_mi_at_horizon.toFixed(2)}`);

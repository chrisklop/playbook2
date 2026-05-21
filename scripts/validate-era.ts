import { readFileSync } from 'node:fs';
import { loadEra } from '../src/content/loader';

const path = process.argv[2];
if (!path) {
  console.error('usage: validate-era <path-to-era.json>');
  process.exit(1);
}
const raw = JSON.parse(readFileSync(path, 'utf-8'));
loadEra(raw);
console.log(`✓ ${path} validates`);

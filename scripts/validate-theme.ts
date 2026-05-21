import { readFileSync } from 'node:fs';
import { ThemeSchema } from '../src/content/schema';

const path = process.argv[2];
if (!path) {
  console.error('usage: validate-theme <path>');
  process.exit(1);
}
const raw = JSON.parse(readFileSync(path, 'utf-8'));
const result = ThemeSchema.safeParse(raw);
if (!result.success) {
  console.error(result.error.format());
  process.exit(1);
}
console.log(`✓ ${path} validates`);

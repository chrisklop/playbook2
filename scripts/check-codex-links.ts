import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parseCodexEntry } from '../src/content/codex-parser';

const CONTENT_ROOT = 'src/content/eras';

function findCodexFiles(dir: string): string[] {
  const out: string[] = [];
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        out.push(...findCodexFiles(full));
      } else if (entry.endsWith('.md') && full.includes('/codex/')) {
        out.push(full);
      }
    }
  } catch (err) {
    // Directory may not exist yet (no era content authored). That's fine.
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }
  return out;
}

async function checkUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    return res.ok || res.status === 405; // 405 = HEAD not allowed, treat as reachable
  } catch {
    return false;
  }
}

async function main() {
  const files = findCodexFiles(CONTENT_ROOT);
  console.log(`Found ${files.length} codex files`);
  let failed = 0;
  for (const file of files) {
    const raw = readFileSync(file, 'utf-8');
    const entry = parseCodexEntry(raw);
    for (const src of entry.frontmatter.sources) {
      process.stdout.write(`  ${src.url} ... `);
      const ok = await checkUrl(src.url);
      console.log(ok ? 'OK' : 'FAIL');
      if (!ok) failed++;
    }
  }
  if (failed > 0) {
    console.error(`\n${failed} dead link(s) found.`);
    process.exit(1);
  }
  console.log('\nAll links reachable.');
}

main();

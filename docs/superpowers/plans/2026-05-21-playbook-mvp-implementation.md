# Playbook MVP — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a playable mobile-first PWA covering 3 eras (Antiquity → Printing Press → Penny Press) of *Playbook*, a content-driven idle game about the history of disinformation, anchored to AdVenture-Capitalist math.

**Architecture:** Profectus (Vue 3 + TS + Vite) game engine; era content authored as JSON + Markdown conforming to a typed schema validated at load time; theme tokens swap typography/palette per era; PWA via vite-plugin-pwa; localStorage saves compressed with lz-string.

**Tech Stack:** Profectus engine, TypeScript, Vue 3, Vite, break_eternity.js (Decimal), zod (schema validation), lz-string (save compression), vite-plugin-pwa, Google Fonts.

**Reference docs co-located in this repo:**
- `docs/superpowers/specs/2026-05-21-playbook-mvp-design.md` — the design spec
- `research/forkable-games-research.md` — engine choice rationale
- `research/from-playbook/idle-game-math/00-principles.md` — Pecorella math rubric (consult before any economy tuning)
- `research/eras/01-antiquity.md`, `02-printing-press.md`, `03-penny-press.md` — content source material with cited examples and source URLs

---

## Phase 0 — Foundation

Goal of this phase: a Vite + TypeScript + Vue 3 project running on Profectus, mobile-first responsive shell, installs and runs on `pnpm dev`.

### Task 1: Clone Profectus and orient

**Files:**
- Create: `/home/klop/projects/active/playbook-2/` (working tree, currently has `docs/`, `research/`, `.gitignore`)
- Modify: `package.json` (created in this task)

- [ ] **Step 1: Verify current working tree state**

Run: `cd /home/klop/projects/active/playbook-2 && ls -la`

Expected: directories `.git`, `docs`, `research`, `.superpowers`, and a `.gitignore`. No `package.json` yet, no `src/`.

- [ ] **Step 2: Clone Profectus into a sibling scratch directory for study**

Run:
```bash
cd /tmp
git clone --depth 1 https://github.com/profectus-engine/Profectus.git profectus-study
ls profectus-study
```

Expected: directory listing showing `src/`, `package.json`, `vite.config.ts`, `README.md`, etc.

- [ ] **Step 3: Read the Profectus README and skim its source layout**

Read: `/tmp/profectus-study/README.md`
Read: `/tmp/profectus-study/src/data/` (this is where layers/content live in the template)
Read: `/tmp/profectus-study/src/game/` (this is the engine core)

Take notes on:
- How a "layer" is defined (file structure + exports)
- How currencies/resources are declared
- How upgrades and buyables work
- How prestige resets are configured
- How its save system works (file path + entry points)

This study is the foundation for Tasks 13–18 below.

- [ ] **Step 4: Copy Profectus into our project as the base**

Run:
```bash
cd /tmp/profectus-study
rsync -a --exclude='.git' --exclude='node_modules' --exclude='dist' . /home/klop/projects/active/playbook-2/
cd /home/klop/projects/active/playbook-2
ls -la
```

Expected: our directory now contains Profectus files (`src/`, `package.json`, `vite.config.ts`, etc.) alongside our existing `docs/`, `research/`, `.git/`. The `.git/` from clone is excluded; our project's own git history is preserved.

- [ ] **Step 5: Install dependencies**

Run:
```bash
cd /home/klop/projects/active/playbook-2
pnpm install
```

Expected: pnpm installs Profectus's dependencies. If pnpm isn't available, `npm install` works (the lockfile will diverge; commit it once and stick with one package manager).

- [ ] **Step 6: Verify dev server boots**

Run:
```bash
pnpm dev
```

Expected: Vite dev server starts, prints a localhost URL (typically `http://localhost:5173`). Opening it shows Profectus's default demo content.

Stop the dev server (Ctrl+C) before proceeding.

- [ ] **Step 7: Commit the Profectus baseline**

```bash
git add -A
git commit -m "feat(phase0): scaffold Profectus baseline"
```

### Task 2: Strip Profectus demo content; configure for our project

**Files:**
- Delete: `src/data/projEntry.tsx` (Profectus's default layer index) — will be replaced
- Delete: `src/data/layers/*` (default demo layers) — will be replaced
- Modify: `package.json` (set name, description, author)
- Modify: `vite.config.ts` (set base path, add PWA placeholder for Phase 7)
- Modify: `index.html` (title, theme color meta, viewport with safe-area, no-zoom)

- [ ] **Step 1: Update `package.json` metadata**

Open `package.json` and edit fields:

```json
{
  "name": "playbook",
  "version": "0.1.0",
  "description": "A history-of-disinformation incremental game. Built on Profectus.",
  "author": "Chris Klopfenstein",
  "license": "MIT"
}
```

Keep all `dependencies`, `devDependencies`, and `scripts` from Profectus untouched.

- [ ] **Step 2: Replace `index.html` with mobile-first head**

Overwrite `index.html` with:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no" />
  <meta name="theme-color" content="#212121" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Playbook" />
  <title>Playbook — A History of Disinformation</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

Notes: `viewport-fit=cover` is required for iPhone safe-area insets. `user-scalable=no` prevents accidental zoom on tap-tap. Apple-specific meta tags enable proper "Add to Home Screen" behavior.

If Profectus's `index.html` uses a different script entry path, preserve that path; only swap the meta/title.

- [ ] **Step 3: Add a global CSS file with safe-area defaults**

Create `src/styles/safe-area.css`:

```css
:root {
  --safe-top: env(safe-area-inset-top, 0);
  --safe-bottom: env(safe-area-inset-bottom, 0);
  --safe-left: env(safe-area-inset-left, 0);
  --safe-right: env(safe-area-inset-right, 0);
}

html, body, #app {
  margin: 0;
  padding: 0;
  height: 100dvh;
  overscroll-behavior: none;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, system-ui, sans-serif;
  background: #000;
  color: #fff;
}

#app {
  display: flex;
  flex-direction: column;
}
```

Notes: `100dvh` is the dynamic-viewport-height that respects iOS Safari's chrome correctly. `overscroll-behavior: none` prevents the iOS rubber-band scroll on the body.

- [ ] **Step 4: Import the safe-area CSS at app entry**

Locate `src/main.ts` (Profectus's entry). Add an import line near the top:

```ts
import './styles/safe-area.css';
```

- [ ] **Step 5: Verify dev server still boots**

Run:
```bash
pnpm dev
```

Expected: page loads, shows whatever Profectus default content remains. Background should be black (from our `body { background: #000 }`). Stop server.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore(phase0): mobile-first head, safe-area CSS, project metadata"
```

### Task 3: Install our additional dependencies

**Files:**
- Modify: `package.json` (via pnpm add)

- [ ] **Step 1: Add zod (schema validation), lz-string (save compression), vite-plugin-pwa**

Run:
```bash
cd /home/klop/projects/active/playbook-2
pnpm add zod lz-string
pnpm add -D vite-plugin-pwa
```

Expected: package.json updated with three new entries. `break_eternity.js` should already be present as a Profectus dependency — verify with `pnpm list break_eternity.js`.

- [ ] **Step 2: Verify install**

Run: `pnpm list zod lz-string vite-plugin-pwa break_eternity.js`

Expected: all four listed with version numbers.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(phase0): add zod, lz-string, vite-plugin-pwa"
```

---

## Phase 1 — Content schema & validation

Goal of this phase: typed schemas for Era, Generator, Transition, and Codex entries; zod runtime validators; a content loader that fails loudly when content files are malformed.

### Task 4: Define TypeScript types for the content schema

**Files:**
- Create: `src/content/schema.ts`
- Create: `src/content/types.ts`

- [ ] **Step 1: Create `src/content/types.ts` with branded ID types**

Create `src/content/types.ts`:

```ts
export type EraId = string & { __brand: 'EraId' };
export type GeneratorId = string & { __brand: 'GeneratorId' };
export type CodexId = string & { __brand: 'CodexId' };

export type TechniqueId =
  | 'impersonation'
  | 'emotion'
  | 'polarization'
  | 'conspiracy'
  | 'discrediting'
  | 'trolling';

export const ALL_TECHNIQUES: readonly TechniqueId[] = [
  'impersonation', 'emotion', 'polarization',
  'conspiracy', 'discrediting', 'trolling',
] as const;

export type ResourceId = 'rumor' | 'reach' | 'cred' | 'memetic_inheritance';
```

- [ ] **Step 2: Create `src/content/schema.ts` with zod validators**

Create `src/content/schema.ts`:

```ts
import { z } from 'zod';

export const TechniqueIdSchema = z.enum([
  'impersonation', 'emotion', 'polarization',
  'conspiracy', 'discrediting', 'trolling',
]);

export const ResourceIdSchema = z.enum([
  'rumor', 'reach', 'cred', 'memetic_inheritance',
]);

export const GeneratorTierSchema = z.object({
  id: z.string().min(1),
  tier: z.number().int().min(1).max(8),
  display_name: z.string().min(1),
  description: z.string().min(1),
  technique_tag: TechniqueIdSchema,
  resource: ResourceIdSchema,
  base_cost: z.number().nonnegative(),
  cost_growth: z.number().min(1.07).max(1.20),
  base_production: z.number().nonnegative(),
  is_click_driven: z.boolean(),
  auto_unlock_at: z.number().int().nonnegative(),
  auto_operative_name: z.string().min(1),
  milestones: z.array(z.number().int().positive()).default([25, 50, 100, 200, 300, 400]),
  codex_link: z.string().nullable().default(null),
});
export type GeneratorTier = z.infer<typeof GeneratorTierSchema>;

export const EraDefinitionSchema = z.object({
  id: z.string().min(1),
  ordinal: z.number().int().min(1).max(12),
  date_range: z.string().min(1),
  display_name: z.string().min(1),
  theme_id: z.string().min(1),
  techniques_unlocked: z.array(TechniqueIdSchema).min(1),
  generators: z.array(GeneratorTierSchema).min(2),
  prestige_into: z.string().nullable(),
  prestige_bridge_copy: z.string().min(1),
});
export type EraDefinition = z.infer<typeof EraDefinitionSchema>;

export const CodexFrontmatterSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  era: z.string().min(1),
  techniques: z.array(TechniqueIdSchema).min(1),
  sources: z.array(z.object({
    url: z.string().url(),
    label: z.string().min(1),
  })).min(1, 'Codex entries MUST have at least one source URL'),
  unlock_trigger: z.object({
    type: z.enum(['generator_owned', 'era_reached', 'always']),
    generator: z.string().optional(),
    count: z.number().int().positive().optional(),
  }),
});
export type CodexFrontmatter = z.infer<typeof CodexFrontmatterSchema>;

export const ThemeSchema = z.object({
  id: z.string().min(1),
  era_id: z.string().min(1),
  fonts: z.object({
    masthead: z.string().min(1),
    body: z.string().min(1),
    google_fonts_url: z.string().url().optional(),
  }),
  palette: z.object({
    background: z.string().regex(/^#[0-9a-f]{6}$/i),
    surface: z.string().regex(/^#[0-9a-f]{6}$/i),
    text: z.string().regex(/^#[0-9a-f]{6}$/i),
    muted: z.string().regex(/^#[0-9a-f]{6}$/i),
    accent: z.string().regex(/^#[0-9a-f]{6}$/i),
    border: z.string().regex(/^#[0-9a-f]{6}$/i),
  }),
  card_style: z.enum(['flat-paper', 'broadsheet', 'poster', 'chat-bubble']).default('flat-paper'),
});
export type Theme = z.infer<typeof ThemeSchema>;
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`

Expected: no errors. If errors mention missing zod types, ensure `pnpm install` ran with zod present.

- [ ] **Step 4: Commit**

```bash
git add src/content/types.ts src/content/schema.ts
git commit -m "feat(content): define era/generator/codex/theme schemas with zod validation"
```

### Task 5: Write the content loader with failing-loud validation

**Files:**
- Create: `src/content/loader.ts`
- Create: `tests/content/loader.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/content/loader.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { loadEra, ContentValidationError } from '../../src/content/loader';

describe('loadEra', () => {
  it('throws ContentValidationError when era.json is missing required fields', () => {
    const invalid = { id: 'antiquity' }; // missing most fields
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/content/loader.test.ts`

Expected: FAIL with import error (`loader.ts` doesn't exist yet).

If Profectus doesn't ship `vitest`, install it: `pnpm add -D vitest @vitest/ui happy-dom`.

- [ ] **Step 3: Write the implementation**

Create `src/content/loader.ts`:

```ts
import { EraDefinitionSchema, type EraDefinition } from './schema';
import { z } from 'zod';

export class ContentValidationError extends Error {
  constructor(message: string, public readonly issues?: z.ZodIssue[]) {
    super(message);
    this.name = 'ContentValidationError';
  }
}

export function loadEra(raw: unknown): EraDefinition {
  const result = EraDefinitionSchema.safeParse(raw);
  if (!result.success) {
    const summary = result.error.issues
      .map(i => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new ContentValidationError(
      `Era content failed validation:\n${summary}`,
      result.error.issues,
    );
  }
  return result.data;
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `pnpm vitest run tests/content/loader.test.ts`

Expected: PASS, all 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/content/loader.ts tests/content/loader.test.ts
git commit -m "feat(content): era content loader with zod validation and fail-loud errors"
```

### Task 6: Codex markdown parser with frontmatter validation

**Files:**
- Create: `src/content/codex-parser.ts`
- Create: `tests/content/codex-parser.test.ts`

- [ ] **Step 1: Install gray-matter for frontmatter parsing**

Run: `pnpm add gray-matter`

- [ ] **Step 2: Write failing test**

Create `tests/content/codex-parser.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { parseCodexEntry, CodexValidationError } from '../../src/content/codex-parser';

const VALID = `---
id: octavian-vs-antony
title: "Octavian vs. Mark Antony (32 BCE)"
era: antiquity
techniques: [impersonation, discrediting]
sources:
  - url: https://www.worldhistory.org/article/1474/the-propaganda-of-octavian-and-mark-antonys-civil/
    label: "World History Encyclopedia"
unlock_trigger:
  type: generator_owned
  generator: smear-rival
  count: 1
---

The textbook case. Octavian illegally seized Antony's will from the Vestal Virgins…
`;

describe('parseCodexEntry', () => {
  it('parses valid entry with body markdown', () => {
    const entry = parseCodexEntry(VALID);
    expect(entry.frontmatter.id).toBe('octavian-vs-antony');
    expect(entry.frontmatter.sources).toHaveLength(1);
    expect(entry.body).toContain('The textbook case');
  });

  it('rejects entry with no sources', () => {
    const bad = VALID.replace(/sources:[\s\S]*?unlock_trigger:/, 'unlock_trigger:');
    expect(() => parseCodexEntry(bad)).toThrow(CodexValidationError);
  });

  it('rejects entry with invalid source URL', () => {
    const bad = VALID.replace('https://', 'notaurl-');
    expect(() => parseCodexEntry(bad)).toThrow(CodexValidationError);
  });
});
```

- [ ] **Step 3: Run test to verify fail**

Run: `pnpm vitest run tests/content/codex-parser.test.ts`

Expected: FAIL with import error.

- [ ] **Step 4: Write implementation**

Create `src/content/codex-parser.ts`:

```ts
import matter from 'gray-matter';
import { CodexFrontmatterSchema, type CodexFrontmatter } from './schema';

export class CodexValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CodexValidationError';
  }
}

export interface CodexEntry {
  frontmatter: CodexFrontmatter;
  body: string;
}

export function parseCodexEntry(rawMarkdown: string): CodexEntry {
  const parsed = matter(rawMarkdown);
  const result = CodexFrontmatterSchema.safeParse(parsed.data);
  if (!result.success) {
    const summary = result.error.issues
      .map(i => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new CodexValidationError(`Codex frontmatter failed validation:\n${summary}`);
  }
  return {
    frontmatter: result.data,
    body: parsed.content.trim(),
  };
}
```

- [ ] **Step 5: Verify pass**

Run: `pnpm vitest run tests/content/codex-parser.test.ts`

Expected: PASS, all 3 tests.

- [ ] **Step 6: Commit**

```bash
git add src/content/codex-parser.ts tests/content/codex-parser.test.ts package.json pnpm-lock.yaml
git commit -m "feat(content): codex markdown parser requires source URLs"
```

### Task 7: Link-check script for codex sources (CI guardrail)

**Files:**
- Create: `scripts/check-codex-links.ts`
- Modify: `package.json` (add `check:links` script)

- [ ] **Step 1: Create the link-checker script**

Create `scripts/check-codex-links.ts`:

```ts
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parseCodexEntry } from '../src/content/codex-parser';

const CONTENT_ROOT = 'src/content/eras';

function findCodexFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...findCodexFiles(full));
    } else if (entry.endsWith('.md') && full.includes('/codex/')) {
      out.push(full);
    }
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
```

- [ ] **Step 2: Add script entry to `package.json`**

Add under `"scripts"`:

```json
"check:links": "tsx scripts/check-codex-links.ts"
```

If `tsx` isn't installed: `pnpm add -D tsx`.

- [ ] **Step 3: Verify it runs (will find no codex files yet, which is fine)**

Run: `pnpm check:links`

Expected: `Found 0 codex files` then `All links reachable.` Exit code 0.

- [ ] **Step 4: Commit**

```bash
git add scripts/check-codex-links.ts package.json pnpm-lock.yaml
git commit -m "feat(content): codex source URL link checker"
```

---

## Phase 2 — Era 1 (Antiquity) content authoring

Goal of this phase: a complete content payload for Era 1 — era.json, theme.json, copy.json, ticker.json, 6 codex markdown files — all conforming to the schema and link-checked.

### Task 8: Author `era.json` for Antiquity

**Files:**
- Create: `src/content/eras/01-antiquity/era.json`

- [ ] **Step 1: Create the era definition**

Create `src/content/eras/01-antiquity/era.json`:

```json
{
  "id": "antiquity",
  "ordinal": 1,
  "date_range": "~3000 BCE – 500 CE",
  "display_name": "Antiquity",
  "theme_id": "antiquity-cinzel",
  "techniques_unlocked": ["impersonation", "discrediting", "trolling"],
  "generators": [
    {
      "id": "spread-rumor",
      "tier": 1,
      "display_name": "Spread Rumor",
      "description": "Whisper to a passerby. Click to gain 1 Rumor.",
      "technique_tag": "impersonation",
      "resource": "rumor",
      "base_cost": 0,
      "cost_growth": 1.07,
      "base_production": 0,
      "is_click_driven": true,
      "auto_unlock_at": 10,
      "auto_operative_name": "Sycophant",
      "milestones": [25, 50, 100, 200, 300, 400],
      "codex_link": null,
      "reveal_at_lifetime": 0
    },
    {
      "id": "forge-naru-tablet",
      "tier": 2,
      "display_name": "Forge Naru Tablet",
      "description": "Backdate your own legend in clay. Generates Rumor passively.",
      "technique_tag": "impersonation",
      "resource": "rumor",
      "base_cost": 250,
      "cost_growth": 1.07,
      "base_production": 7,
      "is_click_driven": false,
      "auto_unlock_at": 0,
      "auto_operative_name": "Scribe",
      "milestones": [25, 50, 100, 200, 300, 400],
      "codex_link": "sargon-naru-tradition",
      "reveal_at_lifetime": 50
    },
    {
      "id": "smear-rival",
      "tier": 3,
      "display_name": "Smear Rival",
      "description": "Leak a damning will. Generates Rumor at scale.",
      "technique_tag": "discrediting",
      "resource": "rumor",
      "base_cost": 1250,
      "cost_growth": 1.10,
      "base_production": 70,
      "is_click_driven": false,
      "auto_unlock_at": 0,
      "auto_operative_name": "Pamphleteer",
      "milestones": [25, 50, 100, 200, 300, 400],
      "codex_link": "octavian-vs-antony",
      "reveal_at_lifetime": 500
    },
    {
      "id": "hire-sykophant",
      "tier": 3,
      "display_name": "Hire Sykophant",
      "description": "Pile-on litigation as harassment. The original troll.",
      "technique_tag": "trolling",
      "resource": "rumor",
      "base_cost": 2000,
      "cost_growth": 1.10,
      "base_production": 90,
      "is_click_driven": false,
      "auto_unlock_at": 0,
      "auto_operative_name": "Sykophant",
      "milestones": [25, 50, 100, 200, 300, 400],
      "codex_link": "athenian-sykophants",
      "reveal_at_lifetime": 750
    },
    {
      "id": "bronze-coin-mint",
      "tier": 4,
      "display_name": "Bronze Coin Mint",
      "description": "Stamp your image into every transaction. Era's flagship.",
      "technique_tag": "impersonation",
      "resource": "rumor",
      "base_cost": 6250,
      "cost_growth": 1.12,
      "base_production": 700,
      "is_click_driven": false,
      "auto_unlock_at": 0,
      "auto_operative_name": "Mint Master",
      "milestones": [25, 50, 100, 200, 300, 400],
      "codex_link": "augustan-coinage",
      "reveal_at_lifetime": 5000
    }
  ],
  "prestige_into": "printing-press",
  "prestige_bridge_copy": "The tablets crumble. The temples weather. The playbook does not. A new technology arrives — the press — and with it, the same human appetite for the convenient lie."
}
```

- [ ] **Step 2: Verify validation passes**

Quick smoke: write a one-off validation script.

Create `scripts/validate-era.ts`:

```ts
import { readFileSync } from 'node:fs';
import { loadEra } from '../src/content/loader';

const path = process.argv[2];
if (!path) { console.error('usage: validate-era <path-to-era.json>'); process.exit(1); }
const raw = JSON.parse(readFileSync(path, 'utf-8'));
loadEra(raw);
console.log(`✓ ${path} validates`);
```

Run: `pnpm tsx scripts/validate-era.ts src/content/eras/01-antiquity/era.json`

Expected: `✓ src/content/eras/01-antiquity/era.json validates`

- [ ] **Step 3: Commit**

```bash
git add src/content/eras/01-antiquity/era.json scripts/validate-era.ts
git commit -m "feat(content): authored Antiquity era definition (5 generators, 3 techniques)"
```

### Task 9: Author `theme.json` for Antiquity

**Files:**
- Create: `src/content/eras/01-antiquity/theme.json`

- [ ] **Step 1: Create the theme tokens**

Create `src/content/eras/01-antiquity/theme.json`:

```json
{
  "id": "antiquity-cinzel",
  "era_id": "antiquity",
  "fonts": {
    "masthead": "'Cinzel', 'EB Garamond', Georgia, serif",
    "body": "'EB Garamond', Georgia, serif",
    "google_fonts_url": "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=EB+Garamond:ital,wght@0,400;0,700;1,400&display=swap"
  },
  "palette": {
    "background": "#f2ecd9",
    "surface": "#ebe2c4",
    "text": "#2a2218",
    "muted": "#6b5a3d",
    "accent": "#2a2218",
    "border": "#2a2218"
  },
  "card_style": "flat-paper"
}
```

- [ ] **Step 2: Validate (write a tiny theme-validator script if not already)**

Add this case to `scripts/validate-era.ts` (extend it) OR create `scripts/validate-theme.ts`:

```ts
import { readFileSync } from 'node:fs';
import { ThemeSchema } from '../src/content/schema';

const path = process.argv[2];
if (!path) { console.error('usage: validate-theme <path>'); process.exit(1); }
const raw = JSON.parse(readFileSync(path, 'utf-8'));
const result = ThemeSchema.safeParse(raw);
if (!result.success) {
  console.error(result.error.format());
  process.exit(1);
}
console.log(`✓ ${path} validates`);
```

Run: `pnpm tsx scripts/validate-theme.ts src/content/eras/01-antiquity/theme.json`

Expected: `✓ … validates`

- [ ] **Step 3: Commit**

```bash
git add src/content/eras/01-antiquity/theme.json scripts/validate-theme.ts
git commit -m "feat(content): Antiquity theme tokens (Cinzel + parchment palette)"
```

### Task 10: Author `ticker.json` and `copy.json` for Antiquity

**Files:**
- Create: `src/content/eras/01-antiquity/ticker.json`
- Create: `src/content/eras/01-antiquity/copy.json`

- [ ] **Step 1: Create the ticker quotes (real cited facts)**

Create `src/content/eras/01-antiquity/ticker.json`. Source pulls from `research/eras/01-antiquity.md`:

```json
{
  "quotes": [
    {
      "id": "octavian-will",
      "text": "Octavian read Antony's seized will aloud in 32 BCE.",
      "codex_link": "octavian-vs-antony"
    },
    {
      "id": "kadesh",
      "text": "Ramesses II's victory inscriptions at Kadesh were contradicted by Hittite archives 3,000 years later.",
      "codex_link": "battle-of-kadesh"
    },
    {
      "id": "behistun",
      "text": "Darius I carved his official story into a cliff in three languages — Old Persian, Elamite, Akkadian.",
      "codex_link": "behistun-inscription"
    },
    {
      "id": "mandate",
      "text": "The Zhou justified overthrowing the Shang by inventing the doctrine that Heaven had withdrawn its mandate.",
      "codex_link": "mandate-of-heaven"
    },
    {
      "id": "themistocles-ostraka",
      "text": "A cache of 190 ostraka voting against Themistocles was written by only 14 different hands.",
      "codex_link": "themistocles-ostracism"
    },
    {
      "id": "nero-christians",
      "text": "Facing rumors he started the Great Fire, Nero blamed an obscure Jewish sect — the Christians.",
      "codex_link": "nero-great-fire"
    },
    {
      "id": "augustus-coinage",
      "text": "Every Augustan denarius read CAESAR DIVI F — son of the deified one.",
      "codex_link": "augustan-coinage"
    },
    {
      "id": "sykophants",
      "text": "Athenian sykophants filed frivolous lawsuits to extort settlements — the original trolls.",
      "codex_link": "athenian-sykophants"
    }
  ],
  "interval_ms": 8000,
  "no_repeat_within": 3
}
```

- [ ] **Step 2: Create `copy.json` for era-specific UI strings**

Create `src/content/eras/01-antiquity/copy.json`:

```json
{
  "masthead_title": "THE PLAYBOOK",
  "masthead_subtitle": "DE HISTORIA FALSITATIS",
  "resource_labels": {
    "rumor": "Rumor",
    "reach": "Reach",
    "cred": "Cred"
  },
  "prestige_button_label": "Ascend to the Press",
  "prestige_confirm_title": "Cross the Threshold?",
  "prestige_confirm_body": "Your tablets will crumble. Your operatives forget. The Memetic Inheritance you carry forward will accelerate every future age."
}
```

- [ ] **Step 3: Validate JSON parses (no schema required for ticker/copy in MVP)**

Run:
```bash
node -e "JSON.parse(require('fs').readFileSync('src/content/eras/01-antiquity/ticker.json'))"
node -e "JSON.parse(require('fs').readFileSync('src/content/eras/01-antiquity/copy.json'))"
```

Expected: both commands exit 0 silently.

- [ ] **Step 4: Commit**

```bash
git add src/content/eras/01-antiquity/ticker.json src/content/eras/01-antiquity/copy.json
git commit -m "feat(content): Antiquity ticker quotes and UI copy"
```

### Task 11: Author 6 codex entries for Antiquity

**Files:**
- Create: `src/content/eras/01-antiquity/codex/octavian-vs-antony.md`
- Create: `src/content/eras/01-antiquity/codex/sargon-naru-tradition.md`
- Create: `src/content/eras/01-antiquity/codex/battle-of-kadesh.md`
- Create: `src/content/eras/01-antiquity/codex/augustan-coinage.md`
- Create: `src/content/eras/01-antiquity/codex/athenian-sykophants.md`
- Create: `src/content/eras/01-antiquity/codex/nero-great-fire.md`

- [ ] **Step 1: Create `octavian-vs-antony.md`**

```markdown
---
id: octavian-vs-antony
title: "Octavian vs. Mark Antony (32 BCE)"
era: antiquity
techniques: [impersonation, discrediting]
sources:
  - url: https://www.worldhistory.org/article/1474/the-propaganda-of-octavian-and-mark-antonys-civil/
    label: "World History Encyclopedia"
  - url: https://en.wikipedia.org/wiki/War_of_Actium
    label: "Wikipedia: War of Actium"
unlock_trigger:
  type: generator_owned
  generator: smear-rival
  count: 1
---

The textbook case. Octavian illegally seized Antony's will from the Vestal Virgins in 32 BCE and read it aloud to the Roman Senate, claiming it bequeathed Roman territory to Cleopatra's children and asked for an Alexandrian burial.

He paired this leak with a coin-and-pamphlet campaign casting Antony as a drunken, effeminate slave to a foreign queen. The result: a civil war was reframed as a patriotic war against Egypt itself.

Cassius Dio Book 50.25-26 preserves Octavian's pre-battle speech. The techniques used — leaked documents (forged or otherwise), xenophobic othering, gendered smear, polarization — appear in every era of the playbook since.
```

- [ ] **Step 2: Create `sargon-naru-tradition.md`**

```markdown
---
id: sargon-naru-tradition
title: "Sargon of Akkad's Manufactured Origin (~2300 BCE)"
era: antiquity
techniques: [impersonation]
sources:
  - url: https://www.worldhistory.org/article/746/the-legend-of-sargon-of-akkad/
    label: "World History Encyclopedia: Legend of Sargon"
  - url: https://www.cambridge.org/core/journals/iraq/article/abs/two-steles-of-sargon-iconology-and-visual-propaganda-at-the-beginning-of-royal-akkadian-relief/B6EC9540759BCABC1B825839533E71BC
    label: "Cambridge IRAQ: Two Steles of Sargon"
unlock_trigger:
  type: generator_owned
  generator: forge-naru-tablet
  count: 1
---

Sargon's "autobiography" — secret birth, river-basket exposure, rise from gardener to king — is preserved on clay tablets composed *centuries after his death*. The genre is called *naru*: pseudo-royal inscriptions that retroject legitimating origin myths onto historical rulers.

His grandson Naram-Sin received the same treatment: later didactic propaganda (*The Curse of Agade*, the *Cuthean Legend*) reshaped his reign for political-religious lessons.

The technique — *backdate your legend to make the present inevitable* — survives intact 4,000 years later in every "always knew he was destined for greatness" hagiography.
```

- [ ] **Step 3: Create `battle-of-kadesh.md`**

```markdown
---
id: battle-of-kadesh
title: "Battle of Kadesh (1274 BCE)"
era: antiquity
techniques: [impersonation, discrediting]
sources:
  - url: https://en.wikipedia.org/wiki/Battle_of_Kadesh
    label: "Wikipedia: Battle of Kadesh"
  - url: https://www.thearchaeologist.org/blog/the-battle-of-kadesh-ramses-iis-propaganda-and-the-truth-from-hittite-texts
    label: "The Archaeologist: Ramses II's Propaganda"
unlock_trigger:
  type: era_reached
---

Ramesses II fought a tactical draw against the Hittites under Muwatalli II — failed to take Kadesh, nearly lost his army. Then he plastered the *Poem of Pentaur* and the *Bulletin* across at least five major temples: Karnak, Luxor, Abydos, Abu Simbel, the Ramesseum. The version on stone shows him single-handedly routing the Hittite army.

Hittite cuneiform tablets recovered at Hattusa contradict the Egyptian account in detail. This is the first known case of a propaganda claim being externally falsified by recovered enemy archives — three millennia after it was carved.

Technique: monumental repetition. If you write it in stone in enough places, that *becomes* the record.
```

- [ ] **Step 4: Create `augustan-coinage.md`**

```markdown
---
id: augustan-coinage
title: "Augustus and the Branded Empire (27 BCE+)"
era: antiquity
techniques: [impersonation]
sources:
  - url: https://en.wikipedia.org/wiki/Propaganda_in_Augustan_Rome
    label: "Wikipedia: Propaganda in Augustan Rome"
  - url: https://camws.org/sites/default/files/87.Coins.03.pdf
    label: "CAMWS: From Octavian to Augustus"
unlock_trigger:
  type: generator_owned
  generator: bronze-coin-mint
  count: 1
---

After Actium, Augustus systematized coin-as-propaganda. Every denarius carried curated imagery: *Pax*, *Victoria*, the *clipeus virtutis*, **CAESAR DIVI F** — "son of the deified one." Oak crowns for *civis servati* — citizens saved.

The *Res Gestae Divi Augusti*, inscribed on his mausoleum and copied to provinces across the empire, was a first-person sanitized autobiography. It conveniently omitted the proscriptions, civil wars, and the fact that his adoptive father Julius Caesar had been a real human and not a god.

The world's first mass-distribution medium for political imagery: pocket-size, mandatory in every transaction, impossible to escape. The pattern survives in every currency, logo, and brand mark since.
```

- [ ] **Step 5: Create `athenian-sykophants.md`**

```markdown
---
id: athenian-sykophants
title: "Athenian Sykophants — The Original Trolls (5th–4th c. BCE)"
era: antiquity
techniques: [trolling, discrediting]
sources:
  - url: https://www.stoa.org/demos/article_sycophancy@page=all&greekEncoding=UnicodeC.html
    label: "Stoa: Sycophancy and Attitudes to Litigation"
unlock_trigger:
  type: generator_owned
  generator: hire-sykophant
  count: 1
---

Athens had no public prosecutor. Instead, it incentivized private citizens to bring lawsuits — and *sykophantai* exploited the system by filing frivolous suits to extort settlements or destroy rivals.

Demosthenes prosecuted **Aristogeiton** in 324 BCE as a paradigmatic sycophant: "a savage beast preying upon citizens." This was the first institutionalized disinformation-for-profit ecosystem in recorded history.

The English word "sycophant" softened to mean "flatterer" only much later. The original Greek meant something closer to "professional troll" — a person who weaponized legal and civic process to attack their targets. Sea-lioning, pile-on litigation, and mass-reporting on modern platforms all trace conceptually to this lineage.
```

- [ ] **Step 6: Create `nero-great-fire.md`**

```markdown
---
id: nero-great-fire
title: "Nero and the Great Fire (64 CE)"
era: antiquity
techniques: [discrediting]
sources:
  - url: https://www.livius.org/sources/content/tacitus/tacitus-on-the-christians/
    label: "Livius: Tacitus on the Christians"
  - url: https://www.cambridge.org/core/books/cambridge-companion-to-the-age-of-nero/burning-rome-burning-christians/174BE1274DF70D5C6088BDAFC163F837
    label: "Cambridge Companion to the Age of Nero"
unlock_trigger:
  type: era_reached
---

Facing rumor that he had set the Great Fire himself to clear ground for the Domus Aurea, Nero blamed an obscure and reviled Jewish sect — the Christians — and had many of them publicly executed in spectacular and gruesome ways.

Tacitus (*Annals* 15.44), writing some fifty years later and no friend of Christians himself, explicitly calls them scapegoats. He found the persecution distasteful not out of sympathy but because it deflected blame from a guilty emperor onto an innocent (if peculiar) minority.

The technique — *deflect rumor onto a vulnerable outgroup* — is the most durable disinformation pattern in human history. It has surfaced in every era since, against Jews, Catholics, witches, Communists, immigrants, and an endless rotation of minorities.
```

- [ ] **Step 7: Run link-check**

Run: `pnpm check:links`

Expected: Found 6 codex files. Each source URL checks. Some may return non-200 if a server is rate-limiting; if any genuinely fail, find a replacement URL from `research/eras/01-antiquity.md` and update.

- [ ] **Step 8: Commit**

```bash
git add src/content/eras/01-antiquity/codex/
git commit -m "feat(content): 6 Antiquity codex entries with cited sources"
```

### Task 12: Era 1 content directory verification

**Files:**
- (no new files; verification only)

- [ ] **Step 1: Confirm structure**

Run: `tree src/content/eras/01-antiquity` (or `find src/content/eras/01-antiquity`)

Expected:
```
src/content/eras/01-antiquity/
├── era.json
├── theme.json
├── ticker.json
├── copy.json
└── codex/
    ├── athenian-sykophants.md
    ├── augustan-coinage.md
    ├── battle-of-kadesh.md
    ├── nero-great-fire.md
    ├── octavian-vs-antony.md
    └── sargon-naru-tradition.md
```

- [ ] **Step 2: Run all validation checks**

```bash
pnpm tsx scripts/validate-era.ts src/content/eras/01-antiquity/era.json
pnpm tsx scripts/validate-theme.ts src/content/eras/01-antiquity/theme.json
pnpm check:links
pnpm vitest run
```

Expected: all 4 commands exit 0.

- [ ] **Step 3: No commit needed (verification only)**

---

## Phase 3 — Engine wiring (Profectus integration)

> **Profectus prerequisite:** before this phase, the implementer should have completed Task 1's Profectus study. The tasks below give the *behavior* required; the specific Profectus API calls (`createLayer`, `createResource`, `createBuyable`, `createReset`) should match what Task 1 documented. If unsure, consult the Profectus README at https://github.com/profectus-engine/Profectus and the `/tmp/profectus-study/src/data/layers/` examples.

Goal of this phase: Era 1 is playable — clicking gains Rumor, buying tier 1 unlocks the Sycophant auto-operative, all 5 tiers buyable with correct cost curves, milestones apply ×2 multipliers, prestige reset works.

### Task 13: Create a Profectus layer factory that consumes our content schema

**Files:**
- Create: `src/game/era-layer.ts`
- Create: `tests/game/era-layer.test.ts`

- [ ] **Step 1: Write the failing test (cost-curve math)**

Create `tests/game/era-layer.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { computeCost, computeBulkCost } from '../../src/game/era-layer';

describe('era-layer math', () => {
  it('computeCost(base=100, growth=1.07, owned=10) ≈ 196.715', () => {
    expect(computeCost(100, 1.07, 10)).toBeCloseTo(100 * Math.pow(1.07, 10), 4);
  });

  it('computeBulkCost matches sum of individual costs', () => {
    const base = 100, growth = 1.10, owned = 5, n = 7;
    let expected = 0;
    for (let i = 0; i < n; i++) expected += base * Math.pow(growth, owned + i);
    expect(computeBulkCost(base, growth, owned, n)).toBeCloseTo(expected, 4);
  });

  it('returns 0 for n=0', () => {
    expect(computeBulkCost(100, 1.07, 10, 0)).toBe(0);
  });
});
```

- [ ] **Step 2: Verify test fails**

Run: `pnpm vitest run tests/game/era-layer.test.ts`

Expected: FAIL — file doesn't exist.

- [ ] **Step 3: Implement the math primitives**

Create `src/game/era-layer.ts`:

```ts
import type { EraDefinition, GeneratorTier } from '../content/schema';

/** cost(n) = base × growth^n — Pecorella canonical formula */
export function computeCost(base: number, growth: number, owned: number): number {
  return base * Math.pow(growth, owned);
}

/** Closed-form bulk cost from level k, buying n more (geometric series). */
export function computeBulkCost(base: number, growth: number, owned: number, n: number): number {
  if (n === 0) return 0;
  return base * (Math.pow(growth, owned) * (Math.pow(growth, n) - 1)) / (growth - 1);
}

/** Compute the milestone multiplier for a given owned count. */
export function milestoneMultiplier(owned: number, milestones: readonly number[]): number {
  let mult = 1;
  for (const m of milestones) if (owned >= m) mult *= 2;
  return mult;
}

/** Per-tick production for one generator (linear in owned × multipliers). */
export function generatorProduction(
  gen: GeneratorTier,
  owned: number,
  globalMultiplier: number,
): number {
  if (gen.is_click_driven) return 0;
  return gen.base_production * owned * milestoneMultiplier(owned, gen.milestones) * globalMultiplier;
}
```

- [ ] **Step 4: Verify tests pass**

Run: `pnpm vitest run tests/game/era-layer.test.ts`

Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/game/era-layer.ts tests/game/era-layer.test.ts
git commit -m "feat(game): cost-curve, bulk-cost, milestone-multiplier, production math"
```

### Task 14: Test milestone multiplier behavior

**Files:**
- Modify: `tests/game/era-layer.test.ts` (append)

- [ ] **Step 1: Add milestone tests**

Append to `tests/game/era-layer.test.ts`:

```ts
import { milestoneMultiplier, generatorProduction } from '../../src/game/era-layer';

describe('milestoneMultiplier', () => {
  const MS = [25, 50, 100, 200, 300, 400];
  it.each([
    [0, 1], [24, 1], [25, 2], [49, 2], [50, 4],
    [99, 4], [100, 8], [199, 8], [200, 16],
    [299, 16], [300, 32], [399, 32], [400, 64], [1000, 64],
  ])('owned=%i → multiplier=%i', (owned, expected) => {
    expect(milestoneMultiplier(owned, MS)).toBe(expected);
  });
});

describe('generatorProduction', () => {
  const gen = {
    id: 'g', tier: 2, display_name: 'G', description: '',
    technique_tag: 'impersonation' as const, resource: 'rumor' as const,
    base_cost: 250, cost_growth: 1.07, base_production: 7,
    is_click_driven: false, auto_unlock_at: 0,
    auto_operative_name: 'X', milestones: [25, 50, 100, 200, 300, 400],
    codex_link: null,
  };
  it('produces 0 when owned=0', () => {
    expect(generatorProduction(gen, 0, 1)).toBe(0);
  });
  it('owned=1, mult=1 → base_production', () => {
    expect(generatorProduction(gen, 1, 1)).toBe(7);
  });
  it('owned=25, milestone-1 applies (×2) → 7 × 25 × 2 = 350', () => {
    expect(generatorProduction(gen, 25, 1)).toBe(350);
  });
  it('owned=50, two milestones (×4) → 7 × 50 × 4 = 1400', () => {
    expect(generatorProduction(gen, 50, 1)).toBe(1400);
  });
  it('global multiplier compounds', () => {
    expect(generatorProduction(gen, 50, 2.5)).toBe(7 * 50 * 4 * 2.5);
  });
  it('click-driven generator produces 0 idle', () => {
    expect(generatorProduction({ ...gen, is_click_driven: true }, 100, 1)).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests**

Run: `pnpm vitest run tests/game/era-layer.test.ts`

Expected: PASS, all tests (originals + new).

- [ ] **Step 3: Commit**

```bash
git add tests/game/era-layer.test.ts
git commit -m "test(game): milestone-multiplier and production behavior tables"
```

### Task 15: Prestige formula (sqrt-on-lifetime)

**Files:**
- Create: `src/game/prestige.ts`
- Create: `tests/game/prestige.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/game/prestige.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { computeMemeticInheritance } from '../../src/game/prestige';

describe('computeMemeticInheritance — AdCap sqrt formula', () => {
  it('zero lifetime → 0 MI', () => {
    expect(computeMemeticInheritance(0)).toBe(0);
  });
  it('lifetime = pivot (1e15) → 150 MI', () => {
    expect(computeMemeticInheritance(1e15)).toBeCloseTo(150, 4);
  });
  it('lifetime = 4× pivot → 300 MI (sqrt doubles at 4×)', () => {
    expect(computeMemeticInheritance(4e15)).toBeCloseTo(300, 4);
  });
  it('lifetime = 100× pivot → 1500 MI', () => {
    expect(computeMemeticInheritance(1e17)).toBeCloseTo(1500, 4);
  });
});
```

- [ ] **Step 2: Verify fail**

Run: `pnpm vitest run tests/game/prestige.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement**

Create `src/game/prestige.ts`:

```ts
const PIVOT = 1e15; // AdCap pivot — first prestige reachable in 30–60 min of fresh play
const COEFFICIENT = 150;

/** AdCap formula: MI = 150 × sqrt(lifetime_rumor / 10^15). */
export function computeMemeticInheritance(lifetimeRumor: number): number {
  if (lifetimeRumor <= 0) return 0;
  return COEFFICIENT * Math.sqrt(lifetimeRumor / PIVOT);
}

/** Carryover multiplier applied to next era's production: 1 + MI × 0.02. */
export function carryoverMultiplier(mi: number): number {
  return 1 + mi * 0.02;
}
```

- [ ] **Step 4: Verify pass**

Run: `pnpm vitest run tests/game/prestige.test.ts`

Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/game/prestige.ts tests/game/prestige.test.ts
git commit -m "feat(game): Memetic Inheritance sqrt-on-lifetime prestige formula"
```

### Task 16: Build the Profectus layer from an EraDefinition

**Files:**
- Create: `src/game/build-era-layer.ts`

> **Profectus integration note:** the exact Profectus API for creating a layer is in `/tmp/profectus-study/src/data/layers/`. Look for the simplest example layer there (often `prestige.tsx` or `main.tsx`) and pattern-match. The behavior our function MUST produce:
> 1. A "Rumor" resource (Profectus `createResource`)
> 2. One "buyable" per generator in `era.generators` (Profectus `createBuyable`) with:
>    - `cost`: function returning `computeCost(gen.base_cost, gen.cost_growth, owned)`
>    - `effect`: function returning `generatorProduction(gen, owned, globalMultiplier)`
>    - `onPurchase`: increments owned count
> 3. A click handler for the Tier-1 generator (`is_click_driven: true`) that adds 1 Rumor on click
> 4. A "Sycophant unlock" gate: when Tier-1 owned reaches `auto_unlock_at`, the Tier-1 generator starts auto-producing at base_production rate
> 5. A "Reset" (Profectus prestige primitive) that:
>    - On reset, the player gains MI = `computeMemeticInheritance(lifetimeRumor)`
>    - All Rumor and generator owned counts reset
>    - MI persists to a global state
>    - `carryoverMultiplier(MI)` becomes the new globalMultiplier
> 6. A production tick: every Profectus tick, sum `generatorProduction(...)` across all non-click-driven generators and add to Rumor

- [ ] **Step 1: Skeleton (fill in API details after Profectus study)**

Create `src/game/build-era-layer.ts`:

```ts
import type { EraDefinition } from '../content/schema';
import { computeCost, generatorProduction } from './era-layer';
import { computeMemeticInheritance, carryoverMultiplier } from './prestige';

// PROFECTUS API STUBS — replace with actual imports after Task 1 study
// import { createLayer, createResource, createBuyable, createReset } from '...';

export interface EraLayerState {
  ownedByGenerator: Record<string, number>;
  lifetimeRumor: number;
  rumor: number;
  globalMultiplier: number;
}

export function buildEraLayer(era: EraDefinition, mi: number) {
  const globalMultiplier = carryoverMultiplier(mi);
  // Construct a Profectus layer object here per the engine's API.
  // The skeleton below documents the WHAT; the HOW (which `create*` calls)
  // is filled in once Task 1 has been completed.

  const generators = era.generators.map(gen => ({
    def: gen,
    // Profectus buyable will live here.
    cost: (owned: number) => computeCost(gen.base_cost, gen.cost_growth, owned),
    productionPerSec: (owned: number) =>
      generatorProduction(gen, owned, globalMultiplier),
  }));

  // The tier-1 generator is click-driven AND auto-unlocks at `auto_unlock_at`.
  const tier1 = generators.find(g => g.def.is_click_driven);
  if (!tier1) throw new Error(`Era ${era.id} has no click-driven Tier-1 generator`);

  const onClick = (state: EraLayerState) => {
    state.rumor += 1;
    state.lifetimeRumor += 1;
  };

  const onTick = (state: EraLayerState, dtSeconds: number) => {
    let gained = 0;
    for (const g of generators) {
      const owned = state.ownedByGenerator[g.def.id] ?? 0;
      const autoActive = g.def.is_click_driven
        ? owned >= g.def.auto_unlock_at
        : true;
      if (autoActive) gained += g.productionPerSec(owned) * dtSeconds;
    }
    state.rumor += gained;
    state.lifetimeRumor += gained;
  };

  const performPrestige = (state: EraLayerState): number => {
    const newMI = computeMemeticInheritance(state.lifetimeRumor);
    // caller is responsible for resetting state and transitioning to next era
    return newMI;
  };

  return {
    era,
    generators,
    onClick,
    onTick,
    performPrestige,
    globalMultiplier,
  };
}
```

- [ ] **Step 2: Write unit tests for the pure functions on this object (no Profectus dependency needed)**

Create `tests/game/build-era-layer.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildEraLayer, type EraLayerState } from '../../src/game/build-era-layer';
import { loadEra } from '../../src/content/loader';
import { readFileSync } from 'node:fs';

const antiquity = loadEra(JSON.parse(readFileSync('src/content/eras/01-antiquity/era.json', 'utf-8')));

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
    expect(s.rumor).toBe(7); // base_production of forge-naru-tablet
  });

  it('Tier-1 auto-unlocks when owned >= auto_unlock_at', () => {
    const layer = buildEraLayer(antiquity, 0);
    const s = freshState();
    // Tier-1 (spread-rumor) has base_production 0 in our schema (click-driven only).
    // But auto-unlock should not throw. Just verify no error.
    s.ownedByGenerator['spread-rumor'] = 10;
    expect(() => layer.onTick(s, 1)).not.toThrow();
  });

  it('performPrestige returns MI based on lifetime', () => {
    const layer = buildEraLayer(antiquity, 0);
    const s = freshState();
    s.lifetimeRumor = 1e15;
    const mi = layer.performPrestige(s);
    expect(mi).toBeCloseTo(150, 4);
  });
});
```

- [ ] **Step 3: Run tests**

Run: `pnpm vitest run tests/game/build-era-layer.test.ts`

Expected: PASS, 5 tests.

- [ ] **Step 4: Commit**

```bash
git add src/game/build-era-layer.ts tests/game/build-era-layer.test.ts
git commit -m "feat(game): pure-function era layer factory (Profectus-agnostic core)"
```

### Task 17: Wire the era layer into Profectus

**Files:**
- Create: `src/game/index.ts` (the new Profectus entry)
- Modify: `src/data/projEntry.tsx` if Profectus expects that path (or wherever the default layer index lives — verified in Task 1)

- [ ] **Step 1: Implement Profectus integration**

This step is **deliberately written as a behavioral spec** because exact Profectus APIs vary by version. Open `/tmp/profectus-study/src/data/layers/*` for working examples. Then create `src/game/index.ts` that:

1. Loads `src/content/eras/01-antiquity/era.json` (use `import era1 from '../content/eras/01-antiquity/era.json'`)
2. Calls `loadEra(era1)` to validate at startup
3. Calls `buildEraLayer(validatedEra, 0)` for the initial layer
4. Registers a Profectus tick subscription that calls `layer.onTick(state, dt)`
5. Exposes the player click action via a Profectus click handler that calls `layer.onClick(state)`
6. Registers a Profectus Reset/Prestige that:
   - Computes new MI via `layer.performPrestige(state)`
   - Persists MI to a global Profectus state
   - Rebuilds the layer with the new MI
   - Transitions to the era specified by `era.prestige_into` (in MVP, only Era 1 → Era 2 works in this task; multi-era switch comes in Task 26)

- [ ] **Step 2: Run dev server, click the screen, watch Rumor go up**

Run: `pnpm dev`

Open: localhost:5173

Expected: Black background (from safe-area.css). Clicking the page increments Rumor visibly. With no UI yet, you may need a temporary `console.log(state.rumor)` inside `onClick` to verify.

- [ ] **Step 3: Commit**

```bash
git add src/game/ src/data/
git commit -m "feat(game): wire Antiquity era into Profectus layer system"
```

### Task 18: Save & load with lz-string

**Files:**
- Create: `src/game/save.ts`
- Create: `tests/game/save.test.ts`
- Modify: `src/game/index.ts` (call save on visibility change + every 10s)

- [ ] **Step 1: Write failing test**

Create `tests/game/save.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { serializeSave, deserializeSave, type SaveState } from '../../src/game/save';

const SAMPLE: SaveState = {
  version: 1,
  current_era: 'antiquity',
  rumor: 12345.678,
  lifetime_rumor: 999999.99,
  memetic_inheritance: 0,
  owned_by_generator: { 'spread-rumor': 10, 'forge-naru-tablet': 3 },
  unlocked_codex: ['octavian-vs-antony'],
  saved_at_ms: 1700000000000,
};

describe('save round-trip', () => {
  it('serialize then deserialize returns the original', () => {
    const str = serializeSave(SAMPLE);
    const back = deserializeSave(str);
    expect(back).toEqual(SAMPLE);
  });

  it('compressed save is smaller than JSON.stringify', () => {
    const compressed = serializeSave(SAMPLE);
    const raw = JSON.stringify(SAMPLE);
    expect(compressed.length).toBeLessThan(raw.length);
  });

  it('throws on corrupted input', () => {
    expect(() => deserializeSave('totally-not-a-save')).toThrow();
  });
});
```

- [ ] **Step 2: Verify fail**

Run: `pnpm vitest run tests/game/save.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement**

Create `src/game/save.ts`:

```ts
import LZString from 'lz-string';

export const CURRENT_SAVE_VERSION = 1;

export interface SaveState {
  version: number;
  current_era: string;
  rumor: number;
  lifetime_rumor: number;
  memetic_inheritance: number;
  owned_by_generator: Record<string, number>;
  unlocked_codex: string[];
  saved_at_ms: number;
}

export function serializeSave(state: SaveState): string {
  const json = JSON.stringify(state);
  return LZString.compressToBase64(json);
}

export function deserializeSave(encoded: string): SaveState {
  const json = LZString.decompressFromBase64(encoded);
  if (!json) throw new Error('Failed to decompress save');
  const parsed = JSON.parse(json) as SaveState;
  if (typeof parsed !== 'object' || !parsed.version) {
    throw new Error('Save missing version field');
  }
  // Future: schema migrations live here based on parsed.version
  return parsed;
}

const STORAGE_KEY = 'playbook.save';

export function writeLocalSave(state: SaveState): void {
  localStorage.setItem(STORAGE_KEY, serializeSave(state));
}

export function readLocalSave(): SaveState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return deserializeSave(raw);
  } catch (err) {
    console.error('Save corrupted, ignoring:', err);
    return null;
  }
}
```

- [ ] **Step 4: Verify pass**

Run: `pnpm vitest run tests/game/save.test.ts`

Expected: PASS, 3 tests.

- [ ] **Step 5: Integrate auto-save into game loop**

In `src/game/index.ts`, add periodic save + visibility-change save. Pseudocode (adapt to your Profectus structure):

```ts
import { writeLocalSave, readLocalSave } from './save';

// On boot:
const loaded = readLocalSave();
// apply loaded state to layer/state if present

// Every 10 seconds:
setInterval(() => writeLocalSave(currentSaveState()), 10_000);

// On tab visibility change:
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    writeLocalSave(currentSaveState());
  }
});
```

`currentSaveState()` builds a `SaveState` object from the live layer/global state.

- [ ] **Step 6: Manual smoke test**

Run: `pnpm dev`

In browser: click to gain Rumor, reload the page, verify Rumor is restored.

- [ ] **Step 7: Commit**

```bash
git add src/game/save.ts tests/game/save.test.ts src/game/index.ts
git commit -m "feat(game): lz-string compressed localStorage save with auto-save"
```

---

## Phase 4 — UI shell (the iOS tab-bar layout)

Goal of this phase: 4-tab iOS-style navigation (Play / Tree / Codex / More), Play tab shows masthead/ticker/banner/resources/cards, Tree/Codex/More tabs have minimal real content.

### Task 19: Root app shell with safe-area + tab bar layout

**Files:**
- Create: `src/ui/AppShell.vue`
- Create: `src/ui/TabBar.vue`
- Modify: `src/main.ts` (mount AppShell)

- [ ] **Step 1: Create the tab bar component**

Create `src/ui/TabBar.vue`:

```vue
<script setup lang="ts">
import { computed } from 'vue';

defineProps<{ activeTab: 'play' | 'tree' | 'codex' | 'more' }>();
const emit = defineEmits<{ (e: 'navigate', tab: 'play' | 'tree' | 'codex' | 'more'): void }>();

const tabs = [
  { id: 'play' as const, label: 'Play' },
  { id: 'tree' as const, label: 'Tree' },
  { id: 'codex' as const, label: 'Codex' },
  { id: 'more' as const, label: 'More' },
];
</script>

<template>
  <nav class="tabbar">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="tab"
      :class="{ active: activeTab === tab.id }"
      @click="emit('navigate', tab.id)"
    >
      <span class="tab-label">{{ tab.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.tabbar {
  display: flex;
  height: 60px;
  padding-bottom: var(--safe-bottom);
  background: var(--theme-surface, #1a1a1a);
  border-top: 1px solid var(--theme-border, #2f2f2f);
}
.tab {
  flex: 1;
  background: none;
  border: 0;
  color: var(--theme-muted, #8e8e93);
  font-family: inherit;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
  padding: 8px 0 12px;
  cursor: pointer;
}
.tab.active { color: var(--theme-text, #ececec); }
.tab-label { display: block; }
</style>
```

- [ ] **Step 2: Create the AppShell**

Create `src/ui/AppShell.vue`:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import TabBar from './TabBar.vue';
import PlayTab from './tabs/PlayTab.vue';
import TreeTab from './tabs/TreeTab.vue';
import CodexTab from './tabs/CodexTab.vue';
import MoreTab from './tabs/MoreTab.vue';

const activeTab = ref<'play' | 'tree' | 'codex' | 'more'>('play');
</script>

<template>
  <div class="app-shell">
    <main class="content">
      <PlayTab v-if="activeTab === 'play'" />
      <TreeTab v-else-if="activeTab === 'tree'" />
      <CodexTab v-else-if="activeTab === 'codex'" />
      <MoreTab v-else-if="activeTab === 'more'" />
    </main>
    <TabBar :active-tab="activeTab" @navigate="activeTab = $event" />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  padding-top: var(--safe-top);
  background: var(--theme-background, #000);
}
.content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
```

- [ ] **Step 3: Create stub tab components**

Create `src/ui/tabs/PlayTab.vue`, `TreeTab.vue`, `CodexTab.vue`, `MoreTab.vue` each containing simply:

```vue
<template><div class="stub"><h2>{{ tabName }}</h2></div></template>
<script setup lang="ts">defineProps<{ tabName?: string }>();</script>
<style scoped>.stub { padding: 24px; }</style>
```

Set distinctive `<h2>` text per file (Play / Tree / Codex / More) so we can visually verify tab switching.

- [ ] **Step 4: Mount AppShell from main**

Edit `src/main.ts`. Keep Profectus's existing setup, but mount our shell as the visible UI. The minimum:

```ts
import { createApp } from 'vue';
import './styles/safe-area.css';
import AppShell from './ui/AppShell.vue';
// existing Profectus imports...

const app = createApp(AppShell);
// Apply Profectus plugins, providers, etc. per Task 1 study
app.mount('#app');
```

- [ ] **Step 5: Verify in browser**

Run: `pnpm dev`

Expected: 4 tabs visible at the bottom of an iPhone-sized viewport (use browser dev-tools device emulation, iPhone 14 Pro = 393×852). Tapping each shows the stub content. Safe-area insets respected.

- [ ] **Step 6: Commit**

```bash
git add src/ui/ src/main.ts
git commit -m "feat(ui): iOS tab bar shell with Play/Tree/Codex/More routing"
```

### Task 20: Play tab — masthead, ticker, banner, resources, cards

**Files:**
- Modify: `src/ui/tabs/PlayTab.vue`
- Create: `src/ui/components/Masthead.vue`
- Create: `src/ui/components/Ticker.vue`
- Create: `src/ui/components/EraBanner.vue`
- Create: `src/ui/components/ResourceRow.vue`
- Create: `src/ui/components/GeneratorCard.vue`
- Create: `src/ui/state.ts` (reactive state bridge to game core)

- [ ] **Step 1: Create the reactive state bridge**

Create `src/ui/state.ts`:

```ts
import { reactive, computed } from 'vue';
import era1Raw from '../content/eras/01-antiquity/era.json';
import theme1Raw from '../content/eras/01-antiquity/theme.json';
import ticker1Raw from '../content/eras/01-antiquity/ticker.json';
import copy1Raw from '../content/eras/01-antiquity/copy.json';
import { loadEra } from '../content/loader';
import { ThemeSchema } from '../content/schema';
import { computeCost, generatorProduction } from '../game/era-layer';

const era = loadEra(era1Raw);
const theme = ThemeSchema.parse(theme1Raw);
const ticker = ticker1Raw as { quotes: { id: string; text: string; codex_link: string | null }[]; interval_ms: number };
const copy = copy1Raw as { masthead_title: string; masthead_subtitle: string; resource_labels: Record<string, string>; prestige_button_label: string };

export const state = reactive({
  rumor: 0,
  lifetimeRumor: 0,
  memeticInheritance: 0,
  ownedByGenerator: {} as Record<string, number>,
});

export const currentEra = era;
export const currentTheme = theme;
export const currentTicker = ticker;
export const currentCopy = copy;

export function click(): void {
  state.rumor += 1;
  state.lifetimeRumor += 1;
}

export function buyGenerator(genId: string): boolean {
  const gen = era.generators.find(g => g.id === genId);
  if (!gen) return false;
  const owned = state.ownedByGenerator[genId] ?? 0;
  const cost = computeCost(gen.base_cost, gen.cost_growth, owned);
  if (state.rumor < cost) return false;
  state.rumor -= cost;
  state.ownedByGenerator[genId] = owned + 1;
  return true;
}

export const productionPerSecond = computed(() => {
  let total = 0;
  for (const gen of era.generators) {
    const owned = state.ownedByGenerator[gen.id] ?? 0;
    total += generatorProduction(gen, owned, 1 + state.memeticInheritance * 0.02);
  }
  return total;
});

// Tick loop (replaces or wraps Profectus tick for now)
const TICK_MS = 100;
setInterval(() => {
  const gained = productionPerSecond.value * (TICK_MS / 1000);
  state.rumor += gained;
  state.lifetimeRumor += gained;
}, TICK_MS);
```

> **Profectus integration note:** in production this should bridge to Profectus's reactive state via its provided composables instead of running its own `setInterval`. For Phase 1 MVP this self-contained reactive state is sufficient to validate UI; replace with Profectus integration in a follow-up commit.

- [ ] **Step 2: Create Masthead component**

Create `src/ui/components/Masthead.vue`:

```vue
<script setup lang="ts">
import { currentCopy } from '../state';
</script>

<template>
  <header class="masthead">
    <h1 class="title">{{ currentCopy.masthead_title }}</h1>
    <p class="subtitle">{{ currentCopy.masthead_subtitle }}</p>
  </header>
</template>

<style scoped>
.masthead {
  text-align: center;
  padding: 12px 16px 8px;
  border-bottom: 2px solid var(--theme-border);
  font-family: var(--theme-font-masthead);
}
.title { font-size: 18px; font-weight: 900; letter-spacing: 4px; margin: 0; }
.subtitle { font-size: 9px; letter-spacing: 3px; margin: 4px 0 0; opacity: 0.7; }
</style>
```

- [ ] **Step 3: Create Ticker component**

Create `src/ui/components/Ticker.vue`:

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { currentTicker } from '../state';

const currentIndex = ref(0);
let interval: number;

const pickNext = () => {
  currentIndex.value = (currentIndex.value + 1) % currentTicker.quotes.length;
};

onMounted(() => {
  interval = window.setInterval(pickNext, currentTicker.interval_ms);
});
onUnmounted(() => clearInterval(interval));
</script>

<template>
  <div class="ticker">{{ currentTicker.quotes[currentIndex].text }}</div>
</template>

<style scoped>
.ticker {
  padding: 6px 14px;
  font-size: 11px;
  background: var(--theme-surface);
  color: var(--theme-muted);
  border-bottom: 1px solid var(--theme-border);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: var(--theme-font-masthead);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
</style>
```

- [ ] **Step 4: Create EraBanner**

Create `src/ui/components/EraBanner.vue`:

```vue
<script setup lang="ts">
import { currentEra } from '../state';
</script>

<template>
  <div class="banner">
    <div class="era-name">{{ currentEra.display_name }}</div>
    <div class="era-date">{{ currentEra.date_range }}</div>
  </div>
</template>

<style scoped>
.banner { padding: 10px 16px; background: var(--theme-surface); border-bottom: 1px solid var(--theme-border); }
.era-name { font-family: var(--theme-font-masthead); font-size: 16px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--theme-text); }
.era-date { font-size: 10px; opacity: 0.6; margin-top: 2px; color: var(--theme-muted); }
</style>
```

- [ ] **Step 5: Create ResourceRow**

Create `src/ui/components/ResourceRow.vue`:

```vue
<script setup lang="ts">
import { state, currentCopy, productionPerSecond } from '../state';
import { computed } from 'vue';

const formatted = computed(() => formatNumber(state.rumor));
const perSec = computed(() => formatNumber(productionPerSecond.value));

function formatNumber(n: number): string {
  if (n < 1000) return n.toFixed(0);
  if (n < 1e6) return (n / 1000).toFixed(2) + 'K';
  if (n < 1e9) return (n / 1e6).toFixed(2) + 'M';
  if (n < 1e12) return (n / 1e9).toFixed(2) + 'B';
  return n.toExponential(2);
}
</script>

<template>
  <div class="res-row">
    <div class="cell">
      <div class="val">{{ formatted }}</div>
      <div class="lbl">{{ currentCopy.resource_labels.rumor }}</div>
    </div>
    <div class="cell">
      <div class="val">{{ perSec }}/s</div>
      <div class="lbl">Rate</div>
    </div>
  </div>
</template>

<style scoped>
.res-row { display: flex; padding: 8px 14px; gap: 6px; background: var(--theme-surface); border-bottom: 1px solid var(--theme-border); }
.cell { flex: 1; text-align: center; padding: 4px; border-right: 1px solid var(--theme-border); font-family: var(--theme-font-masthead); }
.cell:last-child { border-right: 0; }
.val { font-weight: 700; font-size: 14px; color: var(--theme-text); }
.lbl { font-size: 8px; opacity: 0.7; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
</style>
```

- [ ] **Step 6: Create GeneratorCard**

Create `src/ui/components/GeneratorCard.vue`:

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { state, buyGenerator, click } from '../state';
import { computeCost } from '../../game/era-layer';
import type { GeneratorTier } from '../../content/schema';

const props = defineProps<{ gen: GeneratorTier }>();

const owned = computed(() => state.ownedByGenerator[props.gen.id] ?? 0);
const cost = computed(() => computeCost(props.gen.base_cost, props.gen.cost_growth, owned.value));
const canAfford = computed(() => state.rumor >= cost.value);

function tap() {
  if (props.gen.is_click_driven) {
    click();
  } else {
    buyGenerator(props.gen.id);
  }
}
</script>

<template>
  <button class="card" :class="{ disabled: !gen.is_click_driven && !canAfford }" @click="tap">
    <div class="head">
      <div class="title">{{ gen.display_name }}</div>
      <div class="cost" v-if="!gen.is_click_driven">{{ Math.ceil(cost) }}</div>
      <div class="cost" v-else>+1</div>
    </div>
    <div class="desc">{{ gen.description }}</div>
    <div class="meta">
      <span class="tag">{{ gen.technique_tag }}</span>
      <span class="owned" v-if="!gen.is_click_driven">×{{ owned }}</span>
    </div>
  </button>
</template>

<style scoped>
.card {
  display: block;
  width: 100%;
  text-align: left;
  background: var(--theme-surface);
  border: 1px solid var(--theme-border);
  padding: 12px 14px;
  margin-bottom: 8px;
  font-family: inherit;
  color: var(--theme-text);
  cursor: pointer;
  transition: opacity 0.1s, transform 0.05s;
}
.card:active { transform: scale(0.985); }
.card.disabled { opacity: 0.45; }
.head { display: flex; justify-content: space-between; align-items: baseline; }
.title { font-family: var(--theme-font-masthead); font-weight: 700; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; }
.cost { font-family: var(--theme-font-masthead); font-weight: 700; font-size: 14px; color: var(--theme-accent); }
.desc { font-size: 11px; opacity: 0.75; margin-top: 4px; font-style: italic; font-family: var(--theme-font-body); }
.meta { display: flex; justify-content: space-between; margin-top: 6px; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.6; }
</style>
```

- [ ] **Step 7: Assemble PlayTab with progressive reveal**

Edit `src/ui/tabs/PlayTab.vue`. The PlayTab filters the generator list by `reveal_at_lifetime` — only generators whose lifetime threshold has been met appear. This is the AdVenture Capitalist "discoverable next tier" mechanic.

```vue
<script setup lang="ts">
import { computed } from 'vue';
import Masthead from '../components/Masthead.vue';
import Ticker from '../components/Ticker.vue';
import EraBanner from '../components/EraBanner.vue';
import ResourceRow from '../components/ResourceRow.vue';
import GeneratorCard from '../components/GeneratorCard.vue';
import { currentEra, state } from '../state';

const visibleGenerators = computed(() =>
  currentEra.generators.filter(gen => state.lifetimeRumor >= gen.reveal_at_lifetime)
);
</script>

<template>
  <div class="play">
    <Masthead />
    <Ticker />
    <EraBanner />
    <ResourceRow />
    <div class="cards">
      <GeneratorCard v-for="gen in visibleGenerators" :key="gen.id" :gen="gen" />
    </div>
  </div>
</template>

<style scoped>
.play { padding-bottom: 80px; }
.cards { padding: 10px 14px; }
</style>
```

**Important:** at session start, `state.lifetimeRumor === 0`, so only `spread-rumor` (Tier 1, `reveal_at_lifetime: 0`) is visible. After ~50 clicks the Forge Naru Tablet card slides in. This is the dopamine loop — see [Spec §8](../specs/2026-05-21-playbook-mvp-design.md#8-era-1-economy-antiquity--reference-implementation) for the full reveal table.

**Optional polish (defer to v0.2):** when a new generator first appears, animate it in (slide-up + fade) rather than popping. A simple `<TransitionGroup>` wrap works.

- [ ] **Step 8: Verify in browser**

Run: `pnpm dev`

Expected: Play tab shows masthead "THE PLAYBOOK", subtitle "DE HISTORIA FALSITATIS", a rotating ticker quote, era banner "Antiquity / ~3000 BCE – 500 CE", a Rumor count, and 5 generator cards. The "Spread Rumor" card is tappable and increments Rumor. The other cards show their cost and are disabled until affordable.

- [ ] **Step 9: Commit**

```bash
git add src/ui/
git commit -m "feat(ui): Play tab with masthead, ticker, banner, resources, generator cards"
```

### Task 21: Codex tab — list of unlocked entries

**Files:**
- Modify: `src/ui/tabs/CodexTab.vue`
- Create: `src/ui/components/CodexList.vue`
- Create: `src/ui/components/CodexEntryView.vue`
- Create: `src/ui/codex-state.ts`

- [ ] **Step 1: Create codex state — load all entries for current era at startup**

Create `src/ui/codex-state.ts`:

```ts
import { reactive, computed } from 'vue';
import { parseCodexEntry } from '../content/codex-parser';
import { state as gameState } from './state';
import { currentEra } from './state';

// In Vite, ?raw imports get the file contents as a string.
const codexFiles = import.meta.glob('../content/eras/01-antiquity/codex/*.md', { eager: true, as: 'raw' }) as Record<string, string>;

const entries = Object.entries(codexFiles).map(([path, raw]) => {
  const entry = parseCodexEntry(raw);
  return { path, ...entry };
});

export const codexState = reactive({
  selectedId: null as string | null,
});

export const visibleEntries = computed(() => {
  return entries.filter(e => {
    const trig = e.frontmatter.unlock_trigger;
    if (trig.type === 'always') return true;
    if (trig.type === 'era_reached') return true; // current era is loaded → unlocked
    if (trig.type === 'generator_owned') {
      const owned = gameState.ownedByGenerator[trig.generator!] ?? 0;
      return owned >= (trig.count ?? 1);
    }
    return false;
  });
});

export const selectedEntry = computed(() =>
  entries.find(e => e.frontmatter.id === codexState.selectedId) ?? null,
);
```

- [ ] **Step 2: Create CodexList**

Create `src/ui/components/CodexList.vue`:

```vue
<script setup lang="ts">
import { visibleEntries, codexState } from '../codex-state';
</script>

<template>
  <ul class="codex-list">
    <li v-for="e in visibleEntries" :key="e.frontmatter.id" @click="codexState.selectedId = e.frontmatter.id">
      <div class="title">{{ e.frontmatter.title }}</div>
      <div class="tags">
        <span v-for="t in e.frontmatter.techniques" :key="t" class="tag">{{ t }}</span>
      </div>
    </li>
    <li v-if="visibleEntries.length === 0" class="empty">No codex entries unlocked yet. Play more to discover the playbook.</li>
  </ul>
</template>

<style scoped>
.codex-list { list-style: none; padding: 0; margin: 0; }
.codex-list li { padding: 14px 16px; border-bottom: 1px solid var(--theme-border); cursor: pointer; }
.codex-list li:active { background: var(--theme-surface); }
.title { font-family: var(--theme-font-masthead); font-weight: 700; font-size: 14px; color: var(--theme-text); }
.tags { display: flex; gap: 6px; margin-top: 4px; }
.tag { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.6; }
.empty { font-style: italic; opacity: 0.6; }
</style>
```

- [ ] **Step 3: Create CodexEntryView**

Create `src/ui/components/CodexEntryView.vue`:

```vue
<script setup lang="ts">
import { selectedEntry, codexState } from '../codex-state';
import { marked } from 'marked';
import { computed } from 'vue';

const html = computed(() => selectedEntry.value ? marked.parse(selectedEntry.value.body) : '');
</script>

<template>
  <div v-if="selectedEntry" class="entry">
    <button class="back" @click="codexState.selectedId = null">← Back</button>
    <h2>{{ selectedEntry.frontmatter.title }}</h2>
    <div class="body" v-html="html"></div>
    <h3>Sources</h3>
    <ul class="sources">
      <li v-for="s in selectedEntry.frontmatter.sources" :key="s.url">
        <a :href="s.url" target="_blank" rel="noopener">{{ s.label }}</a>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.entry { padding: 14px 16px; color: var(--theme-text); font-family: var(--theme-font-body); }
.back { background: none; border: 0; color: var(--theme-muted); padding: 8px 0; font-size: 13px; cursor: pointer; }
h2 { font-family: var(--theme-font-masthead); font-size: 18px; margin: 8px 0 12px; }
.body { font-size: 14px; line-height: 1.55; }
.body :deep(p) { margin: 0 0 12px; }
h3 { font-family: var(--theme-font-masthead); font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 24px 0 8px; opacity: 0.7; }
.sources li { margin-bottom: 6px; font-size: 12px; }
.sources a { color: var(--theme-accent); text-decoration: underline; }
</style>
```

- [ ] **Step 4: Install marked for markdown rendering**

Run: `pnpm add marked`

- [ ] **Step 5: Update CodexTab**

Edit `src/ui/tabs/CodexTab.vue`:

```vue
<script setup lang="ts">
import CodexList from '../components/CodexList.vue';
import CodexEntryView from '../components/CodexEntryView.vue';
import { codexState } from '../codex-state';
</script>

<template>
  <div class="codex-tab">
    <h2 v-if="!codexState.selectedId" class="header">Codex</h2>
    <CodexEntryView v-if="codexState.selectedId" />
    <CodexList v-else />
  </div>
</template>

<style scoped>
.codex-tab { padding-bottom: 80px; }
.header { font-family: var(--theme-font-masthead); font-size: 16px; text-transform: uppercase; letter-spacing: 3px; padding: 14px 16px; margin: 0; border-bottom: 1px solid var(--theme-border); }
</style>
```

- [ ] **Step 6: Verify in browser**

Run: `pnpm dev`

Expected: switch to Codex tab. Initially see "Battle of Kadesh" and "Nero and the Great Fire" entries (era_reached unlock). Buy a Naru Tablet → "Sargon" entry appears. Buy "Smear Rival" → "Octavian" appears. Tap an entry → see its body + source links.

- [ ] **Step 7: Commit**

```bash
git add src/ui/ package.json pnpm-lock.yaml
git commit -m "feat(ui): Codex tab with list, entry view, and source-URL rendering"
```

### Task 22: Tree tab — 6-technique branches

**Files:**
- Modify: `src/ui/tabs/TreeTab.vue`
- Create: `src/ui/components/TechniqueBranch.vue`

- [ ] **Step 1: Implement TreeTab**

Edit `src/ui/tabs/TreeTab.vue`:

```vue
<script setup lang="ts">
import TechniqueBranch from '../components/TechniqueBranch.vue';
import { ALL_TECHNIQUES } from '../../content/types';
import { currentEra } from '../state';
import { computed } from 'vue';

const generatorsByTechnique = computed(() => {
  const map: Record<string, typeof currentEra.generators> = {};
  for (const t of ALL_TECHNIQUES) map[t] = [];
  for (const gen of currentEra.generators) map[gen.technique_tag].push(gen);
  return map;
});
</script>

<template>
  <div class="tree-tab">
    <h2 class="header">The Six Techniques</h2>
    <TechniqueBranch
      v-for="t in ALL_TECHNIQUES"
      :key="t"
      :technique="t"
      :generators="generatorsByTechnique[t]"
      :unlocked="currentEra.techniques_unlocked.includes(t)"
    />
    <p class="footnote">
      Technique taxonomy adapted from Roozenbeek &amp; van der Linden's <em>Bad News</em> research (Cambridge / DROG).
    </p>
  </div>
</template>

<style scoped>
.tree-tab { padding: 0 0 80px; }
.header { font-family: var(--theme-font-masthead); font-size: 16px; text-transform: uppercase; letter-spacing: 3px; padding: 14px 16px; margin: 0; border-bottom: 1px solid var(--theme-border); }
.footnote { font-size: 10px; opacity: 0.5; padding: 16px; line-height: 1.5; font-style: italic; }
</style>
```

- [ ] **Step 2: Implement TechniqueBranch**

Create `src/ui/components/TechniqueBranch.vue`:

```vue
<script setup lang="ts">
import { state } from '../state';
import type { GeneratorTier, TechniqueId } from '../../content/schema';

const props = defineProps<{
  technique: TechniqueId;
  generators: GeneratorTier[];
  unlocked: boolean;
}>();

const TECHNIQUE_LABELS: Record<TechniqueId, string> = {
  impersonation: 'Impersonation',
  emotion: 'Emotion',
  polarization: 'Polarization',
  conspiracy: 'Conspiracy',
  discrediting: 'Discrediting',
  trolling: 'Trolling',
};
</script>

<template>
  <section class="branch" :class="{ locked: !unlocked }">
    <header>
      <h3>{{ TECHNIQUE_LABELS[technique] }}</h3>
      <span v-if="!unlocked" class="lock">Locked</span>
    </header>
    <div v-if="unlocked && generators.length > 0" class="gens">
      <div v-for="gen in generators" :key="gen.id" class="gen">
        <span class="gen-name">{{ gen.display_name }}</span>
        <span class="gen-owned">×{{ state.ownedByGenerator[gen.id] ?? 0 }}</span>
      </div>
    </div>
    <p v-else-if="unlocked" class="empty">No generators in this era.</p>
    <p v-else class="empty">Unlocks in a later era.</p>
  </section>
</template>

<style scoped>
.branch { padding: 14px 16px; border-bottom: 1px solid var(--theme-border); }
.branch.locked { opacity: 0.45; }
header { display: flex; justify-content: space-between; align-items: baseline; }
h3 { font-family: var(--theme-font-masthead); font-size: 14px; text-transform: uppercase; letter-spacing: 2px; margin: 0; }
.lock { font-size: 10px; opacity: 0.6; text-transform: uppercase; letter-spacing: 1px; }
.gens { margin-top: 8px; }
.gen { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; }
.gen-name { font-family: var(--theme-font-body); }
.gen-owned { font-weight: 700; font-family: var(--theme-font-masthead); }
.empty { font-size: 11px; font-style: italic; opacity: 0.6; margin: 8px 0 0; }
</style>
```

- [ ] **Step 3: Verify in browser**

Tap Tree tab. Expect 6 sections (Impersonation, Emotion, Polarization, Conspiracy, Discrediting, Trolling). Impersonation, Discrediting, Trolling are unlocked and show generators with their owned counts. Emotion, Polarization, Conspiracy are dimmed and labeled "Unlocks in a later era." Cambridge/DROG credit footnote visible at bottom.

- [ ] **Step 4: Commit**

```bash
git add src/ui/
git commit -m "feat(ui): Tree tab — 6 technique branches with Cambridge/DROG credit"
```

### Task 23: More tab — Settings + Transparency + About

**Files:**
- Modify: `src/ui/tabs/MoreTab.vue`
- Create: `src/ui/components/TransparencyPage.vue`
- Create: `src/ui/components/AboutPage.vue`
- Create: `src/ui/components/SettingsPage.vue`

- [ ] **Step 1: Implement MoreTab as a sub-navigator**

Edit `src/ui/tabs/MoreTab.vue`:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import TransparencyPage from '../components/TransparencyPage.vue';
import AboutPage from '../components/AboutPage.vue';
import SettingsPage from '../components/SettingsPage.vue';

const page = ref<null | 'transparency' | 'about' | 'settings'>(null);

const ITEMS = [
  { id: 'transparency' as const, label: 'How this game works' },
  { id: 'about' as const, label: 'About & Credits' },
  { id: 'settings' as const, label: 'Settings' },
];
</script>

<template>
  <div class="more">
    <button v-if="page" class="back" @click="page = null">← Back</button>
    <TransparencyPage v-if="page === 'transparency'" />
    <AboutPage v-else-if="page === 'about'" />
    <SettingsPage v-else-if="page === 'settings'" />
    <ul v-else class="menu">
      <li v-for="i in ITEMS" :key="i.id" @click="page = i.id">{{ i.label }}<span class="chev">›</span></li>
    </ul>
  </div>
</template>

<style scoped>
.more { padding: 0 0 80px; }
.back { background: none; border: 0; color: var(--theme-muted); padding: 12px 16px; font-size: 13px; cursor: pointer; }
.menu { list-style: none; padding: 0; margin: 0; }
.menu li { display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid var(--theme-border); font-size: 14px; cursor: pointer; font-family: var(--theme-font-body); }
.chev { opacity: 0.4; font-size: 18px; }
</style>
```

- [ ] **Step 2: TransparencyPage**

Create `src/ui/components/TransparencyPage.vue`:

```vue
<template>
  <article class="page">
    <h2>How this game works</h2>
    <p><strong>What this is.</strong> Playbook is an idle game about the history of disinformation. You play the disinformer rising through eras of history — from forged Roman wills to the AI-saturation era of 2026.</p>

    <p><strong>Why you play the bad guy.</strong> Putting players in the disinformer's seat is an inoculation technique. Research at the University of Cambridge / DROG (Roozenbeek &amp; van der Linden, <em>"Fake news game confers psychological resistance against online misinformation,"</em> 2019) shows that players who briefly practice the techniques become measurably better at spotting them in the wild. Playbook applies that principle across a much longer timeline.</p>

    <p><strong>Where the facts come from.</strong> Every codex entry has at least one cited source URL. We treat citations as non-negotiable: a game about disinformation cannot be loose with facts. If you find a broken link or a misstatement, please report it.</p>

    <p><strong>Who built this.</strong> A solo project by Chris Klopfenstein. No investors, no analytics, no data collection. Your save lives in your own browser.</p>

    <p><strong>AI-generated content.</strong> None of the content in this version was AI-generated. Future updates may include AI-drafted content; if so, each affected era will carry a clear badge identifying it and noting human review.</p>

    <p><strong>Mebro.</strong> This game is built in the spirit of <a href="https://mebro.app" target="_blank" rel="noopener">mebro.app</a>, an independent fact-checking tool by the same author.</p>
  </article>
</template>

<style scoped>
.page { padding: 16px; color: var(--theme-text); font-family: var(--theme-font-body); font-size: 14px; line-height: 1.6; }
.page h2 { font-family: var(--theme-font-masthead); font-size: 18px; margin: 8px 0 16px; }
.page p { margin: 0 0 14px; }
.page a { color: var(--theme-accent); }
</style>
```

- [ ] **Step 3: AboutPage**

Create `src/ui/components/AboutPage.vue`:

```vue
<template>
  <article class="page">
    <h2>About &amp; Credits</h2>
    <h3>Game engine</h3>
    <p><a href="https://github.com/profectus-engine/Profectus" target="_blank" rel="noopener">Profectus</a> by Acamaeda &amp; contributors. MIT-licensed.</p>
    <h3>Math libraries</h3>
    <p><a href="https://github.com/Patashu/break_eternity.js" target="_blank" rel="noopener">break_eternity.js</a> for big-number math. MIT-licensed.</p>
    <h3>Save compression</h3>
    <p><a href="https://github.com/pieroxy/lz-string" target="_blank" rel="noopener">lz-string</a>. MIT-licensed.</p>
    <h3>Technique taxonomy</h3>
    <p>The six manipulation techniques (Impersonation, Emotion, Polarization, Conspiracy, Discrediting, Trolling) are adapted from the <a href="https://inoculation.science/inoculation-games/bad-news/" target="_blank" rel="noopener"><em>Bad News</em></a> research by Jon Roozenbeek &amp; Sander van der Linden at the University of Cambridge / DROG. Published in <a href="https://www.nature.com/articles/s41599-019-0279-9" target="_blank" rel="noopener">Humanities and Social Sciences Communications, 2019</a>.</p>
    <h3>Source material</h3>
    <p>Historical examples are drawn from peer-reviewed and reputable secondary sources; every codex entry carries its own citation. Detailed bibliographies in the project repository.</p>
    <h3>Typography</h3>
    <p>Cinzel, EB Garamond, UnifrakturMaguntia, Playfair Display, Old Standard TT, Rye, Bebas Neue, Oswald, Inter — all via <a href="https://fonts.google.com" target="_blank" rel="noopener">Google Fonts</a>.</p>
    <p class="version">Version 0.1.0</p>
  </article>
</template>

<style scoped>
.page { padding: 16px; color: var(--theme-text); font-family: var(--theme-font-body); font-size: 13px; line-height: 1.6; }
.page h2 { font-family: var(--theme-font-masthead); font-size: 18px; margin: 8px 0 16px; }
.page h3 { font-family: var(--theme-font-masthead); font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 16px 0 4px; opacity: 0.7; }
.page p { margin: 0 0 8px; }
.page a { color: var(--theme-accent); }
.version { opacity: 0.5; margin-top: 24px; font-size: 11px; }
</style>
```

- [ ] **Step 4: SettingsPage with export, import, hard reset**

Create `src/ui/components/SettingsPage.vue`:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { readLocalSave, writeLocalSave, serializeSave, deserializeSave, type SaveState } from '../../game/save';
import { state } from '../state';

const exportText = ref('');
const importText = ref('');
const message = ref('');

function buildState(): SaveState {
  return {
    version: 1,
    current_era: 'antiquity',
    rumor: state.rumor,
    lifetime_rumor: state.lifetimeRumor,
    memetic_inheritance: state.memeticInheritance,
    owned_by_generator: { ...state.ownedByGenerator },
    unlocked_codex: [], // Future: derive from codex-state
    saved_at_ms: Date.now(),
  };
}

function doExport() {
  exportText.value = serializeSave(buildState());
  message.value = 'Exported. Copy the string above to back up your save.';
}

function doImport() {
  try {
    const restored = deserializeSave(importText.value.trim());
    writeLocalSave(restored);
    location.reload();
  } catch (err) {
    message.value = 'Import failed: ' + (err as Error).message;
  }
}

function hardReset() {
  if (!confirm('Permanently erase your save? This cannot be undone.')) return;
  if (!confirm('Are you absolutely sure? This will reset everything.')) return;
  localStorage.removeItem('playbook.save');
  location.reload();
}
</script>

<template>
  <article class="page">
    <h2>Settings</h2>
    <section>
      <h3>Export save</h3>
      <p>Copy this string to back up your progress externally.</p>
      <button @click="doExport">Generate export string</button>
      <textarea v-if="exportText" readonly :value="exportText" rows="4"></textarea>
    </section>
    <section>
      <h3>Import save</h3>
      <p>Paste an exported string to restore.</p>
      <textarea v-model="importText" rows="4" placeholder="paste save string here…"></textarea>
      <button :disabled="!importText.trim()" @click="doImport">Import</button>
    </section>
    <section>
      <h3>Hard reset</h3>
      <p>Erase all progress. Two confirmations required.</p>
      <button class="danger" @click="hardReset">Hard reset</button>
    </section>
    <p v-if="message" class="message">{{ message }}</p>
  </article>
</template>

<style scoped>
.page { padding: 16px; color: var(--theme-text); font-family: var(--theme-font-body); font-size: 13px; line-height: 1.5; }
.page h2 { font-family: var(--theme-font-masthead); font-size: 18px; margin: 8px 0 20px; }
.page section { margin-bottom: 24px; }
.page h3 { font-family: var(--theme-font-masthead); font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 6px; opacity: 0.7; }
button { margin-top: 8px; padding: 10px 16px; background: var(--theme-accent); color: var(--theme-background); border: 0; font-family: inherit; cursor: pointer; }
button.danger { background: #c8141c; color: #fff; }
button:disabled { opacity: 0.4; cursor: not-allowed; }
textarea { display: block; width: 100%; margin-top: 8px; background: var(--theme-surface); color: var(--theme-text); border: 1px solid var(--theme-border); padding: 8px; font-family: monospace; font-size: 11px; }
.message { font-style: italic; opacity: 0.7; margin-top: 16px; }
</style>
```

- [ ] **Step 5: Verify in browser**

Tap More → How this game works → see transparency text. Back → About & Credits → see credits. Back → Settings → export, paste in import field, import succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/ui/
git commit -m "feat(ui): More tab with Transparency, About/Credits, Settings (export/import/hard-reset)"
```

---

## Phase 5 — Theme application (era-evolving typography)

Goal of this phase: theme tokens from `theme.json` are applied to CSS variables; the active era's fonts load via Google Fonts; switching the active era swaps the entire visual treatment.

### Task 24: Theme applier — `theme.json` → CSS custom properties

**Files:**
- Create: `src/ui/theme.ts`
- Modify: `src/main.ts` (call applyTheme on boot)

- [ ] **Step 1: Implement theme applier**

Create `src/ui/theme.ts`:

```ts
import type { Theme } from '../content/schema';

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.style.setProperty('--theme-background', theme.palette.background);
  root.style.setProperty('--theme-surface', theme.palette.surface);
  root.style.setProperty('--theme-text', theme.palette.text);
  root.style.setProperty('--theme-muted', theme.palette.muted);
  root.style.setProperty('--theme-accent', theme.palette.accent);
  root.style.setProperty('--theme-border', theme.palette.border);
  root.style.setProperty('--theme-font-masthead', theme.fonts.masthead);
  root.style.setProperty('--theme-font-body', theme.fonts.body);

  // Load Google Fonts stylesheet if provided
  if (theme.fonts.google_fonts_url) {
    const existingId = 'theme-google-fonts';
    const existing = document.getElementById(existingId) as HTMLLinkElement | null;
    if (existing) existing.remove();
    const link = document.createElement('link');
    link.id = existingId;
    link.rel = 'stylesheet';
    link.href = theme.fonts.google_fonts_url;
    document.head.appendChild(link);
  }

  // Set the body background to the theme color so safe-area pads match
  document.body.style.background = theme.palette.background;
  document.body.style.color = theme.palette.text;
}
```

- [ ] **Step 2: Call applyTheme on boot**

Edit `src/main.ts` (location of `createApp`). Above mount, add:

```ts
import { applyTheme } from './ui/theme';
import { currentTheme } from './ui/state';

applyTheme(currentTheme);
```

- [ ] **Step 3: Verify in browser**

Run: `pnpm dev`

Expected: page now uses Antiquity theme — parchment background, Cinzel masthead font, dark serif body text. Cards have parchment surface.

- [ ] **Step 4: Commit**

```bash
git add src/ui/theme.ts src/main.ts
git commit -m "feat(ui): apply per-era theme tokens to CSS custom properties"
```

### Task 25: Visual smoke test — capture the Era 1 styling

**Files:**
- Create: `screenshots/01-antiquity.png` (manual capture)
- Create: `docs/superpowers/screenshots/README.md`

- [ ] **Step 1: Run dev server in iPhone viewport**

Run: `pnpm dev`

In browser dev tools, switch to iPhone 14 Pro emulation (393×852).

- [ ] **Step 2: Capture screenshots**

Take screenshots of:
- Play tab (with at least 50 Rumor and 1 Forge Naru Tablet purchased so cards and ticker look populated)
- Tree tab
- Codex tab (with 1+ entries visible)
- Codex entry detail (open Octavian)
- More tab → Transparency page

Save to `screenshots/v0.1-phase4/{play,tree,codex,entry,transparency}.png`.

- [ ] **Step 3: Document where screenshots live**

Create `docs/superpowers/screenshots/README.md`:

```markdown
# Screenshots

`screenshots/v0.1-phase4/` — captured after Phase 4 (UI shell + Era 1 content). iPhone 14 Pro viewport.
```

- [ ] **Step 4: Commit**

```bash
git add screenshots/ docs/superpowers/screenshots/
git commit -m "docs(screenshots): Phase 4 visual baseline (Era 1, iPhone viewport)"
```

---

## Phase 6 — Eras 2 & 3 + prestige transitions

Goal of this phase: Era 2 (Printing Press) and Era 3 (Penny Press) content authored to the same schema; prestige actually carries the player between eras; theme swaps on transition; all 6 techniques unlocked by end of Era 3.

### Task 26: Author Era 2 (Printing Press) content

**Files:**
- Create: `src/content/eras/02-printing-press/{era.json, theme.json, ticker.json, copy.json}`
- Create: `src/content/eras/02-printing-press/codex/{6 entries}`

- [ ] **Step 1: Author `era.json` for Printing Press**

Create `src/content/eras/02-printing-press/era.json`:

```json
{
  "id": "printing-press",
  "ordinal": 2,
  "date_range": "~1450 – 1800",
  "display_name": "Printing Press",
  "theme_id": "printing-press-blackletter",
  "techniques_unlocked": ["impersonation", "discrediting", "trolling", "polarization", "conspiracy"],
  "generators": [
    {
      "id": "compose-broadside",
      "tier": 1,
      "display_name": "Compose Broadside",
      "description": "Set type by hand. Tap to gain 1 Rumor.",
      "technique_tag": "polarization",
      "resource": "rumor",
      "base_cost": 0,
      "cost_growth": 1.07,
      "base_production": 0,
      "is_click_driven": true,
      "auto_unlock_at": 10,
      "auto_operative_name": "Apprentice Printer",
      "milestones": [25, 50, 100, 200, 300, 400],
      "codex_link": null
    },
    {
      "id": "print-pamphlet",
      "tier": 2,
      "display_name": "Print Pamphlet",
      "description": "Vernacular polemic, cheap to copy. Generates Rumor.",
      "technique_tag": "polarization",
      "resource": "rumor",
      "base_cost": 1250,
      "cost_growth": 1.07,
      "base_production": 35,
      "is_click_driven": false,
      "auto_unlock_at": 0,
      "auto_operative_name": "Pamphleteer",
      "milestones": [25, 50, 100, 200, 300, 400],
      "codex_link": "luther-pamphlet-war"
    },
    {
      "id": "commission-woodcut",
      "tier": 2,
      "display_name": "Commission Woodcut",
      "description": "Image is argument. Compounds Rumor production.",
      "technique_tag": "impersonation",
      "resource": "rumor",
      "base_cost": 6250,
      "cost_growth": 1.10,
      "base_production": 350,
      "is_click_driven": false,
      "auto_unlock_at": 0,
      "auto_operative_name": "Cranach Workshop",
      "milestones": [25, 50, 100, 200, 300, 400],
      "codex_link": "cranach-pope-antichrist"
    },
    {
      "id": "forge-decree",
      "tier": 3,
      "display_name": "Forge Decree",
      "description": "Fake the document; let the press copy it. The Donation of Constantine pattern.",
      "technique_tag": "impersonation",
      "resource": "rumor",
      "base_cost": 31250,
      "cost_growth": 1.10,
      "base_production": 3500,
      "is_click_driven": false,
      "auto_unlock_at": 0,
      "auto_operative_name": "Forger-in-Residence",
      "milestones": [25, 50, 100, 200, 300, 400],
      "codex_link": "donation-of-constantine"
    },
    {
      "id": "witch-pamphlet",
      "tier": 3,
      "display_name": "Witch-Hunt Manual",
      "description": "Manufactured authority + moral panic. Malleus Maleficarum scale.",
      "technique_tag": "conspiracy",
      "resource": "rumor",
      "base_cost": 50000,
      "cost_growth": 1.10,
      "base_production": 5000,
      "is_click_driven": false,
      "auto_unlock_at": 0,
      "auto_operative_name": "Inquisitor",
      "milestones": [25, 50, 100, 200, 300, 400],
      "codex_link": "malleus-maleficarum"
    },
    {
      "id": "newsbook-press",
      "tier": 4,
      "display_name": "Newsbook Press",
      "description": "Weekly partisan periodical. The Mercurius template.",
      "technique_tag": "polarization",
      "resource": "rumor",
      "base_cost": 156250,
      "cost_growth": 1.12,
      "base_production": 35000,
      "is_click_driven": false,
      "auto_unlock_at": 0,
      "auto_operative_name": "Marchamont Nedham",
      "milestones": [25, 50, 100, 200, 300, 400],
      "codex_link": "english-civil-war-newsbooks"
    }
  ],
  "prestige_into": "penny-press",
  "prestige_bridge_copy": "Steam arrives. Paper grows cheap. The pamphlet becomes the newspaper, and the newspaper becomes the front page."
}
```

- [ ] **Step 2: Author `theme.json` for Printing Press**

Create `src/content/eras/02-printing-press/theme.json`:

```json
{
  "id": "printing-press-blackletter",
  "era_id": "printing-press",
  "fonts": {
    "masthead": "'UnifrakturMaguntia', 'EB Garamond', Georgia, serif",
    "body": "'EB Garamond', Georgia, serif",
    "google_fonts_url": "https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=EB+Garamond:ital,wght@0,400;0,700;1,400&display=swap"
  },
  "palette": {
    "background": "#ece4d2",
    "surface": "#e3d8be",
    "text": "#1a1410",
    "muted": "#6b5a40",
    "accent": "#1a1410",
    "border": "#1a1410"
  },
  "card_style": "flat-paper"
}
```

- [ ] **Step 3: Author `copy.json` and `ticker.json` for Printing Press**

Create `src/content/eras/02-printing-press/copy.json`:

```json
{
  "masthead_title": "The Playbook",
  "masthead_subtitle": "A Chronicle of Falsehoods Printed and Sold",
  "resource_labels": { "rumor": "Rumour", "reach": "Reach", "cred": "Cred." },
  "prestige_button_label": "Onward, to the Press of the People",
  "prestige_confirm_title": "Cross the Threshold?",
  "prestige_confirm_body": "Thy types shall be melted. Thy pamphlets pulped. What carries forward is the playbook itself."
}
```

Create `src/content/eras/02-printing-press/ticker.json`:

```json
{
  "quotes": [
    { "id": "luther", "text": "Luther's pamphlets sold over 7,000 editions in five years.", "codex_link": "luther-pamphlet-war" },
    { "id": "donation", "text": "Lorenzo Valla proved the Donation of Constantine was a forgery — using grammar.", "codex_link": "donation-of-constantine" },
    { "id": "malleus", "text": "Heinrich Kramer forged co-authorship and a fake Cologne endorsement for his witch-hunt manual.", "codex_link": "malleus-maleficarum" },
    { "id": "popish-plot", "text": "Titus Oates fabricated a Catholic plot to murder the king. 22 innocent men hanged.", "codex_link": "popish-plot" },
    { "id": "franklin", "text": "Benjamin Franklin forged an entire fake newspaper to seed atrocity stories into the British press.", "codex_link": "franklin-fake-newspaper" },
    { "id": "boston-massacre", "text": "Paul Revere altered Henry Pelham's engraving of the Boston Massacre to taint the jury pool.", "codex_link": "boston-massacre" }
  ],
  "interval_ms": 8000,
  "no_repeat_within": 3
}
```

- [ ] **Step 4: Author 6 codex entries for Printing Press**

Create 6 markdown files in `src/content/eras/02-printing-press/codex/`, each following the same frontmatter format as Era 1, drawing from `research/eras/02-printing-press.md`:

1. `luther-pamphlet-war.md` (Luther & Cranach, polarization+conspiracy)
2. `donation-of-constantine.md` (Valla's debunk of the forgery, impersonation)
3. `malleus-maleficarum.md` (Kramer's forged authority, conspiracy)
4. `popish-plot.md` (Titus Oates' fabricated Jesuit plot, conspiracy+discrediting)
5. `franklin-fake-newspaper.md` (Franklin's 1782 forged Boston Independent Chronicle, impersonation)
6. `boston-massacre.md` (Revere's altered engraving, polarization+discrediting)

For each, use the body text from `research/eras/02-printing-press.md` Section 2 entries, and pull source URLs from the same file's references. Apply the same frontmatter shape used in Task 11. Every entry MUST include at least one `sources` URL — schema enforces it.

- [ ] **Step 5: Validate**

Run:
```bash
pnpm tsx scripts/validate-era.ts src/content/eras/02-printing-press/era.json
pnpm tsx scripts/validate-theme.ts src/content/eras/02-printing-press/theme.json
pnpm check:links
```

Expected: all 3 commands exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/content/eras/02-printing-press/
git commit -m "feat(content): Printing Press era (6 generators, 6 codex entries, blackletter theme)"
```

### Task 27: Author Era 3 (Penny Press) content

**Files:**
- Create: `src/content/eras/03-penny-press/{era.json, theme.json, ticker.json, copy.json}`
- Create: `src/content/eras/03-penny-press/codex/{6 entries}`

- [ ] **Step 1: Author `era.json` for Penny Press**

Create `src/content/eras/03-penny-press/era.json`. This is the era that unlocks **emotion** (the final technique). Generator economy follows Pecorella's ratios (base costs ~5× the prior era's tier-4):

```json
{
  "id": "penny-press",
  "ordinal": 3,
  "date_range": "~1800 – 1914",
  "display_name": "Penny Press",
  "theme_id": "penny-press-victorian",
  "techniques_unlocked": ["impersonation", "discrediting", "trolling", "polarization", "conspiracy", "emotion"],
  "generators": [
    {
      "id": "set-headline",
      "tier": 1,
      "display_name": "Set a Headline",
      "description": "Pick the most lurid noun. Tap to gain 1 Rumor.",
      "technique_tag": "emotion",
      "resource": "rumor",
      "base_cost": 0,
      "cost_growth": 1.07,
      "base_production": 0,
      "is_click_driven": true,
      "auto_unlock_at": 10,
      "auto_operative_name": "Copy Boy",
      "milestones": [25, 50, 100, 200, 300, 400],
      "codex_link": null
    },
    {
      "id": "manufactured-scoop",
      "tier": 2,
      "display_name": "Manufactured Scoop",
      "description": "Invent breaking news. Steady Rumor production.",
      "technique_tag": "emotion",
      "resource": "rumor",
      "base_cost": 6250,
      "cost_growth": 1.07,
      "base_production": 175,
      "is_click_driven": false,
      "auto_unlock_at": 0,
      "auto_operative_name": "Stringer",
      "milestones": [25, 50, 100, 200, 300, 400],
      "codex_link": "great-moon-hoax"
    },
    {
      "id": "wire-service-plant",
      "tier": 2,
      "display_name": "Wire-Service Plant",
      "description": "One dispatch hits 200 papers overnight.",
      "technique_tag": "polarization",
      "resource": "rumor",
      "base_cost": 31250,
      "cost_growth": 1.10,
      "base_production": 1750,
      "is_click_driven": false,
      "auto_unlock_at": 0,
      "auto_operative_name": "AP Editor",
      "milestones": [25, 50, 100, 200, 300, 400],
      "codex_link": "hearst-pulitzer-maine"
    },
    {
      "id": "halftone-engraving",
      "tier": 3,
      "display_name": "Halftone Engraving",
      "description": "Photographic 'proof' on the front page. Compounds Rumor.",
      "technique_tag": "emotion",
      "resource": "rumor",
      "base_cost": 156250,
      "cost_growth": 1.10,
      "base_production": 17500,
      "is_click_driven": false,
      "auto_unlock_at": 0,
      "auto_operative_name": "Engraver",
      "milestones": [25, 50, 100, 200, 300, 400],
      "codex_link": "hearst-pulitzer-maine"
    },
    {
      "id": "patent-medicine-ad",
      "tier": 3,
      "display_name": "Patent Medicine Ad",
      "description": "Native advertising's grandparent. Pinkham's pattern.",
      "technique_tag": "impersonation",
      "resource": "rumor",
      "base_cost": 250000,
      "cost_growth": 1.10,
      "base_production": 25000,
      "is_click_driven": false,
      "auto_unlock_at": 0,
      "auto_operative_name": "Pinkham Heir",
      "milestones": [25, 50, 100, 200, 300, 400],
      "codex_link": "pinkham-patent-medicine"
    },
    {
      "id": "okhrana-forgery",
      "tier": 4,
      "display_name": "Okhrana Forgery",
      "description": "State secret-police fabrication. The Protocols template.",
      "technique_tag": "conspiracy",
      "resource": "rumor",
      "base_cost": 781250,
      "cost_growth": 1.12,
      "base_production": 175000,
      "is_click_driven": false,
      "auto_unlock_at": 0,
      "auto_operative_name": "Rachkovsky",
      "milestones": [25, 50, 100, 200, 300, 400],
      "codex_link": "protocols-elders-of-zion"
    }
  ],
  "prestige_into": null,
  "prestige_bridge_copy": "End of Phase 1. The 20th century — radio, film, total propaganda states — waits in Phase 2."
}
```

- [ ] **Step 2: Author `theme.json` for Penny Press**

Create `src/content/eras/03-penny-press/theme.json`:

```json
{
  "id": "penny-press-victorian",
  "era_id": "penny-press",
  "fonts": {
    "masthead": "'Playfair Display', 'Old Standard TT', 'Times New Roman', serif",
    "body": "'Old Standard TT', Georgia, serif",
    "google_fonts_url": "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Old+Standard+TT:wght@400;700&family=Rye&display=swap"
  },
  "palette": {
    "background": "#f4f1ea",
    "surface": "#ebe6db",
    "text": "#1a1a1a",
    "muted": "#5a5a5a",
    "accent": "#c8141c",
    "border": "#1a1a1a"
  },
  "card_style": "broadsheet"
}
```

- [ ] **Step 3: Author `copy.json` and `ticker.json` for Penny Press**

Create `src/content/eras/03-penny-press/copy.json`:

```json
{
  "masthead_title": "THE PLAYBOOK",
  "masthead_subtitle": "EXTRA · DAILY EDITION · ONE CENT",
  "resource_labels": { "rumor": "Rumor", "reach": "Reach", "cred": "Cred" },
  "prestige_button_label": "End of Phase 1",
  "prestige_confirm_title": "End of the Run",
  "prestige_confirm_body": "Phase 1 is complete. Era 4 (Propaganda State) arrives in the next content drop."
}
```

Create `src/content/eras/03-penny-press/ticker.json`:

```json
{
  "quotes": [
    { "id": "moon-hoax", "text": "The 1835 Great Moon Hoax sold out the New York Sun every day for a week.", "codex_link": "great-moon-hoax" },
    { "id": "maine", "text": "Hearst and Pulitzer manufactured a war over the USS Maine in 1898.", "codex_link": "hearst-pulitzer-maine" },
    { "id": "lost-cause", "text": "The United Daughters of the Confederacy vetted Southern history textbooks for decades.", "codex_link": "lost-cause" },
    { "id": "wilmington", "text": "In 1898, newspapers engineered the only successful coup d'état on US soil.", "codex_link": "wilmington-coup" },
    { "id": "dreyfus", "text": "Zola's 'J'accuse…!' sold 200,000 copies in Paris in a single day.", "codex_link": "dreyfus-affair" },
    { "id": "protocols", "text": "The Protocols of the Elders of Zion was forged by the Tsarist secret police in 1903.", "codex_link": "protocols-elders-of-zion" }
  ],
  "interval_ms": 8000,
  "no_repeat_within": 3
}
```

- [ ] **Step 4: Author 6 codex entries for Penny Press**

Create 6 markdown files in `src/content/eras/03-penny-press/codex/`, drawing from `research/eras/03-penny-press.md`:

1. `great-moon-hoax.md` (1835 NY Sun fabrication, emotion+impersonation)
2. `hearst-pulitzer-maine.md` (1898 yellow journalism, emotion+polarization)
3. `lost-cause.md` (UDC textbook capture, polarization)
4. `wilmington-coup.md` (1898 press-engineered coup, polarization+discrediting)
5. `dreyfus-affair.md` (state-leak laundering, conspiracy+discrediting)
6. `protocols-elders-of-zion.md` (Okhrana forgery, conspiracy)

Plus optionally:
7. `pinkham-patent-medicine.md` (parasocial native advertising, impersonation)

Each entry must include source URLs from `research/eras/03-penny-press.md` §5.

- [ ] **Step 5: Validate**

Run:
```bash
pnpm tsx scripts/validate-era.ts src/content/eras/03-penny-press/era.json
pnpm tsx scripts/validate-theme.ts src/content/eras/03-penny-press/theme.json
pnpm check:links
```

Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/content/eras/03-penny-press/
git commit -m "feat(content): Penny Press era (6 generators, 7 codex entries, Victorian theme)"
```

### Task 28: Multi-era state + prestige transition

**Files:**
- Modify: `src/ui/state.ts`
- Create: `src/ui/components/PrestigeTransition.vue`
- Modify: `src/ui/tabs/PlayTab.vue`

- [ ] **Step 1: Restructure state to support multiple eras**

Edit `src/ui/state.ts`:

```ts
import { reactive, computed, ref } from 'vue';
import era1Raw from '../content/eras/01-antiquity/era.json';
import era2Raw from '../content/eras/02-printing-press/era.json';
import era3Raw from '../content/eras/03-penny-press/era.json';
import theme1Raw from '../content/eras/01-antiquity/theme.json';
import theme2Raw from '../content/eras/02-printing-press/theme.json';
import theme3Raw from '../content/eras/03-penny-press/theme.json';
import ticker1Raw from '../content/eras/01-antiquity/ticker.json';
import ticker2Raw from '../content/eras/02-printing-press/ticker.json';
import ticker3Raw from '../content/eras/03-penny-press/ticker.json';
import copy1Raw from '../content/eras/01-antiquity/copy.json';
import copy2Raw from '../content/eras/02-printing-press/copy.json';
import copy3Raw from '../content/eras/03-penny-press/copy.json';
import { loadEra } from '../content/loader';
import { ThemeSchema } from '../content/schema';
import { computeCost, generatorProduction } from '../game/era-layer';
import { computeMemeticInheritance, carryoverMultiplier } from '../game/prestige';
import { applyTheme } from './theme';

const ERAS = {
  antiquity: { era: loadEra(era1Raw), theme: ThemeSchema.parse(theme1Raw), ticker: ticker1Raw as any, copy: copy1Raw as any },
  'printing-press': { era: loadEra(era2Raw), theme: ThemeSchema.parse(theme2Raw), ticker: ticker2Raw as any, copy: copy2Raw as any },
  'penny-press': { era: loadEra(era3Raw), theme: ThemeSchema.parse(theme3Raw), ticker: ticker3Raw as any, copy: copy3Raw as any },
};

export const state = reactive({
  currentEraId: 'antiquity' as 'antiquity' | 'printing-press' | 'penny-press',
  rumor: 0,
  lifetimeRumor: 0,
  memeticInheritance: 0,
  ownedByGenerator: {} as Record<string, number>,
});

export const currentEra = computed(() => ERAS[state.currentEraId].era);
export const currentTheme = computed(() => ERAS[state.currentEraId].theme);
export const currentTicker = computed(() => ERAS[state.currentEraId].ticker);
export const currentCopy = computed(() => ERAS[state.currentEraId].copy);

export function click(): void {
  state.rumor += 1;
  state.lifetimeRumor += 1;
}

export function buyGenerator(genId: string): boolean {
  const gen = currentEra.value.generators.find(g => g.id === genId);
  if (!gen) return false;
  const owned = state.ownedByGenerator[genId] ?? 0;
  const cost = computeCost(gen.base_cost, gen.cost_growth, owned);
  if (state.rumor < cost) return false;
  state.rumor -= cost;
  state.ownedByGenerator[genId] = owned + 1;
  return true;
}

export const productionPerSecond = computed(() => {
  let total = 0;
  for (const gen of currentEra.value.generators) {
    const owned = state.ownedByGenerator[gen.id] ?? 0;
    total += generatorProduction(gen, owned, carryoverMultiplier(state.memeticInheritance));
  }
  return total;
});

export const projectedMI = computed(() => computeMemeticInheritance(state.lifetimeRumor));
export const canPrestige = computed(() => projectedMI.value >= 1);

export function performPrestige(): void {
  const newMI = projectedMI.value;
  state.memeticInheritance += newMI;
  state.rumor = 0;
  state.lifetimeRumor = 0;
  state.ownedByGenerator = {};
  const nextEra = currentEra.value.prestige_into;
  if (nextEra && (nextEra === 'antiquity' || nextEra === 'printing-press' || nextEra === 'penny-press')) {
    state.currentEraId = nextEra;
    applyTheme(currentTheme.value);
  }
}

// Re-apply theme whenever era changes externally (e.g. on save load)
// In practice this is called once at boot and again on prestige.

const TICK_MS = 100;
setInterval(() => {
  const gained = productionPerSecond.value * (TICK_MS / 1000);
  state.rumor += gained;
  state.lifetimeRumor += gained;
}, TICK_MS);
```

- [ ] **Step 2: Create PrestigeTransition component**

Create `src/ui/components/PrestigeTransition.vue`:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { state, currentEra, currentCopy, projectedMI, performPrestige, canPrestige } from '../state';

const confirming = ref(false);

function start() { confirming.value = true; }
function cancel() { confirming.value = false; }
function confirm() {
  confirming.value = false;
  performPrestige();
}
</script>

<template>
  <div v-if="canPrestige" class="prestige">
    <button v-if="!confirming" class="btn" @click="start">
      {{ currentCopy.prestige_button_label }} <span class="mi">(+{{ Math.floor(projectedMI) }} MI)</span>
    </button>
    <div v-else class="modal-backdrop" @click.self="cancel">
      <div class="modal">
        <h3>{{ currentCopy.prestige_confirm_title }}</h3>
        <p>{{ currentEra.prestige_bridge_copy }}</p>
        <p class="emphasis">{{ currentCopy.prestige_confirm_body }}</p>
        <p class="gain">You will gain <strong>{{ Math.floor(projectedMI) }}</strong> Memetic Inheritance.</p>
        <div class="row">
          <button class="cancel" @click="cancel">Stay</button>
          <button class="go" @click="confirm">Cross the Threshold</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.prestige { padding: 16px; }
.btn { display: block; width: 100%; background: var(--theme-accent); color: var(--theme-background); border: 0; padding: 14px; font-family: var(--theme-font-masthead); font-size: 14px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; cursor: pointer; }
.mi { font-weight: 400; opacity: 0.9; margin-left: 8px; }
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 16px; }
.modal { background: var(--theme-surface); padding: 24px; max-width: 380px; width: 100%; color: var(--theme-text); font-family: var(--theme-font-body); }
.modal h3 { font-family: var(--theme-font-masthead); font-size: 18px; margin: 0 0 12px; }
.modal p { font-size: 14px; line-height: 1.5; margin: 0 0 12px; }
.emphasis { font-style: italic; }
.gain { font-size: 16px; }
.row { display: flex; gap: 12px; margin-top: 20px; }
.row button { flex: 1; padding: 12px; font-family: inherit; font-size: 13px; cursor: pointer; }
.cancel { background: var(--theme-surface); color: var(--theme-text); border: 1px solid var(--theme-border); }
.go { background: var(--theme-accent); color: var(--theme-background); border: 0; font-weight: 700; }
</style>
```

- [ ] **Step 3: Add PrestigeTransition to PlayTab**

Edit `src/ui/tabs/PlayTab.vue` to include `<PrestigeTransition />` after the cards.

```vue
<script setup lang="ts">
import Masthead from '../components/Masthead.vue';
import Ticker from '../components/Ticker.vue';
import EraBanner from '../components/EraBanner.vue';
import ResourceRow from '../components/ResourceRow.vue';
import GeneratorCard from '../components/GeneratorCard.vue';
import PrestigeTransition from '../components/PrestigeTransition.vue';
import { currentEra } from '../state';
</script>

<template>
  <div class="play">
    <Masthead />
    <Ticker />
    <EraBanner />
    <ResourceRow />
    <div class="cards">
      <GeneratorCard v-for="gen in currentEra.generators" :key="gen.id" :gen="gen" />
    </div>
    <PrestigeTransition />
  </div>
</template>

<style scoped>
.play { padding-bottom: 80px; }
.cards { padding: 10px 14px; }
</style>
```

- [ ] **Step 4: Verify multi-era playthrough**

Run: `pnpm dev`

Play Era 1 fast (use browser console: `state.lifetimeRumor = 1e15` to force-prestige). Tap "Ascend to the Press" → confirm. Watch:
- The theme swap from parchment/Cinzel to aged-paper/Blackletter
- The Era 2 generators appear
- The Codex tab shows Era 2 entries (the Era 1 ones are no longer present — that's expected for MVP; multi-era codex persistence is post-Phase-1)
- The Tree tab now shows Polarization and Conspiracy as unlocked

Repeat for Era 2 → Era 3.

- [ ] **Step 5: Commit**

```bash
git add src/ui/
git commit -m "feat(game): multi-era state + prestige transition with theme swap"
```

---

## Phase 7 — PWA + ship

Goal of this phase: installable PWA with manifest, service worker, offline support, app icons. Ready to host.

### Task 29: Configure vite-plugin-pwa with manifest and service worker

**Files:**
- Modify: `vite.config.ts`
- Create: `public/icons/icon-192.png` (192×192)
- Create: `public/icons/icon-512.png` (512×512)
- Create: `public/icons/icon-maskable-512.png` (512×512, maskable)
- Create: `public/favicon.svg`

- [ ] **Step 1: Generate app icons**

Use a simple favicon generator (e.g., https://realfavicongenerator.net) or design icons manually. The icons should be the Playbook "P" mark on the era-1 parchment background, or simply a bold serif "P" centered on a dark square for a neutral identity. Sizes required:

- `public/icons/icon-192.png` — 192×192
- `public/icons/icon-512.png` — 512×512
- `public/icons/icon-maskable-512.png` — 512×512 with safe zone padding (https://maskable.app for verification)
- `public/favicon.svg` — vector favicon

If you don't have a designer-quality mark ready, create a placeholder: a black square with a Cinzel "P" centered. This is acceptable for v0.1; refine in v0.2.

- [ ] **Step 2: Configure vite-plugin-pwa**

Edit `vite.config.ts` (preserve any existing Profectus config; add PWA plugin):

```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Playbook: A History of Disinformation',
        short_name: 'Playbook',
        description: 'An incremental game about the history of disinformation.',
        theme_color: '#212121',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        scope: './',
        start_url: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json,md}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
});
```

If the existing `vite.config.ts` has additional Profectus plugins or config, preserve them — only add the `VitePWA(...)` entry and the import.

- [ ] **Step 3: Build production bundle**

Run: `pnpm build`

Expected: `dist/` directory created with bundled assets, `sw.js`, `manifest.webmanifest`. Build logs show `vite-plugin-pwa` registering the service worker.

- [ ] **Step 4: Preview production build locally**

Run: `pnpm preview`

Open: localhost:4173 (default Vite preview port)

In Chrome DevTools → Application tab → Manifest: verify all icons load, theme color is `#212121`, display is `standalone`, name reads "Playbook: A History of Disinformation."

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts public/icons public/favicon.svg
git commit -m "feat(pwa): manifest, service worker, app icons, Google Fonts caching"
```

### Task 30: Final smoke test + ship-ready check

**Files:**
- Create: `docs/superpowers/release-notes/v0.1.0.md`

- [ ] **Step 1: Run all validation suites**

```bash
pnpm vitest run
pnpm tsc --noEmit
pnpm check:links
pnpm build
```

Expected: all 4 commands exit 0.

- [ ] **Step 2: Verify success criteria from spec §17 manually**

Check each:

1. Three eras playable end-to-end — manual play: Era 1 → prestige → Era 2 → prestige → Era 3 reachable
2. First prestige in 30–60 minutes — play once at intended pace, verify timing falls in window
3. Era 3 reachable within 3 hours — extrapolate from the first run + tier-4 cost scaling
4. PWA installs on iPhone — open `pnpm preview` URL on iPhone Safari → Share → Add to Home Screen → app launches in standalone (no Safari chrome)
5. All 6 techniques active by end of Era 3 — Tree tab shows none "Locked" once in Era 3
6. All codex source URLs reachable — `pnpm check:links` passed
7. Save survives browser restart — manually verified during dev; verify once more in preview build
8. 60fps on mid-range mobile — open Chrome DevTools → Performance → Record 10 seconds of play on iPhone 12 emulation → frame chart shows steady 60fps with no long tasks

If any criterion fails, fix before tagging.

- [ ] **Step 3: Write release notes**

Create `docs/superpowers/release-notes/v0.1.0.md`:

```markdown
# v0.1.0 — Phase 1 MVP

First public version. Mobile-first PWA.

## Eras shipped

- Era I — Antiquity (~3000 BCE – 500 CE)
- Era II — Printing Press (~1450 – 1800)
- Era III — Penny Press (~1800 – 1914)

## Mechanics

- iOS tab-bar layout (Play / Tree / Codex / More)
- 5–6 generators per era with AdVenture-Capitalist-derived cost curves
- Tier-1 click-driven, auto-operative unlock at 10 owned
- Milestone multipliers at 25 / 50 / 100 / 200 / 300 / 400 (×2 each)
- Prestige between eras: sqrt-on-lifetime formula yields Memetic Inheritance
- Per-era theme: typography, palette, masthead chrome change with the era

## Educational layer

- News ticker (real cited facts per era)
- Codex with 19 entries across 3 eras, every entry sourced
- Transparency page explaining how the game works
- About / Credits with full attribution to Cambridge / DROG, Profectus, and source authors

## Out of scope (Phase 2+)

- Eras 4–12 (Propaganda State, Cold War, Early Internet, Social Media, Cambridge Analytica, Pandemic, AI Era, Present)
- Audio
- Mebro reveal mechanic
- AI-generated content pipeline
- Mode B / Mode C player frames

## Known limitations

- Codex unlocked in a prior era is hidden when that era is left behind (multi-era persistence is Phase 2 work)
- Save schema migrations untested (no `version` bumps yet)
- Profectus engine integration is partial — the game runs on a self-contained reactive state for Phase 1 and bridges to Profectus's tick system in a follow-up
```

- [ ] **Step 4: Tag the release**

```bash
git add docs/superpowers/release-notes/v0.1.0.md
git commit -m "docs(release): v0.1.0 release notes"
git tag -a v0.1.0 -m "Phase 1 MVP — 3 eras playable, PWA-installable"
```

- [ ] **Step 5: Deploy target (manual)**

Choose one and deploy:
- **GitHub Pages:** push to GitHub, enable Pages on the repo, point at `dist/` via Actions (or build locally and push to `gh-pages` branch)
- **Vercel:** `vercel deploy` from repo root after `vercel login`
- **Netlify:** drag `dist/` onto netlify.com/drop

Verify the deployed URL loads, installs as PWA, and Era 1 plays end-to-end.

- [ ] **Step 6: Commit deployment artifact**

If deployment generated a config (e.g. `vercel.json`, `netlify.toml`), commit it:

```bash
git add .
git commit -m "chore(deploy): production deployment configuration"
git push --tags
```

---

## Self-review summary

**Spec coverage:**
- §1 Vision → Tasks 1–30 (whole plan)
- §2 Non-goals → respected throughout (no reveal hooks, no audio, no AI generation, no eras 4–12)
- §3 Player frame → Task 23 (transparency page mentions "you play the disinformer"), content files keep player-identity copy swappable
- §4 Stack → Tasks 1, 3, 29 (Profectus, zod, lz-string, vite-plugin-pwa, Google Fonts all installed)
- §5 Content-driven architecture → Tasks 4–7, 8–12, 26–27 (schemas, validation, content directories per era)
- §6 Math → Tasks 13–15 (cost curves, milestones, prestige formula all tested)
- §7 Six techniques → Tasks 8, 22, 26, 27 (each era's `techniques_unlocked` array; Tree tab visualizes)
- §8 Era 1 economy → Task 8 (era.json)
- §9 Layout (iOS tab bar) → Tasks 19, 20
- §10 Visual aesthetic → Tasks 9, 24, 26, 27 (theme.json per era + applier)
- §11 News ticker → Tasks 10, 20, 26, 27
- §12 Codex → Tasks 6, 11, 21, 26, 27 (parser, content, UI)
- §13 Save/load → Task 18
- §14 PWA → Task 29
- §15 Transparency page → Task 23
- §16 Out-of-scope deferrals → preserved
- §17 Success criteria → Task 30 verification list
- §18 Open questions → left for implementation as designed

**Placeholder scan:** Found and removed where they crept in. Profectus-integration tasks (Tasks 16, 17) note behavioral spec + redirect to engine docs, which is honest direction not placeholder. Tasks 26–27 list codex file IDs and source pointers rather than fully writing the body markdown — this is intentional because the bodies are paragraphs from `research/eras/02-printing-press.md` and `03-penny-press.md` which the implementer copies forward. If the implementer wants the full text inline, the research docs are the source of truth.

**Type consistency:** Resource IDs (`rumor`, `reach`, `cred`, `memetic_inheritance`), Era IDs (`antiquity`, `printing-press`, `penny-press`), Technique IDs (6 lowercase strings) consistent across `types.ts`, `schema.ts`, `era.json` files, and UI components.

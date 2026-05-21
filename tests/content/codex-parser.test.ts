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

import { load as yamlLoad } from 'js-yaml';
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

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;

/**
 * Parses a Codex markdown file with YAML frontmatter delimited by `---`.
 *
 * We use js-yaml + regex directly rather than gray-matter because gray-matter
 * relies on Node's Buffer API, which breaks in browser builds.
 */
export function parseCodexEntry(rawMarkdown: string): CodexEntry {
  const match = rawMarkdown.match(FRONTMATTER_RE);
  if (!match) {
    throw new CodexValidationError(
      'Codex file is missing YAML frontmatter delimiters (--- ... ---)',
    );
  }
  const [, frontmatterRaw, body] = match;
  let parsed: unknown;
  try {
    parsed = yamlLoad(frontmatterRaw);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new CodexValidationError(`Codex YAML frontmatter could not be parsed:\n  ${message}`);
  }
  const result = CodexFrontmatterSchema.safeParse(parsed);
  if (!result.success) {
    const summary = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new CodexValidationError(`Codex frontmatter failed validation:\n${summary}`);
  }
  return {
    frontmatter: result.data,
    body: body.trim(),
  };
}

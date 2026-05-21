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
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new CodexValidationError(`Codex frontmatter failed validation:\n${summary}`);
  }
  return {
    frontmatter: result.data,
    body: parsed.content.trim(),
  };
}

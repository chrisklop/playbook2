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

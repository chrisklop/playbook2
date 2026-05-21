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
